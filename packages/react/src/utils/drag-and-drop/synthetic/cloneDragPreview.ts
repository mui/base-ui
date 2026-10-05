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
  adoptStyleSheet,
  getComposedParentElement,
  getDragEventRoot,
  getElementScale,
  getElementZoom,
  getOwnZoom,
} from '../utils';
import type { DraggablePosition } from '../../../draggable/DraggableProvider';
import { COMPUTED_MATRIX, getOwnLinearTransform } from '../linearTransform';

/**
 * Properties the preview must not inherit from the source. The engine moves the
 * preview by writing `translate` every frame. A source `transition` covering it
 * would ease each write so the preview trails the pointer, and a running
 * `@keyframes` on it sits in the animation origin and would pin the preview.
 *
 * `transform` is neutralized for its geometry, not its timing. Its translation
 * components (a source grabbed mid-FLIP) would shift the clone off the grab anchor
 * and double-count the offset already in the measured rect.
 *
 * `rotate` and `scale` are not neutralized. The individual properties compose as
 * `translate × rotate × scale × transform`, so the engine's `translate` stays
 * outermost and they turn or scale the preview about its own box without moving
 * it. Consumers style the preview with them (`.Card[data-drag-preview] { rotate: 4deg }`,
 * Tailwind's `rotate-4`), and a source that has them keeps its look on the clone.
 * The unlayered engine rule below beats every declaration in a cascade layer,
 * including all Tailwind v4 utilities, so neutralizing them here would lock
 * layered CSS out of that styling hook. For the same reason, it neutralizes
 * motion only until the drop. `translate` needs no rule, because the
 * engine's inline write beats any author value.
 *
 * The clone inherits these from class rules and from the source's inline style.
 * The sheet below clears the first and `removeProperty` the second, and both
 * derive their property list from this one.
 */
const MOTION_PROPERTIES = ['transition', 'animation'];
const NEUTRALIZED_PROPERTIES = [...MOTION_PROPERTIES, 'transform'];

// The inline declarations of a custom preview root that offset it from its position
// (see `readOwnOffset`). The engine's own `margin` and `translate` replace them.
const OWN_OFFSET_PROPERTIES = ['margin-top', 'margin-left', 'translate'];

/**
 * Marks the element the engine positions: `"clone"` for the clone of the source, or
 * `"content"` for the copy of a custom preview's content. The engine finds the
 * preview through it in either mode. The same element carries the public
 * `data-drag-preview`. The `data-base-ui-` prefix means this one is internal, not a
 * styling hook.
 */
export const PREVIEW_ELEMENT_ATTRIBUTE = 'data-base-ui-drag-preview';

/**
 * Keyed on a clone's `PREVIEW_ELEMENT_ATTRIBUTE`, so it reaches only the clone's
 * root, not its descendants, which keep their own `transform` and motion. A custom
 * preview's root inherits nothing from the source, so it keeps its own too (see
 * `neutralizeTranslateTransition`).
 *
 * At specificity (0,1,0) it beats the source's own `.Card { transition }` on
 * source order, while a consumer rule keyed on the public attribute
 * (`.Card[data-drag-preview] { transition: box-shadow .3s }`) still wins. An
 * inline declaration would force that consumer rule to use `!important`. The
 * `:not()` is wrapped in `:where()` to keep that specificity.
 *
 * Motion is neutralized only until the drop. Being unlayered, the rule would
 * otherwise beat an ending transition in a cascade layer, such as Tailwind's
 * `data-ending-style:transition-[translate]`, and the preview would jump back.
 * `prepareForDrop` suppresses motion the preview shares with the source instead.
 *
 * The UA `[popover]` chrome is not reset here either, for the same reason. The
 * engine restores the values it changed inline instead (see
 * `readPopoverSensitiveStyles`).
 */
const NEUTRALIZER_CSS =
  `[${PREVIEW_ELEMENT_ATTRIBUTE}="clone"]{transform:none}` +
  `[${PREVIEW_ELEMENT_ATTRIBUTE}="clone"]:where(:not([${DraggablePreviewDataAttributes.endingStyle}])){${MOTION_PROPERTIES.map((p) => `${p}:none`).join(';')}}`;

/**
 * A constructable stylesheet, not a `<style>` element, because the CSSOM path is
 * exempt from CSP `style-src`. Built once per document or shadow root and kept in
 * the shared slot. A shadow root needs its own because document styles do not
 * cross the shadow boundary.
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
 * Whether a popover is open. A polyfilled `showPopover` in a browser without the
 * Popover API leaves `:popover-open` unparseable, and `matches` throws. The
 * polyfill keeps its own state, so the preview is treated as open.
 */
function isPopoverOpen(element: HTMLElement): boolean {
  try {
    return element.matches(':popover-open');
  } catch {
    return true;
  }
}

function ensureNeutralizerStyles(host: PreviewHost): void {
  // `isShadowRoot` is realm-safe. A shadow root inside an iframe or popout has its
  // own `ShadowRoot` constructor, so a plain `instanceof` would fail and the sheet
  // would land on the iframe document instead. The preview would then keep the
  // source's transitions.
  const target = isShadowRoot(host) ? host : getDragEventRoot(host);
  if (!('adoptedStyleSheets' in target)) {
    return;
  }
  let sheet = neutralizerSheets.get(target);
  if (!sheet) {
    sheet = new (ownerWindow(host).CSSStyleSheet)();
    sheet.replaceSync(NEUTRALIZER_CSS);
    neutralizerSheets.set(target, sheet);
  }
  // Re-adopt on every call instead of tracking which roots already have it. An app
  // that assigns a new `adoptedStyleSheets` array (on a theme switch, say) drops
  // the sheet, and the next preview would carry the source's transitions again.
  adoptStyleSheet(target, sheet);
}

export interface DragPreviewElementHandle {
  /** The preview element, which follows the pointer in the top layer. */
  readonly element: HTMLElement;
  /** `true` for a clone of the source, `false` for a copy of custom preview content. */
  readonly isClone: boolean;
  /** Where the preview was built, reused when it is rebuilt mid-drag. */
  readonly anchor: PreviewAnchor;
  /** The source's border box at drag start, measured once. */
  readonly sourceRect: DOMRect;
  /** Move the preview's top-left corner to these viewport coordinates. */
  setPosition(x: number, y: number): void;
  /**
   * Re-home the preview if its parent was torn out mid-drag (a virtualizer recycling
   * the row, a `dangerouslySetInnerHTML` parent re-rendering). Cheap enough to call
   * every frame. The common path is an `isConnected` read, plus a `:popover-open`
   * match for a top-layer preview.
   */
  ensureConnected(): void;
  /**
   * Reset content transition state and let the updater write the root's own style,
   * then the engine's attributes and declarations. `applyAttributes` must run after
   * the root's own style, since it also reads what the engine's declarations replace.
   * Refresh geometry and motion after the write, using the new cascade.
   */
  updateContentStyle(
    write: (
      styles: Map<string, [value: string, priority: string]>,
      applyAttributes: () => void,
    ) => void,
  ): void;
  destroy(): void;
  /** Restore motion rules before the ending-style transition is measured. */
  prepareForDrop(): void;
}

type PreviewHost = HTMLElement | ShadowRoot;

export const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';
const previewIds = getSharedSlot('dragPreviewIds', () => ({ next: 0 }));

/**
 * The node the preview is appended to. A draggable that is a direct child of a
 * shadow root has no `parentElement`. Appending to the shadow root keeps the
 * preview under the same styles.
 */
function hostOf(node: Node): PreviewHost | null {
  const parent = node.parentNode;
  if (parent && isShadowRoot(parent)) {
    return parent;
  }
  return node.parentElement;
}

/**
 * A custom element cannot be cloned inertly in its live document. `cloneNode`
 * runs its constructor, and connecting the preview runs its lifecycle callbacks.
 * Undefined custom-element names are unsafe too, since a definition registered
 * during the drag would upgrade the connected clone.
 */
function isCustomElementCandidate(element: Element): boolean {
  return (
    element.namespaceURI === HTML_NAMESPACE &&
    (element.localName.includes('-') || element.getAttribute('is')?.includes('-') === true)
  );
}

/**
 * The computed properties copied onto a custom element's placeholder. They cover
 * its box, its painted surface, and its place in a parent flex or grid layout.
 * The placeholder has no shadow content, so the other few hundred computed
 * properties would only cost a `setProperty` each.
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
 * Clone a tree, replacing custom elements with inert `div` placeholders. The
 * copied computed styles approximate the host box without running the element's
 * constructor, upgrade, or lifecycle callbacks.
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
 * Neutralizes copied nodes so they can't act as the originals. The clone of a source
 * uses it once. The copy of a custom preview applies it again to every node and
 * attribute that changes while it mirrors the React-rendered content.
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
   * Whether a copied `id` can stay as it is. By default every id is rewritten, since
   * a clone duplicates its source's ids by construction. The copy of custom content
   * keeps an id unless the page already uses it.
   */
  keepId?: ((id: string) => boolean) | undefined;
}

export function createPreviewSanitizer(options: PreviewSanitizerOptions = {}): PreviewSanitizer {
  const { keepId } = options;
  // Duplicate ids would break `getElementById`, `<label for>` and
  // `aria-labelledby`. Rewrite them, then update references inside the copy.
  // As a result, `#id` selectors do not style the preview. Classes and
  // `[data-drag-preview]` are the supported styling hooks.
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
          // `srcdoc` takes precedence over `src`. Left in place, inserting the copy
          // would load the embedded document, scripts included, on every drag.
          node.removeAttribute('srcdoc');
          break;
        case 'object':
          // Like an iframe, an `<object>` or `<embed>` would fetch its resource again
          // and run an HTML or SVG document's scripts on every drag.
          node.removeAttribute('data');
          node.setAttribute('form', '');
          break;
        case 'input':
        case 'select':
        case 'textarea':
        case 'button':
        case 'fieldset':
        case 'output':
          // An empty owner keeps the enabled appearance without adding controls to
          // the source's form or its constraint validation, including `form="id"`.
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
          // A lazy image waits until it nears the viewport, and the preview is
          // parked off-screen until its first frame, so it would flash empty.
          if (node.hasAttribute('loading')) {
            node.setAttribute('loading', 'eager');
          }
          break;
        default:
          break;
      }

      // A copied control still belongs to the source's form, so it would be
      // submitted with the real one. A checked radio with the same `name` would also
      // uncheck the original when inserted, an open `<details>` in the source's
      // exclusive accordion would close itself, and a named `<form>` would turn
      // `document[name]` into a collection. A `<slot>` keeps its name, since a
      // nameless slot would take the host's unassigned children.
      if (node.localName !== 'slot') {
        node.removeAttribute('name');
      }
    },
    rewriteId(node) {
      const id = node.getAttribute('id');
      // An id rewritten once stays rewritten, even after the page stops using it, so
      // the references already remapped to it keep pointing at it.
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
 * Rewrite `url(#id)` references in an inline style through the CSSOM. A strict
 * CSP without `'unsafe-inline'` blocks `setAttribute('style', …)`, but not
 * `style.setProperty`.
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
  // A DOM without CSSOM support for a property (jsdom lacks most SVG ones) keeps it
  // out of `style`, leaving the reference in the attribute. Real browsers
  // re-serialize the attribute from the declarations above, so this never runs
  // there.
  const attribute = node.getAttribute('style');
  if (attribute !== null) {
    const next = remap(attribute);
    if (next !== attribute) {
      node.setAttribute('style', next);
    }
  }
}

/**
 * Copy the state an element holds outside its attributes: field values and checked
 * states set through properties, `indeterminate`, a select's selection, an open
 * `<details>`, and canvas pixels. Cloning keeps only some of it, and none of it
 * changes through a mutation. Uses the source window's constructors, since a
 * draggable in an iframe or popout has its own.
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
    // `drawImage` works on a detached canvas and is far cheaper than a `toDataURL()`
    // round-trip.
    try {
      const context = to.getContext('2d');
      context?.clearRect(0, 0, to.width, to.height);
      context?.drawImage(from, 0, 0);
    } catch {
      // A tainted, WebGL or transferred-to-offscreen canvas cannot be read. Leave
      // the copy blank rather than failing the whole drag.
    }
  }
}

/**
 * Copy the state cloning leaves out (see `copyElementState`). Source and clone lists
 * are paired before sanitization removes nodes. Scroll offsets need layout, so the
 * returned function applies them after insertion.
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

/**
 * Set a scroll offset without animating it. Under `scroll-behavior: smooth`, a
 * `scrollTop` write starts a smooth scroll, so the preview would show the top of
 * the scroller and a mid-drag re-home would scroll it again.
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
 * `position: fixed` blockifies a table row or row group, so its cells lay out in
 * an anonymous table that sizes them to their content instead of the source's
 * columns. Pin each cell to its used width. This is exact under
 * `border-collapse: collapse`. Under separated borders, the anonymous table adds
 * the outer `border-spacing`, so the cells land within that spacing.
 *
 * Reads the widths now and returns a function that writes them once the clone is
 * inserted, or `null` when the source is not a row or row group.
 */
function captureTableCellWidths(
  sourceNodes: Element[],
  cloneNodes: Element[],
  win: Window & typeof globalThis,
): (() => void) | null {
  const source = sourceNodes[0];
  const display = win.getComputedStyle(source).display;
  if (!TABLE_ROW_PARTS.has(display)) {
    return null;
  }
  const clonesBySource = new Map<Element, Element>();
  sourceNodes.forEach((node, index) => clonesBySource.set(node, cloneNodes[index]));
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
  /** The source's elements in tree order, paired index-by-index with `nodes`. */
  sourceNodes: Element[];
  /** The clone's elements in the same order as `sourceNodes`. */
  nodes: Element[];
  applyPostInsertion: () => void;
}

function prepareDragPreviewClone(
  source: HTMLElement,
  win: Window & typeof globalThis,
): PreparedDragPreviewClone {
  const queriedSourceNodes: Element[] = [source, ...Array.from(source.querySelectorAll('*'))];
  let element: HTMLElement;
  let sourceNodes: Element[];
  let cloneNodes: Element[];
  if (queriedSourceNodes.some(isCustomElementCandidate)) {
    ({ element, sourceNodes, cloneNodes } = cloneWithoutCustomElements(source, win));
  } else {
    element = source.cloneNode(true) as HTMLElement;
    sourceNodes = queriedSourceNodes;
    cloneNodes = [element, ...Array.from(element.querySelectorAll('*'))];
  }
  // A preview inside the source, in a `container` the source holds, would be copied
  // into the next one. `Draggable.updatePreview()` would then nest previews.
  const previewNodes = new Set<Element>();
  for (const node of cloneNodes) {
    if (node !== element && node.hasAttribute(PREVIEW_ELEMENT_ATTRIBUTE)) {
      previewNodes.add(node);
      for (const descendant of Array.from(node.querySelectorAll('*'))) {
        previewNodes.add(descendant);
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
  // Present on a source whose previous preview is still settling. A
  // `[data-settling] { color: transparent }` placeholder rule would otherwise hide
  // the preview's text for the whole drag.
  element.removeAttribute(DraggableRootDataAttributes.settling);
  // The clone joins the list after every item, so an ordered list would number it
  // as its last item. Pin the source's own number instead.
  if (!element.hasAttribute('value')) {
    const ordinal = getListItemOrdinal(source);
    if (ordinal !== null) {
      element.setAttribute('value', String(ordinal));
    }
  }

  return { element, sourceNodes, nodes: cloneNodes, applyPostInsertion };
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
 * Whether a computed `transform` only translates, which leaves the box's size
 * untouched. Browsers resolve the computed `transform` of a rendered element to
 * matrix form, so a pure translation is an identity matrix with only the offset
 * components (`m41`/`m42`/`m43`) free.
 */
function isTranslationOnly(transform: string): boolean {
  const matrix = transform.match(COMPUTED_MATRIX);
  if (!matrix) {
    return false;
  }
  const values = matrix[2].split(',').map(Number);
  if (matrix[1]) {
    // Column-major order. The diagonal is at indices 0, 5, 10 and 15, and the
    // translation at 12 to 14.
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
  const originParts = sourceStyle.transformOrigin.split(/\s+/);
  const originX = Number.parseFloat(originParts[0]);
  const originY = Number.parseFloat(originParts[1]);
  if (!matrix || !Number.isFinite(originX) || !Number.isFinite(originY)) {
    return fallback();
  }

  // An affine transform maps the rectangle's center to the center of its
  // transformed axis-aligned bounding box. Undo that displacement around the real
  // transform origin. Unlike plain re-centering, this also works for a top-left or
  // other custom origin.
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
 * The source's border-box size in its own CSS pixels, before any transform.
 * `offsetWidth`/`offsetHeight` round to integers, so the size comes from the
 * computed box, which keeps the subpixels. It is trusted only when it agrees with
 * the rounded one. It is `auto` on an inline box, and Chromium leaves a classic
 * scrollbar out of the computed content width.
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
  // `getBoundingClientRect` includes the source's own transform. The clone
  // neutralizes `transform` but re-applies the individual `rotate`/`scale`
  // properties to the box it is given, so a transformed source must be measured
  // from its untransformed border box.
  //
  // CSS Transforms 2 splits `scale`, `rotate` and `translate` out of `transform`,
  // and they do not fold into the computed `transform`. A source styled
  // `scale: 1.5` (a hover lift) reads as untransformed unless each property is
  // checked. Sizing from the transformed bounding box would then compound the
  // re-applied scale to about 2.25x.
  const win = ownerWindow(source);
  const rect = source.getBoundingClientRect();
  const sourceStyle = win.getComputedStyle(source);
  // Translation is excluded, whether from `translate` or a translate-only
  // `transform`. It moves the box without resizing it, so the rect's dimensions
  // are already right. They are also exact, while `offsetWidth` rounds to an
  // integer and would lose the preview's subpixel size.
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
  // Everything downstream, such as the default `'source'` offset and the
  // `--drag-source-*` variables, must describe the box the preview has. Otherwise
  // the preview is anchored to a different box and jumps on pickup. So the
  // untransformed size is paired with the position found by undoing the source's
  // transform around its computed `transform-origin`.
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
   * The nodes the preview can be appended to, nearest first: the `container` or the
   * source's parent, then their ancestors. It ends at `documentElement` (or a shadow
   * root), which outlives any subtree the app tears down. A preview built or re-homed
   * mid-drag uses the first one still connected, which keeps as much of the original
   * cascade as possible.
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
 * Measure where the preview goes and the box it starts from. Runs at pickup, before
 * `data-dragging` lands on the source, whose rules could otherwise change the box.
 *
 * Returns `null` when there is nowhere to insert the preview (a detached or
 * parentless source). The drag then runs without one.
 */
export function measurePreviewAnchor(
  source: HTMLElement,
  requestedContainer: HTMLElement | null,
): PreviewAnchor | null {
  let container = requestedContainer;
  // The preview is measured and positioned in the source's document. Viewport
  // coordinates do not carry across documents, so a container in another document
  // would offset the preview by the frame's position. Render it in place instead.
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
 * The children lists accept. React checks the content's nesting against tables and
 * selects (see `createPreviewContentMirror`), but not against lists, so a custom
 * preview root that is invalid in a list gets a warning from Base UI instead.
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
 * Whether a computed property belongs to the engine on the preview element, so a
 * change the top layer brings to it is expected rather than restored.
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
 * Build the element that follows the pointer and append it to the source's parent,
 * so inherited properties, descendant selectors and child combinators still apply.
 * It is a clone of the source, or `content`, a copy of a custom preview's rendered
 * content.
 *
 * The preview has no wrapper. A clone keeps the source's tag, so a `<tr>` preview is
 * a `<tr>` in the same `<tbody>` and the document stays valid HTML. It is appended
 * as the last child rather than next to the source, so `:nth-child` keeps matching
 * every sibling during the drag, unless a live reorder moves one after it. It still
 * shifts `:last-child`, `:only-child` and `:nth-last-child` on the siblings, which a
 * `container` avoids. A clone is unaffected either way. Its structural styles were
 * snapshotted from the source, and `restore()` re-applies whatever the new position
 * changed.
 *
 * `popover="manual"` promotes the preview to the top layer. Its box renders above
 * the page while the node stays in place in the DOM. The viewport becomes the
 * containing block, so a transformed ancestor cannot offset the preview, and no
 * ancestor can clip it or trap it in a stacking context. `manual` never
 * light-dismisses or takes focus, so Escape still cancels the drag.
 *
 * Browsers without the Popover API fall back to a plain `position: fixed` element,
 * which is correct outside transformed or clipping ancestors.
 *
 * Returns `null` when no host is left to insert into, or when a clone's source is
 * no longer connected. The drag then runs without a preview.
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

  // Keyed on the host, not the source. With a container in another root, such as a
  // shadow tree, a sheet adopted into the source's root would not reach the preview,
  // and it would keep the source's transitions.
  ensureNeutralizerStyles(host);

  const { sourceRect, sourceScale } = anchor;
  const width = sourceRect.width / sourceScale.x;
  const height = sourceRect.height / sourceScale.y;

  // Every inline declaration the engine writes on the preview, so it can write them
  // again after the copy of custom content replaced the element's `style` attribute.
  // The popover corrections are kept apart (see `openInTopLayer`), since they
  // depend on the consumer's styles and are measured again when those change.
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
    // The public styling hook, on the clone or on the root of the custom content.
    element.setAttribute(DraggablePreviewDataAttributes.dragPreview, '');
    element.setAttribute('aria-hidden', 'true');
    // Without it, a cloned `tabindex="0"` would be tabbable. The preview must never
    // be focusable or hit-tested.
    element.setAttribute('inert', '');
    if (!anchor.inContainer && anchor.slot !== null) {
      element.setAttribute('slot', anchor.slot);
    } else {
      element.removeAttribute('slot');
    }
  }

  /**
   * Remove these from a clone instead of overwriting them. It carries the source's
   * `style` attribute, and an inline declaration would beat `NEUTRALIZER_CSS`.
   */
  function clearNeutralizedInlineStyles(): void {
    if (!isClone) {
      return;
    }
    for (const property of NEUTRALIZED_PROPERTIES) {
      if (!engineStyles.has(property)) {
        element.style.removeProperty(property);
      }
    }
  }

  // The content's transition during the drag, while it covers `translate`. At the
  // drop, it is compared with the ending one (see `prepareForDrop`).
  let dragTransition: string | null = null;

  // The content's own inline `transition-duration` and `transition-delay` while
  // `neutralizeTranslateTransition` overrides them, so the drop can put them back.
  // `null` when nothing is overridden.
  let ownTransitionTiming: Array<[name: string, value: string, priority: string]> | null = null;

  /**
   * The engine writes `translate` on the root of a custom preview every frame, so a
   * transition covering it would ease or delay each write and the preview would
   * trail the pointer. Zero the duration and delay of that transition until the
   * drop, and keep any other, such as a `box-shadow` transition, along with the
   * root's own `transform`. `all` covers `translate`, so it is zeroed too. Runs on
   * the preview's final cascade, since an app's `[popover]` rule can add one.
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
    ownTransitionTiming = ['transition-duration', 'transition-delay'].map((name) => [
      name,
      element.style.getPropertyValue(name),
      element.style.getPropertyPriority(name),
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
    for (const [name, value, priority] of timing) {
      removeEngineStyle(name);
      if (value) {
        element.style.setProperty(name, value, priority);
      }
    }
  }

  // The custom root's own inline `margin` and `translate`, which the engine's
  // declarations replace. `readOwnOffset` puts them back to measure them.
  let ownOffsetStyle: Array<[name: string, value: string, priority: string]> = [];
  function captureOwnOffsetStyle(): void {
    ownOffsetStyle = OWN_OFFSET_PROPERTIES.map((name) => [
      name,
      element.style.getPropertyValue(name),
      element.style.getPropertyPriority(name),
    ]);
  }

  applyEngineAttributes();
  captureOwnOffsetStyle();

  // Geometry only. Every visual property stays in the cascade so that a consumer
  // rule keyed on `[data-drag-preview]` wins without `!important`.
  setEngineStyle('position', 'fixed');
  setEngineStyle('top', '0px');
  setEngineStyle('left', '0px');
  // A source `right` or `inset-inline-end` would over-constrain the box. In a
  // right-to-left page the browser then drops `left` and pins it to the right.
  setEngineStyle('right', 'auto');
  setEngineStyle('bottom', 'auto');
  // Margins are not part of the measured rect and would shift the preview off
  // its transform anchor.
  setEngineStyle('margin', '0px');
  setEngineStyle('box-sizing', 'border-box');
  // `elementFromPoint` must see through the preview to the drop targets below.
  setEngineStyle('pointer-events', 'none');
  setEngineStyle('will-change', 'translate');
  // Only takes effect without the Popover API. The top layer paints above every
  // stacking context anyway.
  setEngineStyle('z-index', '2147483647');
  // Park off-screen until the first frame positions it. Uses `translate`, not
  // `transform`, so positioning composes outside a consumer `rotate`/`scale`
  // (see `writePosition`) and overwrites any `translate` the source had.
  setEngineStyle('translate', '-10000px -10000px');
  // A clone keeps the size it had in the source layout. Custom content sizes itself.
  if (isClone) {
    setEngineStyle('width', `${width}px`);
    setEngineStyle('height', `${height}px`);
    setEngineStyle('min-width', '0px');
    setEngineStyle('max-width', 'none');
    setEngineStyle('min-height', '0px');
    setEngineStyle('max-height', 'none');
  }
  clearNeutralizedInlineStyles();

  // Read from the source while the clone is still detached. Inserting the clone
  // would make it the parent's last child and snapshot `:last-child` rules at a
  // position the source does not hold.
  const contextualStyles = clone && capturePreviewStyles(clone.sourceNodes, clone.nodes);
  const applyTableCellWidths = clone && captureTableCellWidths(clone.sourceNodes, clone.nodes, win);

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

  // The source's own motion at pickup, before `data-dragging` lands on it. The
  // neutralizer stops at the drop, so `prepareForDrop` compares the preview's
  // ending motion against it.
  const sourceMotion = new Map<string, string>();

  /**
   * A contextual motion rule from the source can outrank the shared neutralizer.
   * Suppress motion the preview shares with the source, but keep motion a preview
   * rule sets. Runs after the clone is connected, so its computed style reflects its
   * real cascade, and before the contextual snapshot is restored.
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
   * The computed values the top layer could change: everything but the geometry,
   * motion and custom properties the engine owns. The browser's `[popover]` rules
   * add a border, padding, `overflow: auto`, `color: CanvasText` and an opaque
   * `Canvas` background, and an app's own `[popover]` or `:popover-open` rules can
   * add more. A reset stylesheet can't remove them without beating the consumer's
   * styles too. Unlayered, it would beat every cascade layer, Tailwind's utilities
   * included, and a layer declared from an adopted sheet is ordered after the
   * document's layers. So the values are read before the element becomes a popover,
   * and any value the popover changed is written back inline.
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

  // The values `openInTopLayer` wrote back after the popover changed them, each with
  // the value the popover gave the property, so a later rule can be told apart.
  const popoverCorrections = new Map<string, [correction: string, popoverValue: string]>();

  /**
   * Keep a popover correction only while the property still shows the value the
   * popover gave it. A rule that sets it since, such as an ending style or a class
   * the content gained, takes over. A single read, without leaving the top layer:
   * leaving it would apply the new styles without their transitions, so a fade-out
   * on the drop would not run. A property the popover reaches only after a restyle
   * is not corrected.
   *
   * `inline` is whether the corrections are still written on the element. After the
   * content replaced the root's inline style, they are not, and removing them would
   * remove the content's own declarations.
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
      // `showPopover` throws on a disconnected node. Fall back to the plain fixed
      // element and drop the attribute, which would otherwise keep it `display: none`.
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
    // Expose the source's size to the preview content.
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
   * (see `NEUTRALIZED_PROPERTIES`). `scale` and `rotate` stay free for consumer
   * styling. Without an ancestor scale, `transform` stays clear.
   *
   * The individual `rotate` and `scale` properties compose outside `transform`, while
   * the ancestor scale belongs outside them, where it was in the source's layout. A
   * uniform scale commutes with them, so the order doesn't matter.
   *
   * Not supported: a non-uniform ancestor scale, such as `scale(2, 1)`, combined with
   * the preview's own `rotate` or non-uniform `scale`. The ancestor scale then applies
   * inside them, so the preview is skewed. This is expected.
   */
  function applyAncestorScale(): void {
    if (scale.x !== 1 || scale.y !== 1) {
      setEngineStyle(
        'transform',
        `scale(${scale.x}, ${scale.y})`,
        suppressedTransform ? 'important' : '',
      );
    } else if (suppressedTransform) {
      setEngineStyle('transform', 'none', 'important');
    } else if (engineStyles.has('transform')) {
      removeEngineStyle('transform');
    }
    origin = { x: 0, y: 0 };
    if (scale.x !== 1 || scale.y !== 1) {
      const parts = win.getComputedStyle(element).transformOrigin.split(/\s+/);
      const x = Number.parseFloat(parts[0]);
      const y = Number.parseFloat(parts[1]);
      origin = { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
    }
  }

  // The custom root's own `margin` and `translate`, in its CSS pixels. The engine
  // overrides both to position the preview, so they shift it from its offset
  // instead, as they would shift an element in place.
  let ownOffset: DraggablePosition = { x: 0, y: 0 };

  function readOwnOffset(): void {
    if (isClone) {
      return;
    }
    element.style.removeProperty('margin');
    element.style.removeProperty('translate');
    for (const [name, value, priority] of ownOffsetStyle) {
      if (value) {
        element.style.setProperty(name, value, priority);
      }
    }
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
   * Write `translate`, not `transform`. The individual properties compose as
   * `translate × rotate × scale × transform`, so `translate` is outermost and a
   * consumer `rotate`/`scale` turns the preview about its own box. The ancestor
   * scale in `transform` happens around `transform-origin`, which moves the box's
   * top-left corner by `(1 - scale) × origin`, so the translation subtracts it.
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

  // Appended as the last child, so every sibling keeps its `:nth-child` index (see
  // above). It comes after the source in tree order, so `getElementById` still
  // finds the real element.
  //
  // Not supported: an `<ol reversed>` without `start` numbers its items from their
  // count, so an `<li>` preview in it renumbers every item by one during the drag.
  // This is expected. A list that needs stable numbers sets `start`, or the preview
  // goes in a `container` outside the list.
  host.appendChild(element);
  // The source-size variables first, since preview rules can depend on them.
  updatePositionScale();
  if (isClone) {
    neutralizeInheritedMotion();
  }
  // Restored before the element becomes a popover. The snapshot tells a preview
  // rule from a lost contextual one by dropping `data-drag-preview`, and the
  // browser's `[popover]` chrome would show through in that comparison.
  contextualStyles?.restore();
  applyTableCellWidths?.();
  // An element that is a popover already, such as the clone of an open popover
  // source, looks like one in the page, so the popover changes nothing to correct.
  // Closed, it measures as `display: none`, which a correction would keep.
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
      // The nearest host still in the document keeps as much of the original
      // cascade as possible. The body is the fallback.
      const survivor =
        anchor.hosts.find((node) => node.isConnected) ?? doc.body ?? doc.documentElement;
      survivor.appendChild(element);
    } else if (!usesPopover || isPopoverOpen(element)) {
      return;
    }
    // Any DOM move closes an open popover and sends it back to `display: none`.
    // That includes reordering a connected ancestor, even though the preview is
    // connected again by the time the observer runs. Reopen it before restoring
    // state, because `scrollTop` written into a `display: none` subtree clamps to 0.
    if (usesPopover) {
      openInTopLayer(false);
    }
    updatePositionScale();
    applyAncestorScale();
    writePosition();
    contextualStyles?.reconnect();
    // Re-appending resets descendant scroll positions to 0. Restore the captured
    // offsets, in the same order as the first insertion, so a scrolled preview
    // keeps its scroll after a mid-drag re-home.
    clone?.applyPostInsertion();
  }

  // A React commit that recycles the preview's parent, such as a virtualizer
  // scrolling the row out or a keyed remount, detaches it after the engine
  // callback that triggered the commit. No synchronous check at the call site can
  // see that. The observer fires in the microtask after the commit, so the preview
  // is repaired even while the pointer is still. It watches `childList` on the
  // whole chain, because detaching an ancestor does not mutate the preview's parent.
  const observer = new win.MutationObserver(reconnect);
  for (const node of anchor.hosts.slice(anchor.hosts.indexOf(host))) {
    observer.observe(node, { childList: true });
  }

  return {
    element,
    isClone,
    anchor,
    sourceRect,
    setPosition(x, y) {
      position = { x, y };
      writePosition();
    },
    ensureConnected: reconnect,
    updateContentStyle(write) {
      if (destroyed) {
        return;
      }
      // Start over from the content's own inline style. The engine's declarations
      // go back on top, and the transition and popover corrections are measured
      // again, since the content's new styles may have changed them.
      ownTransitionTiming = null;
      dragTransition = null;
      engineStyles.delete('transition-duration');
      engineStyles.delete('transition-delay');
      write(engineStyles, () => {
        captureOwnOffsetStyle();
        applyEngineAttributes();
      });
      updatePositionScale();
      refreshPopoverCorrections(false);
      neutralizeTranslateTransition();
      readOwnOffset();
      writePosition();
    },
    prepareForDrop() {
      // Runs once `data-ending-style` is set, which lifts the neutralizer. The first
      // read below starts the ending transitions, so the motion they need comes
      // back first.
      restoreTranslateTransition();
      // The drop animates the way the clone's does: with a transition that applies
      // once `[data-ending-style]` is set. A transition the content already had
      // during the drag, such as a `transition: all` meant for hover effects, keeps
      // the preview from flying back, so it stays off for `translate`. Other
      // properties it covers, such as an ending fade, still run.
      if (
        dragTransition !== null &&
        getTransitionSignature(win.getComputedStyle(element)) === dragTransition
      ) {
        neutralizeTranslateTransition();
      }
      // Allow a distinct ending or preview rule, layered or not, without reviving the
      // motion the preview shares with the source. Source motion that was already
      // suppressed inline is cleared first so the comparison sees the cascade.
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
      // Ending styles can change the preview's `rotate`, `scale` or
      // `transform-origin`, which the ancestor scale and its offset depend on.
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
