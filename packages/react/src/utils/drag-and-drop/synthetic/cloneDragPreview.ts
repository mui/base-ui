import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { warn } from '@base-ui/utils/warn';
import { isElement, isShadowRoot } from '@floating-ui/utils/dom';
import {
  capturePreviewStyles,
  isEngineOwnedProperty,
  isPreviewRootProperty,
} from './previewStyles';
import { getSharedSlot } from '../sharedState';
import * as DraggablePreviewCssVars from '../../../draggable/preview/DraggablePreviewCssVars';
import * as DraggablePreviewDataAttributes from '../../../draggable/preview/DraggablePreviewDataAttributes';
import * as DraggableRootDataAttributes from '../../../draggable/root/DraggableRootDataAttributes';
import {
  PREVIEW_ELEMENT_ATTRIBUTE,
  adoptStyleSheet,
  getComposedParentElement,
  getDragEventRoot,
  getElementScale,
  getElementZoom,
  getOrCreate,
  getOwnZoom,
  getSubtreeElements,
} from '../utils';
import type { DraggablePosition } from '../../../draggable/DraggableProvider';
import { COMPUTED_MATRIX, getOwnLinearTransform } from '../linearTransform';

/**
 * Properties the clone must not inherit. The engine writes `translate` every frame, so a
 * `transition` would make the preview trail the pointer and an `animation` would pin it.
 * A `transform` (a source grabbed mid-FLIP) is already in the measured rect and would
 * shift the clone off the grab anchor. `rotate` and `scale` stay: they don't move the
 * preview (see `writePosition`), and clearing them in the unlayered neutralizer would
 * lock out consumers' layered CSS.
 */
const MOTION_PROPERTIES = ['transition', 'animation'];
const NEUTRALIZED_PROPERTIES = [...MOTION_PROPERTIES, 'transform'];

// The inline declarations of a custom preview root that offset it from its position
// (see `readOwnOffset`). The engine's own `margin` and `translate` replace them.
const OWN_OFFSET_PROPERTIES = ['margin-top', 'margin-left', 'translate'];

/**
 * Reaches only the clone's root, not its descendants or a custom preview's root (see
 * `neutralizeTranslateTransition`). At (0,1,0), with `:where()` hiding the `:not()`, it
 * beats the source's `.Card { transition }` on source order, yet a consumer's
 * `.Card[data-drag-preview]` still wins without `!important`. Motion is cleared only
 * until the drop, or this unlayered rule would beat a layered ending transition and the
 * preview would jump back (`prepareForDrop` handles shared source motion instead).
 */
const NEUTRALIZER_CSS =
  `[${PREVIEW_ELEMENT_ATTRIBUTE}="clone"]{transform:none}` +
  `[${PREVIEW_ELEMENT_ATTRIBUTE}="clone"]:where(:not([${DraggablePreviewDataAttributes.endingStyle}])){${MOTION_PROPERTIES.map((p) => `${p}:none`).join(';')}}`;

/**
 * Constructable sheets, since CSP `style-src` doesn't apply to them. One per
 * document or shadow root, since document styles don't cross shadow boundaries.
 */
const neutralizerSheets = getSharedSlot(
  'dragPreviewNeutralizerSheets',
  () => new WeakMap<DocumentOrShadowRoot, CSSStyleSheet>(),
);

/** Whether a computed `transition` or `animation` would animate anything. */
function hasActiveMotion(property: string, style: CSSStyleDeclaration): boolean {
  if (property === 'transition') {
    return (style.transitionDuration || '0s')
      .split(',')
      .some((duration) => Number.parseFloat(duration) > 0);
  }
  return (style.animationName || 'none').split(',').some((name) => name.trim() !== 'none');
}

/**
 * A polyfilled `showPopover` in a browser without the Popover API leaves
 * `:popover-open` unparseable, so `matches` throws. The polyfill keeps its own
 * state, so the preview is treated as open.
 */
function isPopoverOpen(element: HTMLElement): boolean {
  try {
    return element.matches(':popover-open');
  } catch {
    return true;
  }
}

function ensureNeutralizerStyles(host: PreviewHost): void {
  // `isShadowRoot` is realm-safe. `instanceof` fails for a shadow root in an iframe
  // or popout, so the sheet would land on the document and miss the preview.
  const target = isShadowRoot(host) ? host : getDragEventRoot(host);
  if (!('adoptedStyleSheets' in target)) {
    return;
  }
  const sheet = getOrCreate(neutralizerSheets, target, () => {
    const created = new (ownerWindow(host).CSSStyleSheet)();
    created.replaceSync(NEUTRALIZER_CSS);
    return created;
  });
  // Re-adopt every time. An app that assigns a new `adoptedStyleSheets` array (on a
  // theme switch, say) drops the sheet.
  adoptStyleSheet(target, sheet);
}

export interface DragPreviewElementHandle {
  /** The preview element, which follows the pointer in the top layer. */
  readonly element: HTMLElement;
  /** Where the preview was built, reused when it is rebuilt mid-drag. */
  readonly anchor: PreviewAnchor;
  /** Move the preview's top-left corner to these viewport coordinates. */
  setPosition(x: number, y: number): void;
  /**
   * Re-home the preview if its parent was torn out mid-drag (a virtualizer recycling
   * the row). Cheap enough to call every frame.
   */
  ensureConnected(): void;
  /**
   * Replace the root's own inline style with `ownStyle`, put the engine's attributes
   * and declarations back on top, and re-measure against the new cascade.
   */
  updateContentStyle(ownStyle: string): void;
  destroy(): void;
  /** Restore motion rules before the ending-style transition is measured. */
  prepareForDrop(): void;
}

type PreviewHost = HTMLElement | ShadowRoot;

export const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';
const previewIds = getSharedSlot('dragPreviewIds', () => ({ next: 0 }));

/**
 * The node the preview is appended to. A direct child of a shadow root has no
 * `parentElement`, so the shadow root is used, which keeps the same styles.
 */
function hostOf(node: Node): PreviewHost | null {
  const parent = node.parentNode;
  if (parent && isShadowRoot(parent)) {
    return parent;
  }
  return node.parentElement;
}

/**
 * A custom element can't be cloned inertly: `cloneNode` runs its constructor, and
 * connecting runs its lifecycle callbacks. An undefined name counts too, since a
 * definition registered mid-drag would upgrade the clone.
 */
function isCustomElementCandidate(element: Element): boolean {
  return (
    element.namespaceURI === HTML_NAMESPACE &&
    (element.localName.includes('-') || element.getAttribute('is')?.includes('-') === true)
  );
}

/**
 * Copied onto a custom element's placeholder: its box, painted surface, and place in
 * a flex or grid parent. The placeholder has no shadow content, so the other few
 * hundred computed properties would only cost a `setProperty` each.
 */
const PLACEHOLDER_STYLE_PROPERTIES = [
  'display',
  'box-sizing',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'background-color',
  'background-image',
  'background-position',
  'background-size',
  'background-repeat',
  'background-clip',
  'background-origin',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-transform',
  'text-decoration',
  'white-space',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'align-self',
  'justify-self',
  'order',
  'grid-row-start',
  'grid-row-end',
  'grid-column-start',
  'grid-column-end',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'visibility',
  'opacity',
];

/**
 * Clone a tree, replacing custom elements with inert `div` placeholders styled with
 * their computed box (see `isCustomElementCandidate`).
 */
function cloneWithoutCustomElements(
  source: HTMLElement,
  win: Window & typeof globalThis,
): { element: HTMLElement; sourceNodes: Element[]; cloneNodes: Element[] } {
  const sourceNodes: Element[] = [];
  const cloneNodes: Element[] = [];

  function cloneNode(node: Node): Node {
    if (!isElement(node)) {
      return node.cloneNode(false);
    }

    const isCustom = isCustomElementCandidate(node);
    const copy = isCustom
      ? ownerDocument(node).createElement('div')
      : (node.cloneNode(false) as Element);
    if (isCustom) {
      for (const attribute of Array.from(node.attributes)) {
        if (attribute.name !== 'is') {
          copy.setAttribute(attribute.name, attribute.value);
        }
      }
      const computed = win.getComputedStyle(node);
      const placeholderStyle = (copy as HTMLElement).style;
      for (const property of PLACEHOLDER_STYLE_PROPERTIES) {
        const value = computed.getPropertyValue(property);
        if (value !== '') {
          placeholderStyle.setProperty(property, value);
        }
      }
    }

    sourceNodes.push(node);
    cloneNodes.push(copy);
    for (const child of Array.from(node.childNodes)) {
      copy.appendChild(cloneNode(child));
    }
    return copy;
  }

  return {
    element: cloneNode(source) as HTMLElement,
    sourceNodes,
    cloneNodes,
  };
}

/**
 * Neutralizes copied nodes so they can't act as the originals. A source clone runs
 * it once. A custom preview's copy runs it again on every node and attribute that
 * changes.
 */
export interface PreviewSanitizer {
  /**
   * Stop a copied element from loading, playing, submitting, or joining the page's
   * radio groups and accordions. Safe to repeat on the same element.
   */
  neutralize(node: Element): void;
  /** Give a copied element's `id` the preview suffix. Call once per new `id` value. */
  rewriteId(node: Element): void;
  /** Point `for`, ARIA, `href` and `url(#…)` references at rewritten ids. Safe to repeat. */
  remapReferences(node: Element): void;
  /** How many ids were rewritten so far. References need remapping when it grows. */
  readonly rewrittenIdCount: number;
}

/** Attributes that can hold `url(#id)` references. */
const URL_REFERENCE_ATTRIBUTES = [
  'clip-path',
  'filter',
  'mask',
  'marker',
  'marker-start',
  'marker-mid',
  'marker-end',
  'fill',
  'stroke',
];

const ARIA_REFERENCE_ATTRIBUTES = [
  'aria-labelledby',
  'aria-describedby',
  'aria-controls',
  'aria-owns',
];

export interface PreviewSanitizerOptions {
  /**
   * Whether a copied `id` can stay. By default every id is rewritten, since a clone
   * duplicates its source's. Custom content keeps an id the page doesn't use.
   */
  keepId?: ((id: string) => boolean) | undefined;
}

export function createPreviewSanitizer(options: PreviewSanitizerOptions = {}): PreviewSanitizer {
  const { keepId } = options;
  // Duplicate ids break `getElementById`, `<label for>` and `aria-labelledby`, so
  // they get a suffix and references inside the copy follow. `#id` selectors don't
  // style the preview as a result.
  const rewritten = new Map<string, string>();
  const idSuffix = `-drag-preview-${previewIds.next}`;
  previewIds.next += 1;
  const remap = (value: string) => rewritten.get(value) ?? value;
  const remapUrlFragments = (value: string) =>
    value.replace(/url\(\s*(['"]?)#([^\s)'"]+)\1\s*\)/g, (match, quote, id) => {
      const next = rewritten.get(id);
      return next ? `url(${quote}#${next}${quote})` : match;
    });

  return {
    get rewrittenIdCount() {
      return rewritten.size;
    },
    neutralize(node) {
      switch (node.localName) {
        case 'iframe':
          node.removeAttribute('src');
          // `srcdoc` wins over `src` and would load the document, scripts included,
          // on every drag.
          node.removeAttribute('srcdoc');
          break;
        case 'object':
          // An `<object>` or `<embed>` would refetch its resource and run its
          // scripts on every drag.
          node.removeAttribute('data');
          node.setAttribute('form', '');
          break;
        case 'input':
        case 'select':
        case 'textarea':
        case 'button':
        case 'fieldset':
        case 'output':
          // An empty owner keeps the enabled look without joining the source's form
          // or its validation, even through `form="id"`.
          node.setAttribute('form', '');
          break;
        case 'embed':
          node.removeAttribute('src');
          break;
        case 'video':
        case 'audio':
          node.removeAttribute('autoplay');
          node.setAttribute('preload', 'none');
          break;
        case 'img':
          // A lazy image wouldn't load while the preview is parked off-screen, so it
          // would flash empty.
          if (node.hasAttribute('loading')) {
            node.setAttribute('loading', 'eager');
          }
          break;
        default:
          break;
      }

      // A shared `name` would let a checked radio uncheck the original, an open
      // `<details>` close the source's accordion, or a named `<form>` turn
      // `document[name]` into a collection. A `<slot>` keeps it, since a nameless
      // slot would take the host's unassigned children.
      if (node.localName !== 'slot') {
        node.removeAttribute('name');
      }
    },
    rewriteId(node) {
      const id = node.getAttribute('id');
      // An id rewritten once stays rewritten, so references already remapped to it
      // keep working.
      if (id && (rewritten.has(id) || !keepId?.(id))) {
        const next = `${id}${idSuffix}`;
        rewritten.set(id, next);
        node.setAttribute('id', next);
      }
    },
    remapReferences(node) {
      if (rewritten.size === 0) {
        return;
      }
      const update = (
        name: string,
        transform: (value: string) => string,
        namespace: string | null = null,
      ) => {
        const value = node.getAttributeNS(namespace, name);
        if (value !== null) {
          const next = transform(value);
          if (next !== value) {
            node.setAttributeNS(namespace, namespace ? `xlink:${name}` : name, next);
          }
        }
      };
      const remapFragment = (value: string) =>
        value.startsWith('#') ? `#${remap(value.slice(1))}` : value;
      update('for', remap);
      for (const attribute of ARIA_REFERENCE_ATTRIBUTES) {
        update(attribute, (value) => value.split(/\s+/).map(remap).join(' '));
      }
      update('href', remapFragment);
      update('href', remapFragment, XLINK_NAMESPACE);
      for (const attribute of URL_REFERENCE_ATTRIBUTES) {
        update(attribute, remapUrlFragments);
      }
      if (node.getAttribute('style')?.includes('url(')) {
        remapInlineStyleUrls(node, remapUrlFragments);
      }
    },
  };
}

/** Strip state the clone must not carry, and neutralize nodes that would re-run. */
function sanitize(clone: HTMLElement, cloneNodes: Element[]): void {
  const sanitizer = createPreviewSanitizer();
  for (const node of cloneNodes) {
    // Unstarted scripts must not execute when the preview is inserted.
    if (node.localName === 'script' && node !== clone) {
      node.remove();
      continue;
    }
    sanitizer.neutralize(node);
    sanitizer.rewriteId(node);
  }
  if (sanitizer.rewrittenIdCount > 0) {
    for (const node of cloneNodes) {
      sanitizer.remapReferences(node);
    }
  }
}

/**
 * Goes through the CSSOM, since a strict CSP without `'unsafe-inline'` blocks
 * `setAttribute('style', …)` but not `style.setProperty`.
 */
function remapInlineStyleUrls(node: Element, remap: (value: string) => string): void {
  const style = (node as Partial<ElementCSSInlineStyle>).style;
  if (style) {
    for (let i = 0; i < style.length; i += 1) {
      const name = style[i];
      const value = style.getPropertyValue(name);
      const next = remap(value);
      if (next !== value) {
        style.setProperty(name, next, style.getPropertyPriority(name));
      }
    }
  }
}

/**
 * Copy state held outside attributes: field values, checkedness, a select's
 * selection, an open `<details>`, canvas pixels. Cloning keeps only some of it, and
 * no mutation reports it. Uses the source window's constructors for iframes and
 * popouts.
 */
export function copyElementState(
  from: Element,
  to: Node | undefined,
  win: Window & typeof globalThis,
): void {
  if (from instanceof win.HTMLInputElement && to instanceof win.HTMLInputElement) {
    if (from.type !== 'file' && to.value !== from.value) {
      to.value = from.value;
    }
    to.checked = from.checked;
    to.indeterminate = from.indeterminate;
  } else if (from instanceof win.HTMLTextAreaElement && to instanceof win.HTMLTextAreaElement) {
    if (to.value !== from.value) {
      to.value = from.value;
    }
  } else if (from instanceof win.HTMLSelectElement && to instanceof win.HTMLSelectElement) {
    Array.from(from.options).forEach((option, index) => {
      const copy = to.options[index];
      if (copy && copy.selected !== option.selected) {
        copy.selected = option.selected;
      }
    });
  } else if (from instanceof win.HTMLDetailsElement && to instanceof win.HTMLDetailsElement) {
    if (to.open !== from.open) {
      to.open = from.open;
    }
  } else if (from instanceof win.HTMLCanvasElement && to instanceof win.HTMLCanvasElement) {
    // `drawImage` works on a detached canvas and is far cheaper than `toDataURL()`.
    try {
      const context = to.getContext('2d');
      context?.clearRect(0, 0, to.width, to.height);
      context?.drawImage(from, 0, 0);
    } catch {
      // A tainted, WebGL or offscreen-transferred canvas can't be read. Leave the
      // copy blank rather than fail the drag.
    }
  }
}

/**
 * Copy the state cloning leaves out (see `copyElementState`). Runs before
 * sanitization removes nodes, so the lists still pair up. Scroll offsets need
 * layout, so the returned function applies them after insertion.
 */
function copyLiveState(
  sourceNodes: Element[],
  cloneNodes: Element[],
  win: Window & typeof globalThis,
): () => void {
  const scrolls: Array<{ node: HTMLElement; top: number; left: number }> = [];

  for (let i = 0; i < sourceNodes.length; i += 1) {
    const from = sourceNodes[i];
    const to = cloneNodes[i];
    copyElementState(from, to, win);
    if (
      from instanceof win.HTMLElement &&
      to instanceof win.HTMLElement &&
      (from.scrollTop !== 0 || from.scrollLeft !== 0)
    ) {
      scrolls.push({ node: to, top: from.scrollTop, left: from.scrollLeft });
    }
  }

  return () => {
    for (const { node, top, left } of scrolls) {
      scrollInstantly(node, top, left);
    }
  };
}

/** The computed `transform-origin` in pixels. A part that doesn't parse is `NaN`. */
function readTransformOrigin(style: CSSStyleDeclaration): DraggablePosition {
  const parts = style.transformOrigin.split(/\s+/);
  return { x: Number.parseFloat(parts[0]), y: Number.parseFloat(parts[1]) };
}

type InlineDeclaration = [name: string, value: string, priority: string];

/** The inline value and priority `style` holds for each of `names`. */
function readInlineDeclarations(
  style: CSSStyleDeclaration,
  names: readonly string[],
): InlineDeclaration[] {
  return names.map((name) => [name, style.getPropertyValue(name), style.getPropertyPriority(name)]);
}

/** Write back declarations read by `readInlineDeclarations`. Empty ones stay unset. */
function writeInlineDeclarations(
  style: CSSStyleDeclaration,
  declarations: readonly InlineDeclaration[],
): void {
  for (const [name, value, priority] of declarations) {
    if (value) {
      style.setProperty(name, value, priority);
    }
  }
}

/**
 * Under `scroll-behavior: smooth`, a `scrollTop` write animates, so the preview
 * would show the top of the scroller and scroll again on each re-home.
 */
function scrollInstantly(node: HTMLElement, top: number, left: number): void {
  if (typeof node.scrollTo === 'function') {
    try {
      node.scrollTo({ top, left, behavior: 'instant' });
      return;
    } catch {
      // Browsers that predate the `instant` value reject it. Fall through.
    }
  }
  node.scrollTop = top;
  node.scrollLeft = left;
}

const TABLE_ROW_PARTS = new Set([
  'table-row',
  'table-row-group',
  'table-header-group',
  'table-footer-group',
]);

/**
 * `position: fixed` blockifies a table row or row group, so its cells lay out in an
 * anonymous table sized to their content. Pin each cell to its used width (exact under
 * `border-collapse: collapse`; separated borders add the outer `border-spacing`).
 * Returns a writer to run once the clone is inserted, or `null` for a non-row source.
 */
function captureTableCellWidths(
  source: Element,
  clonesBySource: ReadonlyMap<Element, Element>,
  win: Window & typeof globalThis,
): (() => void) | null {
  const display = win.getComputedStyle(source).display;
  if (!TABLE_ROW_PARTS.has(display)) {
    return null;
  }
  const rows = display === 'table-row' ? [source] : Array.from(source.children);
  const widths: Array<{ cell: Element | undefined; width: string }> = [];
  for (const row of rows) {
    // Only the source's own cells. A table nested in a cell lays itself out.
    for (const cell of Array.from(row.children)) {
      const style = win.getComputedStyle(cell);
      if (style.display === 'table-cell') {
        widths.push({ cell: clonesBySource.get(cell), width: style.width });
      }
    }
  }
  return () => {
    for (const { cell, width } of widths) {
      if (cell instanceof win.HTMLElement) {
        cell.style.width = width;
      }
    }
  };
}

interface PreparedDragPreviewClone {
  element: HTMLElement;
  /** The source's elements in tree order. */
  sourceNodes: Element[];
  /** Each of `sourceNodes` to its clone. */
  clonesBySource: Map<Element, Element>;
  applyPostInsertion: () => void;
}

function prepareDragPreviewClone(
  source: HTMLElement,
  win: Window & typeof globalThis,
): PreparedDragPreviewClone {
  const queriedSourceNodes = getSubtreeElements(source);
  let element: HTMLElement;
  let sourceNodes: Element[];
  let cloneNodes: Element[];
  if (queriedSourceNodes.some(isCustomElementCandidate)) {
    ({ element, sourceNodes, cloneNodes } = cloneWithoutCustomElements(source, win));
  } else {
    element = source.cloneNode(true) as HTMLElement;
    sourceNodes = queriedSourceNodes;
    cloneNodes = getSubtreeElements(element);
  }
  // Drop previews in a `container` inside the source, or `Draggable.updatePreview()`
  // would nest them.
  const previewNodes = new Set<Element>();
  for (const node of cloneNodes) {
    if (node !== element && node.hasAttribute(PREVIEW_ELEMENT_ATTRIBUTE)) {
      for (const subtreeNode of getSubtreeElements(node)) {
        previewNodes.add(subtreeNode);
      }
      node.remove();
    }
  }
  if (previewNodes.size > 0) {
    const kept = cloneNodes.map((node) => !previewNodes.has(node));
    sourceNodes = sourceNodes.filter((_, index) => kept[index]);
    cloneNodes = cloneNodes.filter((_, index) => kept[index]);
  }

  const applyPostInsertion = copyLiveState(sourceNodes, cloneNodes, win);
  sanitize(element, cloneNodes);
  element.removeAttribute(DraggableRootDataAttributes.dragging);
  // Set while the previous preview settles. A
  // `[data-settling] { color: transparent }` rule would hide the preview's text.
  element.removeAttribute(DraggableRootDataAttributes.settling);
  // The clone is appended last, so an `<ol>` would number it as the last item.
  if (!element.hasAttribute('value')) {
    const ordinal = getListItemOrdinal(source);
    if (ordinal !== null) {
      element.setAttribute('value', String(ordinal));
    }
  }

  const clonesBySource = new Map<Element, Element>();
  sourceNodes.forEach((node, index) => clonesBySource.set(node, cloneNodes[index]));
  return { element, sourceNodes, clonesBySource, applyPostInsertion };
}

/** The number an `<ol>` gives `item`, or `null` when it is not an item of an `<ol>`. */
function getListItemOrdinal(item: Element): number | null {
  const list = item.parentElement;
  if (item.localName !== 'li' || list?.localName !== 'ol') {
    return null;
  }
  const items = Array.from(list.children).filter(
    (child) => child.localName === 'li' && !child.hasAttribute(PREVIEW_ELEMENT_ATTRIBUTE),
  );
  const reversed = list.hasAttribute('reversed');
  let ordinal = Number.parseInt(list.getAttribute('start') ?? '', 10);
  if (!Number.isFinite(ordinal)) {
    ordinal = reversed ? items.length : 1;
  }
  for (const child of items) {
    const value = Number.parseInt(child.getAttribute('value') ?? '', 10);
    if (Number.isFinite(value)) {
      ordinal = value;
    }
    if (child === item) {
      return ordinal;
    }
    ordinal += reversed ? -1 : 1;
  }
  return null;
}

/**
 * Whether a computed `transform` only translates. Computed transforms resolve to
 * matrix form, so that is an identity matrix apart from `m41`/`m42`/`m43`.
 */
function isTranslationOnly(transform: string): boolean {
  const matrix = transform.match(COMPUTED_MATRIX);
  if (!matrix) {
    return false;
  }
  const values = matrix[2].split(',').map(Number);
  if (matrix[1]) {
    // Column-major: the diagonal is at 0, 5, 10 and 15, the translation at 12 to 14.
    return (
      values.length === 16 &&
      values.every((value, i) => (i >= 12 && i <= 14) || value === (i % 5 === 0 ? 1 : 0))
    );
  }
  // matrix(a, b, c, d, tx, ty): a/d scale, b/c shear, tx/ty translate.
  return (
    values.length === 6 && values[0] === 1 && values[1] === 0 && values[2] === 0 && values[3] === 1
  );
}

function getUntransformedSourceRect(
  rect: DOMRect,
  width: number,
  height: number,
  sourceStyle: CSSStyleDeclaration,
  win: Window & typeof globalThis,
  ancestorScale: DraggablePosition,
): DOMRect {
  const fallback = () =>
    new win.DOMRect(
      rect.x + (rect.width - width) / 2,
      rect.y + (rect.height - height) / 2,
      width,
      height,
    );
  const matrix = getOwnLinearTransform(sourceStyle, true);
  const { x: originX, y: originY } = readTransformOrigin(sourceStyle);
  if (!matrix || !Number.isFinite(originX) || !Number.isFinite(originY)) {
    return fallback();
  }

  // An affine transform maps the box's center to the center of its transformed
  // bounding box. Undo that displacement around the real `transform-origin`, which
  // plain re-centering gets wrong for a non-center origin.
  const centerX = width / (2 * ancestorScale.x);
  const centerY = height / (2 * ancestorScale.y);
  const relativeX = centerX - originX;
  const relativeY = centerY - originY;
  const transformedCenterX = originX + matrix.a * relativeX + matrix.c * relativeY;
  const transformedCenterY = originY + matrix.b * relativeX + matrix.d * relativeY;

  return new win.DOMRect(
    rect.x + rect.width / 2 - transformedCenterX * ancestorScale.x,
    rect.y + rect.height / 2 - transformedCenterY * ancestorScale.y,
    width,
    height,
  );
}

/**
 * The source's untransformed border-box size in its own CSS pixels. The computed
 * size keeps the subpixels `offsetWidth`/`offsetHeight` round off, but is trusted
 * only within 1px of them: it is `auto` on an inline box, and Chromium leaves a
 * classic scrollbar out of the computed content width.
 */
function getUntransformedBorderBox(
  source: HTMLElement,
  style: CSSStyleDeclaration,
): { width: number; height: number } {
  const px = (value: string) => Number.parseFloat(value) || 0;
  const isBorderBox = style.boxSizing === 'border-box';
  const measure = (size: string, rounded: number, edges: string[]) => {
    const value = Number.parseFloat(size);
    if (!Number.isFinite(value)) {
      return rounded;
    }
    const exact = isBorderBox ? value : edges.reduce((sum, edge) => sum + px(edge), value);
    return Math.abs(exact - rounded) < 1 ? exact : rounded;
  };
  return {
    width: measure(style.width, source.offsetWidth, [
      style.paddingLeft,
      style.paddingRight,
      style.borderLeftWidth,
      style.borderRightWidth,
    ]),
    height: measure(style.height, source.offsetHeight, [
      style.paddingTop,
      style.paddingBottom,
      style.borderTopWidth,
      style.borderBottomWidth,
    ]),
  };
}

/** Measure the layout anchor in viewport coordinates, undoing the source's own transform. */
export function measurePreviewSource(source: HTMLElement): {
  sourceRect: DOMRect;
  scale: DraggablePosition;
} {
  // `getBoundingClientRect` includes the source's own transform, and the clone keeps
  // `rotate`/`scale`, so a transformed source is measured from its untransformed
  // border box. The individual properties don't fold into the computed `transform`,
  // so each is checked. Otherwise a `scale: 1.5` hover lift would compound to 2.25x.
  const win = ownerWindow(source);
  const rect = source.getBoundingClientRect();
  const sourceStyle = win.getComputedStyle(source);
  // Translation doesn't resize the box, so it is ignored. The rect's size is then
  // right, and keeps the subpixels `offsetWidth` rounds off.
  const hasTransform =
    (sourceStyle.transform !== '' &&
      sourceStyle.transform !== 'none' &&
      !isTranslationOnly(sourceStyle.transform)) ||
    (sourceStyle.scale !== '' && sourceStyle.scale !== 'none') ||
    (sourceStyle.rotate !== '' && sourceStyle.rotate !== 'none');
  const parent = getComposedParentElement(source) as HTMLElement | null;
  const parentScale = parent ? getElementScale(parent) : { x: 1, y: 1 };
  const ownZoom = getOwnZoom(source, sourceStyle);
  const ancestorScale = { x: parentScale.x * ownZoom, y: parentScale.y * ownZoom };
  const layoutSize = hasTransform ? getUntransformedBorderBox(source, sourceStyle) : null;
  const width = layoutSize ? layoutSize.width * ancestorScale.x : rect.width;
  const height = layoutSize ? layoutSize.height * ancestorScale.y : rect.height;
  // Pair the untransformed size with the position found by undoing the transform.
  // The `'source'` offset and `--drag-source-*` variables must describe the
  // preview's box, or it jumps on pickup.
  const sourceRect = hasTransform
    ? getUntransformedSourceRect(rect, width, height, sourceStyle, win, ancestorScale)
    : rect;

  return { sourceRect, scale: ancestorScale };
}

/** Where a drag's preview goes and the box it starts from, measured once at pickup. */
export interface PreviewAnchor {
  /** The source's border box at pickup, without its own transform (see `measurePreviewSource`). */
  sourceRect: DOMRect;
  /** The source's ancestor scale at pickup, `zoom` included. */
  sourceScale: DraggablePosition;
  /**
   * Where the preview can go, nearest first: the `container` or the source's parent,
   * then their ancestors up to `documentElement`, which outlives any subtree the app
   * tears down. A preview built or re-homed mid-drag uses the first one still
   * connected, keeping as much of the cascade as possible.
   */
  hosts: PreviewHost[];
  /** Whether the preview goes into a `container` instead of beside the source. */
  inContainer: boolean;
  /**
   * The source's `slot`. A source assigned to a named slot sits in a shadow host's
   * light DOM, where an unassigned child is not rendered.
   */
  slot: string | null;
}

/**
 * Runs at pickup, before `data-dragging` rules can change the source's box. Returns
 * `null` for a detached or parentless source, and the drag runs without a preview.
 */
export function measurePreviewAnchor(
  source: HTMLElement,
  requestedContainer: HTMLElement | null,
): PreviewAnchor | null {
  let container = requestedContainer;
  // Viewport coordinates don't carry across documents, so a container in another
  // document would offset the preview by the frame's position.
  if (container && ownerDocument(container) !== ownerDocument(source)) {
    if (process.env.NODE_ENV !== 'production') {
      warn(
        'a drag preview `container` belongs to a different document than its draggable. ' +
          'Viewport coordinates do not carry across documents, so the preview would be offset by the frame position. ' +
          "Rendering the preview in place instead. Pass a container from the draggable's own document.",
      );
    }
    container = null;
  }

  const host = container ?? hostOf(source);
  if (!host || !source.isConnected) {
    return null;
  }
  const hosts: PreviewHost[] = [];
  for (let node: PreviewHost | null = host; node !== null;) {
    hosts.push(node);
    // Stepping out through a shadow host leaves the shadow cascade behind. Re-homing
    // only reaches that far once the shadow root itself is gone.
    node = isShadowRoot(node) ? (node.host as HTMLElement) : hostOf(node);
  }
  const { sourceRect, scale } = measurePreviewSource(source);
  return {
    sourceRect,
    sourceScale: scale,
    hosts,
    inContainer: container !== null,
    slot: source.getAttribute('slot'),
  };
}

/**
 * The children lists accept. React validates nesting in tables and selects (see
 * `createPreviewContentContainer`) but not lists, so Base UI warns for those.
 */
const LIST_CHILDREN: Record<string, readonly string[]> = {
  ul: ['li'],
  ol: ['li'],
  menu: ['li'],
  dl: ['dt', 'dd', 'div'],
};

/** The computed transition of an element, to tell whether a rule changed it. */
function getTransitionSignature(computed: CSSStyleDeclaration): string {
  return [
    computed.transitionProperty,
    computed.transitionDuration,
    computed.transitionDelay,
    computed.transitionTimingFunction,
  ].join('|');
}

/**
 * Whether the engine owns a property on the preview, so a change the top layer
 * brings to it is expected rather than restored.
 */
function isEnginePositionedProperty(name: string): boolean {
  return (
    name.startsWith('--') ||
    name === 'overlay' ||
    isPreviewRootProperty(name) ||
    isEngineOwnedProperty(name)
  );
}

/**
 * Build the element that follows the pointer: a clone of the source, or a copy of custom
 * `content`. Appending it unwrapped to the source's parent keeps inherited styles and
 * child selectors applying and a `<tr>` valid, but shifts the siblings' `:last-child`
 * (a `container` avoids that). `popover="manual"` lifts it into the top layer, past
 * ancestor transforms and clips, without light-dismiss or taking focus, so Escape still
 * cancels the drag. Returns `null` when no host is connected, or a clone's source is not.
 */
export function createDragPreviewElement(
  source: HTMLElement,
  anchor: PreviewAnchor,
  content?: HTMLElement,
): DragPreviewElementHandle | null {
  const isClone = content === undefined;
  const host = anchor.hosts.find((node) => node.isConnected);
  // A clone reads the source's styles, so it needs the source in the document. A
  // copy of custom content can still be placed after a virtualizer unmounted it.
  if (!host || (isClone && !source.isConnected)) {
    return null;
  }
  const doc = ownerDocument(source);
  const win = ownerWindow(source);
  const clone = isClone ? prepareDragPreviewClone(source, win) : undefined;
  const element = content ?? clone!.element;

  // Keyed on the host, not the source: a sheet adopted into the source's root would
  // miss a `container` in another shadow tree.
  ensureNeutralizerStyles(host);

  const { sourceRect, sourceScale } = anchor;
  const width = sourceRect.width / sourceScale.x;
  const height = sourceRect.height / sourceScale.y;

  // The engine's inline declarations, rewritten after custom content replaces the
  // root's `style`. Popover corrections are kept apart (see `popoverCorrections`),
  // since they are re-measured when the consumer's styles change.
  const engineStyles = new Map<string, [value: string, priority: string]>();
  function setEngineStyle(name: string, value: string, priority = ''): void {
    engineStyles.set(name, [value, priority]);
    element.style.setProperty(name, value, priority);
  }
  function removeEngineStyle(name: string): void {
    engineStyles.delete(name);
    element.style.removeProperty(name);
  }

  let destroyed = false;
  let usesPopover = false;
  // Viewport pixels per CSS pixel from `zoom` on the preview and its ancestors. Zoom
  // compounds through the DOM, so it still applies in the top layer.
  let zoom = 1;
  // The ancestor transform scale a clone re-applies, since the top layer escapes
  // ancestor transforms. Always 1 for custom content, which keeps its own size.
  let scale: DraggablePosition = { x: 1, y: 1 };
  // `transform-origin` in the preview's CSS pixels. The scale above happens around it.
  let origin: DraggablePosition = { x: 0, y: 0 };
  // Whether `neutralizeInheritedMotion` suppressed a `transform` shared with the source.
  let suppressedTransform = false;
  let position: DraggablePosition | null = null;

  function applyEngineAttributes(): void {
    element.setAttribute(PREVIEW_ELEMENT_ATTRIBUTE, isClone ? 'clone' : 'content');
    // The public styling hook.
    element.setAttribute(DraggablePreviewDataAttributes.dragPreview, '');
    element.setAttribute('aria-hidden', 'true');
    // Keeps a cloned `tabindex="0"` out of the tab order.
    element.setAttribute('inert', '');
    if (!anchor.inContainer && anchor.slot !== null) {
      element.setAttribute('slot', anchor.slot);
    } else {
      element.removeAttribute('slot');
    }
  }

  // The content's drag transition, if it covers `translate`, compared with the
  // ending one at the drop (see `prepareForDrop`).
  let dragTransition: string | null = null;

  // The content's own inline transition timing that `neutralizeTranslateTransition`
  // overrode, for the drop to put back. `null` when nothing is overridden.
  let ownTransitionTiming: InlineDeclaration[] | null = null;

  /**
   * A custom root's transition covering `translate` (or `all`) would make the
   * preview trail the pointer. Zero its duration and delay until the drop. Other
   * transitions and the root's own `transform` stay. Runs on the final cascade,
   * since an app's `[popover]` rule can add a transition.
   */
  function neutralizeTranslateTransition(): void {
    if (isClone || ownTransitionTiming !== null) {
      return;
    }
    const computed = win.getComputedStyle(element);
    const durations = computed.transitionDuration.split(',').map((value) => value.trim());
    const delays = computed.transitionDelay.split(',').map((value) => value.trim());
    let coversTranslate = false;
    const nextDurations: string[] = [];
    const nextDelays: string[] = [];
    computed.transitionProperty.split(',').forEach((name, index) => {
      const property = name.trim();
      const duration = durations[index % durations.length];
      const delay = delays[index % delays.length];
      const timed = Number.parseFloat(duration) > 0 || Number.parseFloat(delay) > 0;
      if ((property === 'all' || property === 'translate') && timed) {
        coversTranslate = true;
        nextDurations.push('0s');
        nextDelays.push('0s');
      } else {
        nextDurations.push(duration);
        nextDelays.push(delay);
      }
    });
    if (!coversTranslate) {
      return;
    }
    dragTransition ??= getTransitionSignature(computed);
    ownTransitionTiming = readInlineDeclarations(element.style, [
      'transition-duration',
      'transition-delay',
    ]);
    setEngineStyle('transition-duration', nextDurations.join(', '), 'important');
    setEngineStyle('transition-delay', nextDelays.join(', '), 'important');
  }

  /** Give the content back its own transition, for the drop. */
  function restoreTranslateTransition(): void {
    if (ownTransitionTiming === null) {
      return;
    }
    const timing = ownTransitionTiming;
    ownTransitionTiming = null;
    for (const [name] of timing) {
      removeEngineStyle(name);
    }
    writeInlineDeclarations(element.style, timing);
  }

  // The custom root's own inline `margin` and `translate`, which the engine
  // replaces. `readOwnOffset` puts them back to measure them.
  let ownOffsetStyle: InlineDeclaration[] = [];
  function captureOwnOffsetStyle(): void {
    ownOffsetStyle = readInlineDeclarations(element.style, OWN_OFFSET_PROPERTIES);
  }

  applyEngineAttributes();
  captureOwnOffsetStyle();

  // Geometry only. Visual properties stay in the cascade, so a consumer
  // `[data-drag-preview]` rule wins without `!important`.
  setEngineStyle('position', 'fixed');
  setEngineStyle('top', '0px');
  setEngineStyle('left', '0px');
  // A source `right` or `inset-inline-end` would over-constrain the box, and a
  // right-to-left page would then drop `left` and pin it to the right.
  setEngineStyle('right', 'auto');
  setEngineStyle('bottom', 'auto');
  // Margins aren't in the measured rect and would shift the preview off its anchor.
  setEngineStyle('margin', '0px');
  setEngineStyle('box-sizing', 'border-box');
  // `elementFromPoint` must see through the preview to the drop targets below.
  setEngineStyle('pointer-events', 'none');
  setEngineStyle('will-change', 'translate');
  // Only matters without the Popover API. The top layer is above every stacking
  // context.
  setEngineStyle('z-index', '2147483647');
  // Off-screen until the first frame positions it (see `writePosition`).
  setEngineStyle('translate', '-10000px -10000px');
  // A clone keeps the size it had in the source layout. Custom content sizes itself.
  if (isClone) {
    setEngineStyle('width', `${width}px`);
    setEngineStyle('height', `${height}px`);
    setEngineStyle('min-width', '0px');
    setEngineStyle('max-width', 'none');
    setEngineStyle('min-height', '0px');
    setEngineStyle('max-height', 'none');
    // Removed, not overwritten: an inline declaration would beat `NEUTRALIZER_CSS`.
    for (const property of NEUTRALIZED_PROPERTIES) {
      element.style.removeProperty(property);
    }
  }

  // Read while the clone is detached, since inserting it last changes which
  // `:last-child` rules the source matches.
  const contextualStyles = clone && capturePreviewStyles(clone.sourceNodes, clone.clonesBySource);
  const applyTableCellWidths = clone && captureTableCellWidths(source, clone.clonesBySource, win);

  if (process.env.NODE_ENV !== 'production') {
    const parentName = isClone || isShadowRoot(host) ? null : host.localName;
    const allowed = parentName === null ? undefined : LIST_CHILDREN[parentName];
    if (allowed && !allowed.includes(element.localName)) {
      warn(
        `a custom drag preview renders a <${element.localName}> element inside a <${parentName}>, which only accepts ` +
          `${allowed.map((name) => `<${name}>`).join(', ')} children. The page is invalid HTML during the drag. ` +
          `Pass \`render={<${allowed[0]} />}\` to Draggable.Preview, or a \`container\` outside the <${parentName}>. ` +
          'See https://base-ui.com/react/utils/draggable#custom-preview.',
      );
    }
  }

  // The source's motion at pickup, before `data-dragging`. The neutralizer stops at
  // the drop, so `prepareForDrop` compares the ending motion against it.
  const sourceMotion = new Map<string, string>();

  /**
   * A contextual source rule can outrank the neutralizer. Suppress motion the
   * preview shares with the source, and keep motion a preview rule sets. Runs once
   * connected, so the computed style is the real cascade, and before the contextual
   * snapshot is restored.
   */
  function neutralizeInheritedMotion(): void {
    const sourceStyle = win.getComputedStyle(source);
    const previewStyle = win.getComputedStyle(element);
    for (const property of NEUTRALIZED_PROPERTIES) {
      const sourceValue = sourceStyle.getPropertyValue(property);
      if (property !== 'transform' && hasActiveMotion(property, sourceStyle)) {
        sourceMotion.set(property, sourceValue);
      }
      const value = previewStyle.getPropertyValue(property);
      const activeMotion =
        property === 'transform' ? value !== 'none' : hasActiveMotion(property, previewStyle);
      if (activeMotion && value && value === sourceValue) {
        setEngineStyle(property, 'none', 'important');
        if (property === 'transform') {
          suppressedTransform = true;
        }
      }
    }
  }

  /**
   * The computed values the top layer could change, minus what the engine owns, read
   * before the element becomes a popover so changed ones are written back inline. A reset
   * sheet for the UA and app `[popover]` chrome would beat the consumer's styles, layered
   * or not (an adopted sheet's layer sorts after the document's).
   */
  function readPopoverSensitiveStyles(): Map<string, string> {
    const computed = win.getComputedStyle(element);
    const values = new Map<string, string>();
    for (let i = 0; i < computed.length; i += 1) {
      const name = computed[i];
      if (!isEnginePositionedProperty(name)) {
        values.set(name, computed.getPropertyValue(name));
      }
    }
    return values;
  }

  // The values `openInTopLayer` wrote back, each with the popover's value, so a
  // later rule can be told apart.
  const popoverCorrections = new Map<string, [correction: string, popoverValue: string]>();

  /**
   * Keep a popover correction only while the property still has the popover's value, so
   * a later rule (an ending style, a new class) takes over. Re-measures in place: leaving
   * the top layer would apply the new styles without their transitions and skip a drop
   * fade-out. `inline` is `false` once the content replaced the root's inline style, so
   * the content's own declarations aren't removed with the corrections.
   */
  function refreshPopoverCorrections(inline: boolean): void {
    if (popoverCorrections.size === 0) {
      return;
    }
    if (inline) {
      for (const name of popoverCorrections.keys()) {
        element.style.removeProperty(name);
      }
    }
    const computed = win.getComputedStyle(element);
    const kept = Array.from(popoverCorrections).filter(
      ([name, [, popoverValue]]) => computed.getPropertyValue(name) === popoverValue,
    );
    popoverCorrections.clear();
    for (const [name, [correction, popoverValue]] of kept) {
      popoverCorrections.set(name, [correction, popoverValue]);
      element.style.setProperty(name, correction);
    }
  }

  function openInTopLayer(pinStyles: boolean): void {
    if (typeof element.showPopover !== 'function') {
      return;
    }
    const before = pinStyles ? readPopoverSensitiveStyles() : null;
    try {
      element.setAttribute('popover', 'manual');
      element.showPopover();
      usesPopover = true;
    } catch {
      // `showPopover` throws on a disconnected node. Fall back to a plain fixed
      // element, without the attribute that would keep it `display: none`.
      element.removeAttribute('popover');
      usesPopover = false;
      return;
    }
    if (before) {
      // Reads first, then writes, so the comparison costs one style recalculation.
      const after = win.getComputedStyle(element);
      const changed = Array.from(before).filter(
        ([name, value]) => after.getPropertyValue(name) !== value,
      );
      for (const [name, value] of changed) {
        popoverCorrections.set(name, [value, after.getPropertyValue(name)]);
        element.style.setProperty(name, value);
      }
    }
  }

  function updatePositionScale(): void {
    zoom = getElementZoom(element);
    // A clone keeps the scale it had in the source layout. Custom content only
    // follows `zoom`.
    const positionScale = isClone ? sourceScale : { x: zoom, y: zoom };
    scale = { x: positionScale.x / zoom, y: positionScale.y / zoom };
    setEngineStyle(
      DraggablePreviewCssVars.dragSourceWidth,
      `${sourceRect.width / positionScale.x}px`,
    );
    setEngineStyle(
      DraggablePreviewCssVars.dragSourceHeight,
      `${sourceRect.height / positionScale.y}px`,
    );
  }

  /**
   * Re-apply the ancestor scale through `transform`, which the engine owns on a clone
   * (see `NEUTRALIZED_PROPERTIES`), leaving `scale` and `rotate` to consumers. The
   * ancestor scale then applies inside them rather than outside, which is harmless while
   * it is uniform. Not supported: a non-uniform one skews a preview with its own `rotate`
   * or non-uniform `scale`.
   */
  function applyAncestorScale(): void {
    origin = { x: 0, y: 0 };
    if (scale.x !== 1 || scale.y !== 1) {
      setEngineStyle(
        'transform',
        `scale(${scale.x}, ${scale.y})`,
        suppressedTransform ? 'important' : '',
      );
      const { x, y } = readTransformOrigin(win.getComputedStyle(element));
      origin = { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
    } else if (suppressedTransform) {
      setEngineStyle('transform', 'none', 'important');
    } else if (engineStyles.has('transform')) {
      removeEngineStyle('transform');
    }
  }

  // The custom root's own `margin` and `translate`, in CSS pixels. The engine
  // overrides both, so they are added to the position instead.
  let ownOffset: DraggablePosition = { x: 0, y: 0 };

  function readOwnOffset(): void {
    if (isClone) {
      return;
    }
    element.style.removeProperty('margin');
    element.style.removeProperty('translate');
    writeInlineDeclarations(element.style, ownOffsetStyle);
    const computed = win.getComputedStyle(element);
    const marginX = Number.parseFloat(computed.marginLeft) || 0;
    const marginY = Number.parseFloat(computed.marginTop) || 0;
    // `translate` keeps percentages in its computed value. They refer to the border box.
    const parts = computed.translate === 'none' ? [] : computed.translate.split(/\s+/);
    const resolve = (part: string | undefined, size: number) => {
      if (!part) {
        return 0;
      }
      const value = Number.parseFloat(part);
      if (!Number.isFinite(value)) {
        return 0;
      }
      return part.endsWith('%') ? (value / 100) * size : value;
    };
    ownOffset = {
      x: marginX + resolve(parts[0], element.offsetWidth),
      y: marginY + resolve(parts[1], element.offsetHeight),
    };
    for (const name of ['margin', 'translate']) {
      const [value, priority] = engineStyles.get(name)!;
      element.style.setProperty(name, value, priority);
    }
  }

  /**
   * Write `translate`, not `transform`. Transforms compose as
   * `translate × rotate × scale × transform`, so a consumer `rotate`/`scale` turns
   * the preview about its own box. The ancestor scale in `transform` moves the
   * top-left by `(1 - scale) × origin`, so the translation subtracts it.
   */
  function writePosition(): void {
    if (!position) {
      return;
    }
    const x = position.x / zoom - (1 - scale.x) * origin.x + ownOffset.x;
    const y = position.y / zoom - (1 - scale.y) * origin.y + ownOffset.y;
    const value = `${x}px ${y}px`;
    if (engineStyles.get('translate')?.[0] !== value) {
      setEngineStyle('translate', value);
    }
  }

  // Last, after the source in tree order, so `getElementById` still finds the source.
  //
  // Not supported: an `<ol reversed>` without `start` counts the preview, so every
  // item renumbers by one during the drag. Set `start`, or use a `container`.
  host.appendChild(element);
  // The source-size variables first, since preview rules can depend on them.
  updatePositionScale();
  if (isClone) {
    neutralizeInheritedMotion();
  }
  // Before the popover opens. The snapshot drops `data-drag-preview` to tell preview
  // rules from lost contextual ones, and the `[popover]` chrome would skew that.
  contextualStyles?.restore();
  applyTableCellWidths?.();
  // An element that is already a popover (the clone of an open popover source) has
  // nothing to correct. Closed, it measures as `display: none`, which a correction
  // would keep.
  openInTopLayer(!element.hasAttribute('popover'));
  neutralizeTranslateTransition();
  readOwnOffset();
  applyAncestorScale();
  // Scroll offsets need layout, which the top layer rebuilt.
  clone?.applyPostInsertion();

  function reconnect(): void {
    if (destroyed) {
      return;
    }
    if (!element.isConnected) {
      const survivor =
        anchor.hosts.find((node) => node.isConnected) ?? doc.body ?? doc.documentElement;
      survivor.appendChild(element);
    } else if (!usesPopover || isPopoverOpen(element)) {
      return;
    }
    // Any DOM move, even reordering a connected ancestor, closes the popover and
    // hides it. Reopen it before restoring state, since `scrollTop` in a
    // `display: none` subtree clamps to 0.
    if (usesPopover) {
      openInTopLayer(false);
    }
    updatePositionScale();
    applyAncestorScale();
    writePosition();
    contextualStyles?.reconnect();
    // Re-appending resets descendant scroll positions.
    clone?.applyPostInsertion();
  }

  // A React commit that recycles the preview's parent (a virtualizer, a keyed
  // remount) detaches it after the engine callback returns, where no check at the
  // call site sees it. The observer repairs it in the next microtask, even while the
  // pointer is still. It watches the whole chain, since detaching an ancestor
  // doesn't mutate the preview's parent.
  const observer = new win.MutationObserver(reconnect);
  for (const node of anchor.hosts.slice(anchor.hosts.indexOf(host))) {
    observer.observe(node, { childList: true });
  }

  return {
    element,
    anchor,
    setPosition(x, y) {
      position = { x, y };
      writePosition();
    },
    ensureConnected: reconnect,
    updateContentStyle(ownStyle) {
      if (destroyed) {
        return;
      }
      // The new styles may change the transition and popover corrections, so both
      // are re-measured.
      ownTransitionTiming = null;
      dragTransition = null;
      engineStyles.delete('transition-duration');
      engineStyles.delete('transition-delay');
      element.style.cssText = ownStyle;
      // Before the engine's declarations replace the root's own offset.
      captureOwnOffsetStyle();
      applyEngineAttributes();
      for (const [name, [value, priority]] of engineStyles) {
        element.style.setProperty(name, value, priority);
      }
      updatePositionScale();
      refreshPopoverCorrections(false);
      neutralizeTranslateTransition();
      readOwnOffset();
      writePosition();
    },
    prepareForDrop() {
      // Runs once `data-ending-style` lifts the neutralizer. The first read below
      // starts the ending transitions, so their motion comes back first.
      restoreTranslateTransition();
      // Like a clone, the drop animates with a transition under
      // `[data-ending-style]`. One the content already had during the drag (a hover
      // `transition: all`) must not fly the preview back, so it stays off for
      // `translate`. The other properties it covers, such as an ending fade, still
      // run.
      if (
        dragTransition !== null &&
        getTransitionSignature(win.getComputedStyle(element)) === dragTransition
      ) {
        neutralizeTranslateTransition();
      }
      // Allow a distinct ending or preview rule without reviving motion shared with
      // the source. Inline suppressions are cleared first so the comparison sees the
      // cascade.
      if (sourceMotion.size > 0) {
        for (const property of sourceMotion.keys()) {
          removeEngineStyle(property);
        }
        const computed = win.getComputedStyle(element);
        const inherited = Array.from(sourceMotion).filter(
          ([property, sourceValue]) => computed.getPropertyValue(property) === sourceValue,
        );
        for (const [property] of inherited) {
          setEngineStyle(property, 'none', 'important');
        }
      }
      // Ending styles can set what the popover corrections pinned, such as a
      // background.
      refreshPopoverCorrections(true);
      // Ending styles can change `transform-origin`, which the ancestor scale's
      // offset depends on.
      applyAncestorScale();
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      observer.disconnect();
      contextualStyles?.destroy();
      element.remove();
    },
  };
}
