import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { warn } from '@base-ui/utils/warn';
import { isElement, isShadowRoot } from '@floating-ui/utils/dom';
import { capturePreviewStyles } from './previewStyles';
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
import {
  COMPUTED_MATRIX,
  identityLinearTransform,
  multiplyLinearTransforms,
  parseComputedLinearTransform,
  parseRotateLinearTransform,
  parseScaleLinearTransform,
} from '../linearTransform';
import type { LinearTransform } from '../linearTransform';

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

/**
 * Marks the element the engine positions: the clone, or the empty host a custom
 * preview renders into. The engine finds the preview through it in either mode.
 * The public `data-drag-preview` is on the element the consumer styles instead,
 * which is the clone itself or the `Draggable.Preview` element inside the host.
 * The `data-base-ui-` prefix means it's internal, not a styling hook.
 */
export const PREVIEW_ELEMENT_ATTRIBUTE = 'data-base-ui-drag-preview';

/**
 * Keyed on `PREVIEW_ELEMENT_ATTRIBUTE`, so it never reaches the consumer's
 * `Draggable.Preview` element inside a custom preview's host. That element keeps
 * its own `transform`, `rotate` and motion.
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
 * The UA `[popover]` chrome needs no reset here. The `popover` attribute is on the
 * engine-owned wrapper (see below), not on the preview, and the wrapper resets
 * that chrome inline.
 */
const NEUTRALIZER_CSS =
  `[${PREVIEW_ELEMENT_ATTRIBUTE}]{transform:none}` +
  `[${PREVIEW_ELEMENT_ATTRIBUTE}]:where(:not([${DraggablePreviewDataAttributes.endingStyle}])){${MOTION_PROPERTIES.map((p) => `${p}:none`).join(';')}}`;

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
 * polyfill keeps its own state, so the wrapper is treated as open.
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
  /** The preview element. The engine writes only its `translate`. */
  readonly element: HTMLElement;
  /** `true` when this is an empty host for a declared preview, not a clone of the source. */
  readonly isHost: boolean;
  /** The source's border box at drag start, measured once. */
  readonly sourceRect: DOMRect;
  /** Viewport pixels per CSS translation unit of the preview. */
  readonly positionScale: DraggablePosition;
  /**
   * Re-home the preview if its host was torn out mid-drag (a virtualizer recycling
   * the row, a `dangerouslySetInnerHTML` parent re-rendering). Cheap enough to call
   * every frame. The common path is an `isConnected` read, plus a `:popover-open`
   * match for a top-layer preview.
   */
  ensureConnected(): void;
  destroy(): void;
  /** Restore motion rules before the ending-style transition is measured. */
  prepareForDrop(): void;
}

type PreviewHost = HTMLElement | ShadowRoot;

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';
/** Appended to every id in the clone, so it never duplicates one in the document. */
const ID_SUFFIX = '-drag-preview';

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

/** Strip state the clone must not carry, and neutralize nodes that would re-run. */
function sanitize(clone: HTMLElement, cloneNodes: Element[]): void {
  // Duplicate ids would break `getElementById`, `<label for>` and
  // `aria-labelledby`. Rewrite them, then update references inside the clone.
  // As a result, `#id` selectors do not style the preview. Classes and
  // `[data-drag-preview]` are the supported styling hooks.
  const rewritten = new Map<string, string>();
  for (const node of cloneNodes) {
    switch (node.localName) {
      case 'script':
        // `cloneNode` does not copy a script's "already started" flag, so a
        // descendant script re-executes the moment the clone is inserted.
        if (node !== clone) {
          node.remove();
        }
        break;
      case 'iframe':
        node.removeAttribute('src');
        // `srcdoc` takes precedence over `src`. Left in place, inserting the clone
        // would load the embedded document, scripts included, on every drag.
        node.removeAttribute('srcdoc');
        break;
      case 'object':
        // Like an iframe, an `<object>` or `<embed>` would fetch its resource again
        // and run an HTML or SVG document's scripts on every drag.
        node.removeAttribute('data');
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

    // A cloned control still belongs to the source's form, so it would be
    // submitted with the real one. A checked radio with the same `name` would also
    // uncheck the original when inserted, an open `<details>` in the source's
    // exclusive accordion would close itself, and a named `<form>` would turn
    // `document[name]` into a collection. A `<slot>` keeps its name, since a
    // nameless slot would take the host's unassigned children.
    if (node.localName !== 'slot') {
      node.removeAttribute('name');
    }

    const id = node.getAttribute('id');
    if (id) {
      const next = `${id}${ID_SUFFIX}`;
      rewritten.set(id, next);
      node.setAttribute('id', next);
    }
  }
  if (rewritten.size > 0) {
    const remap = (value: string) => rewritten.get(value) ?? value;
    const remapUrlFragments = (value: string) =>
      value.replace(/url\(\s*(['"]?)#([^\s)'"]+)\1\s*\)/g, (match, quote, id) => {
        const next = rewritten.get(id);
        return next ? `url(${quote}#${next}${quote})` : match;
      });
    for (const node of cloneNodes) {
      const htmlFor = node.getAttribute('for');
      if (htmlFor !== null) {
        node.setAttribute('for', remap(htmlFor));
      }
      for (const attribute of [
        'aria-labelledby',
        'aria-describedby',
        'aria-controls',
        'aria-owns',
      ]) {
        const value = node.getAttribute(attribute);
        if (value) {
          node.setAttribute(attribute, value.split(/\s+/).map(remap).join(' '));
        }
      }
      const href = node.getAttribute('href');
      if (href?.startsWith('#')) {
        node.setAttribute('href', `#${remap(href.slice(1))}`);
      }
      const xlinkHref = node.getAttributeNS(XLINK_NAMESPACE, 'href');
      if (xlinkHref?.startsWith('#')) {
        node.setAttributeNS(XLINK_NAMESPACE, 'xlink:href', `#${remap(xlinkHref.slice(1))}`);
      }
      for (const attribute of [
        'clip-path',
        'filter',
        'mask',
        'marker',
        'marker-start',
        'marker-mid',
        'marker-end',
        'fill',
        'stroke',
      ]) {
        const value = node.getAttribute(attribute);
        if (value?.includes('url(')) {
          node.setAttribute(attribute, remapUrlFragments(value));
        }
      }
      if (node.getAttribute('style')?.includes('url(')) {
        remapInlineStyleUrls(node, remapUrlFragments);
      }
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
 * Copy the live state `cloneNode` leaves behind. It copies attributes, so a form
 * control clones with its `defaultValue`/`defaultChecked` instead of what the user
 * typed, and a canvas clones with a blank backing store.
 *
 * The two node lists are walked in parallel, which only works while both trees
 * have the same structure. So this runs on the fresh clone, before `sanitize()`
 * removes nodes. Scroll offsets are no-ops on a detached node, so the returned
 * function applies them once the clone is inserted.
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

    // Use the source window's constructors. A draggable inside an iframe or popout
    // has its own, and this realm's would never match.
    if (from instanceof win.HTMLInputElement && to instanceof win.HTMLInputElement) {
      // A file input's value cannot be set from script (a non-empty value throws
      // `InvalidStateError`), so the clone's stays empty.
      if (from.type !== 'file') {
        to.value = from.value;
        to.checked = from.checked;
      }
    } else if (from instanceof win.HTMLTextAreaElement && to instanceof win.HTMLTextAreaElement) {
      to.value = from.value;
    } else if (from instanceof win.HTMLSelectElement && to instanceof win.HTMLSelectElement) {
      for (let option = 0; option < from.options.length; option += 1) {
        to.options[option].selected = from.options[option].selected;
      }
    } else if (from instanceof win.HTMLCanvasElement && to instanceof win.HTMLCanvasElement) {
      // The clone's backing store is blank. `drawImage` works on a detached canvas
      // and is far cheaper than a `toDataURL()` round-trip.
      try {
        to.getContext('2d')?.drawImage(from, 0, 0);
      } catch {
        // A tainted, WebGL or transferred-to-offscreen canvas cannot be read.
        // Leave the clone's canvas blank rather than failing the whole drag.
      }
    }

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

  const applyPostInsertion = copyLiveState(sourceNodes, cloneNodes, win);
  sanitize(element, cloneNodes);
  element.removeAttribute(DraggableRootDataAttributes.dragging);
  // Present on a source whose previous preview is still settling. A
  // `[data-settling] { color: transparent }` placeholder rule would otherwise hide
  // the preview's text for the whole drag.
  element.removeAttribute(DraggableRootDataAttributes.settling);

  return { element, sourceNodes, nodes: cloneNodes, applyPostInsertion };
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

/** The source's own 2D transform without translation or transform-origin. */
function getLinearTransform(sourceStyle: CSSStyleDeclaration): LinearTransform | null {
  let matrix = identityLinearTransform;
  if (sourceStyle.rotate !== 'none') {
    const rotate = parseRotateLinearTransform(sourceStyle.rotate, true);
    if (!rotate) {
      return null;
    }
    matrix = multiplyLinearTransforms(matrix, rotate);
  }

  if (sourceStyle.scale !== 'none') {
    const scale = parseScaleLinearTransform(sourceStyle.scale);
    if (!scale) {
      return null;
    }
    matrix = multiplyLinearTransforms(matrix, scale);
  }

  if (sourceStyle.transform !== 'none') {
    const transform = parseComputedLinearTransform(sourceStyle.transform, false);
    if (!transform) {
      return null;
    }
    matrix = multiplyLinearTransforms(matrix, transform);
  }

  return matrix;
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
  const matrix = getLinearTransform(sourceStyle);
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

/**
 * Build the element that follows the pointer and insert it next to the source, so
 * inherited properties and contextual descendant selectors still apply. It is a
 * clone of the source when `isClone`, or an empty host a declared preview renders
 * its content into.
 *
 * Clones keep computed values lost through the extra wrapper, including styles
 * from direct-child and sibling-position selectors, snapshotted from the source.
 * Rules keyed on `[data-drag-preview]` apply to the clone where it lives, so they
 * must not rely on its parent: `.List > .Card[data-drag-preview]` never matches.
 *
 * An engine-owned wrapper with `popover="manual"` promotes the preview to the top
 * layer. The wrapper's box renders as a sibling of the root while both nodes stay
 * in place in the DOM. The viewport becomes the containing block, so a transformed
 * ancestor cannot offset the preview, and no ancestor can clip it or trap it in a
 * stacking context. `manual` never light-dismisses or takes focus, so Escape still
 * cancels the drag.
 *
 * The wrapper is the popover, not the preview, so the UA `[popover]` chrome
 * (`margin: auto`, a solid border, an opaque `Canvas` background, `CanvasText`
 * color) lands on an element with no consumer styling and is reset inline there.
 * An author-sheet reset on the preview would be unlayered and beat every consumer
 * declaration in a cascade layer (see `NEUTRALIZED_PROPERTIES`).
 *
 * Browsers without the Popover API fall back to a plain `position: fixed` element,
 * which is correct outside transformed or clipping ancestors.
 *
 * Returns `null` when there is nowhere to insert it (a detached or parentless
 * source). The drag then runs without a preview.
 */
export function createDragPreviewElement(
  source: HTMLElement,
  requestedContainer: HTMLElement | null,
  isClone: boolean,
): DragPreviewElementHandle | null {
  const doc = ownerDocument(source);
  let container = requestedContainer;
  // The preview is measured and positioned in the source's document. Viewport
  // coordinates do not carry across documents, so a container in another document
  // would offset the preview by the frame's position. Render it in place instead.
  if (container && ownerDocument(container) !== doc) {
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

  const clone = isClone ? prepareDragPreviewClone(source, ownerWindow(source)) : undefined;

  // Keyed on the host, not the source. The preview mounts into
  // `container ?? hostOf(source)`. With a container in another root, such as a
  // shadow tree, a sheet adopted into the source's root would not reach the
  // preview, and it would keep the source's transitions.
  ensureNeutralizerStyles(host);

  const { sourceRect, scale: sourceScale } = measurePreviewSource(source);
  const width = sourceRect.width / sourceScale.x;
  const height = sourceRect.height / sourceScale.y;

  const element = clone?.element ?? doc.createElement('div');

  element.setAttribute(PREVIEW_ELEMENT_ATTRIBUTE, '');
  // The public styling hook goes on the element the consumer styles. A custom
  // preview's host is engine-owned, and the `Draggable.Preview` element rendered
  // into it carries the attribute instead.
  if (isClone) {
    element.setAttribute(DraggablePreviewDataAttributes.dragPreview, '');
  }
  element.setAttribute('aria-hidden', 'true');
  // Without it, a cloned `tabindex="0"` would be tabbable. The preview must never
  // be focusable or hit-tested.
  element.setAttribute('inert', '');

  // Geometry only. Every visual property stays in the cascade so that a consumer
  // rule keyed on `[data-drag-preview]` wins without `!important`.
  Object.assign(element.style, {
    position: 'fixed',
    top: '0px',
    left: '0px',
    // A source `right` or `inset-inline-end` would over-constrain the box. In a
    // right-to-left page the browser then drops `left` and pins it to the right.
    right: 'auto',
    bottom: 'auto',
    // Margins are not part of the measured rect and would shift the preview off
    // its transform anchor.
    margin: '0px',
    boxSizing: 'border-box',
    // `elementFromPoint` must see through the preview to the drop targets below.
    pointerEvents: 'none',
    willChange: 'translate',
    // Park off-screen until the first frame positions it. Uses `translate`, not
    // `transform`, so positioning composes outside a consumer `rotate`/`scale`
    // (see `positionPreviewElement`) and overwrites any `translate` the source had.
    translate: '-10000px -10000px',
    // A clone keeps the size it had in the source layout. A custom preview sizes
    // itself to its content.
    ...(isClone
      ? {
          width: `${width}px`,
          height: `${height}px`,
          minWidth: '0px',
          maxWidth: 'none',
          minHeight: '0px',
          maxHeight: 'none',
        }
      : null),
  });

  // Remove these instead of overwriting them. A clone carries the source's `style`
  // attribute, and an inline declaration would beat `NEUTRALIZER_CSS`.
  for (const property of NEUTRALIZED_PROPERTIES) {
    element.style.removeProperty(property);
  }

  // The element promoted to the top layer. The engine owns it, so the UA
  // `[popover]` chrome is reset inline without competing with consumer rules on
  // the preview (see the top-layer note above). It never paints or clips, since
  // the preview inside is `position: fixed` against the viewport.
  const wrapper = doc.createElement('div');
  Object.assign(wrapper.style, {
    position: 'fixed',
    inset: 'auto',
    top: '0px',
    left: '0px',
    margin: '0px',
    border: '0',
    padding: '0px',
    background: 'none',
    overflow: 'visible',
    width: '0px',
    height: '0px',
    transformOrigin: '0 0',
    // The UA popover chrome sets `color: CanvasText`, which the preview would
    // inherit. `inherit` takes the color from the wrapper's parent instead.
    color: 'inherit',
    pointerEvents: 'none',
    zIndex: '2147483647',
    // Rules for the source's siblings (`.List > *`) or for popovers reach the
    // wrapper too. An entrance animation or a hidden popover state would fade or
    // hide the preview on every pickup. `display` is left to the UA popover rules,
    // which the open state depends on.
    opacity: '1',
    visibility: 'inherit',
    filter: 'none',
    transform: 'none',
    translate: 'none',
    rotate: 'none',
    transition: 'none',
    animation: 'none',
  });
  // The wrapper, not the preview, is the element inserted among the container's
  // children, so layout code excludes it from sibling queries through this.
  wrapper.setAttribute(DraggablePreviewDataAttributes.dragPreviewContainer, '');
  wrapper.setAttribute('aria-hidden', 'true');
  // A source assigned to a named slot sits in a shadow host's light DOM. The
  // wrapper is appended there too, and an unassigned child is not rendered.
  const slot = source.getAttribute('slot');
  if (!container && slot !== null) {
    wrapper.setAttribute('slot', slot);
  }
  // Read from the source while the clone is still detached. Inserting the clone
  // beside the source would shift every sibling's `:nth-child` index and snapshot
  // it at a position the source does not hold.
  const contextualStyles = clone && capturePreviewStyles(clone.sourceNodes, clone.nodes);
  const applyTableCellWidths =
    clone && captureTableCellWidths(clone.sourceNodes, clone.nodes, ownerWindow(source));
  wrapper.appendChild(element);

  // The source's own motion at pickup, before `data-dragging` lands on it. The
  // neutralizer stops at the drop, so `prepareForDrop` compares the preview's
  // ending motion against it.
  const sourceMotion = new Map<string, string>();

  /**
   * A contextual motion rule from the source can outrank the shared neutralizer.
   * Suppress motion the preview shares with the source, but keep motion a preview
   * rule sets. Runs after the wrapper is connected, so the clone's computed style
   * reflects its real cascade, and before the contextual snapshot is restored.
   */
  function neutralizeInheritedMotion(): void {
    const win = ownerWindow(source);
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
        element.style.setProperty(property, 'none', 'important');
      }
    }
  }

  // The ancestor chain, captured while connected, so a mid-drag teardown can
  // re-home the preview as close as possible to its original cascade. It ends at
  // `documentElement` (or the shadow root), which outlives any subtree the app
  // tears down.
  const ancestorChain: PreviewHost[] = [];
  for (let node: PreviewHost | null = host; node !== null;) {
    ancestorChain.push(node);
    // Stepping out through a shadow host leaves the shadow cascade behind. Re-homing
    // only reaches that far once the shadow root itself is gone.
    node = isShadowRoot(node) ? (node.host as HTMLElement) : hostOf(node);
  }

  let destroyed = false;
  let usesPopover = false;
  let positionScale = { x: 1, y: 1 };

  function updatePositionScale(): void {
    const zoom = getElementZoom(element);
    // The top layer escapes ancestor transforms, so the wrapper re-applies the
    // ancestor scale. The clone's own layout and `rotate`/`scale` stay untouched.
    positionScale = isClone ? sourceScale : { x: zoom, y: zoom };
    const scaleX = positionScale.x / zoom;
    const scaleY = positionScale.y / zoom;
    wrapper.style.scale = scaleX === 1 && scaleY === 1 ? 'none' : `${scaleX} ${scaleY}`;
    // Expose the source's size to the preview content.
    element.style.setProperty(
      DraggablePreviewCssVars.dragSourceWidth,
      `${sourceRect.width / positionScale.x}px`,
    );
    element.style.setProperty(
      DraggablePreviewCssVars.dragSourceHeight,
      `${sourceRect.height / positionScale.y}px`,
    );
  }

  function openInTopLayer(): void {
    if (typeof wrapper.showPopover !== 'function') {
      return;
    }
    try {
      wrapper.setAttribute('popover', 'manual');
      wrapper.showPopover();
      usesPopover = true;
    } catch {
      // `showPopover` throws on a disconnected node. Fall back to the plain fixed
      // wrapper and drop the attribute, which would otherwise keep it `display: none`.
      wrapper.removeAttribute('popover');
      usesPopover = false;
    }
  }

  // Append the wrapper as the last child instead of next to the source. Both come
  // after the source in tree order, so `getElementById` still finds the real
  // element, but the last position leaves every sibling's `:nth-child` index
  // unchanged. It still shifts `:last-child`, `:only-child` and `:nth-last-child`
  // on the siblings, which a `container` avoids. The preview is unaffected either
  // way. Its structural styles were snapshotted from the source, and `restore()`
  // below re-applies whatever the wrapper position changed.
  host.appendChild(wrapper);
  openInTopLayer();
  updatePositionScale();
  if (isClone) {
    neutralizeInheritedMotion();
  }
  contextualStyles?.restore();
  applyTableCellWidths?.();
  clone?.applyPostInsertion();

  function reconnect(): void {
    if (destroyed) {
      return;
    }
    if (!element.isConnected) {
      // The nearest ancestor still in the document keeps as much of the original
      // cascade as possible. The body is the fallback.
      const survivor =
        ancestorChain.find((ancestor) => ancestor.isConnected) ?? doc.body ?? doc.documentElement;
      survivor.appendChild(wrapper);
    } else if (!usesPopover || isPopoverOpen(wrapper)) {
      return;
    }
    // Any DOM move closes an open popover and sends it back to `display: none`.
    // That includes reordering a connected ancestor, even though the wrapper is
    // connected again by the time the observer runs. Reopen it before restoring
    // state, because `scrollTop` written into a `display: none` subtree clamps to 0.
    if (usesPopover) {
      openInTopLayer();
    }
    updatePositionScale();
    contextualStyles?.reconnect();
    // Re-appending resets descendant scroll positions to 0. Restore the captured
    // offsets, in the same order as the first insertion, so a scrolled preview
    // keeps its scroll after a mid-drag re-home.
    clone?.applyPostInsertion();
  }

  // A React commit that recycles the preview's host, such as a virtualizer
  // scrolling the row out or a keyed remount, detaches it after the engine
  // callback that triggered the commit. No synchronous check at the call site can
  // see that. The observer fires in the microtask after the commit, so the preview
  // is repaired even while the pointer is still. It watches `childList` on the
  // whole chain, because detaching an ancestor does not mutate the preview's parent.
  const observer = new (ownerWindow(source).MutationObserver)(reconnect);
  for (const ancestor of ancestorChain) {
    observer.observe(ancestor, { childList: true });
  }

  return {
    element,
    isHost: !isClone,
    sourceRect,
    get positionScale() {
      return positionScale;
    },
    ensureConnected: reconnect,
    prepareForDrop() {
      // Runs once `data-ending-style` is set, which lifts the neutralizer. Allow a
      // distinct ending or preview rule, layered or not, without reviving the
      // motion the preview shares with the source. Source motion that was already
      // suppressed inline is cleared first so the comparison sees the cascade.
      if (sourceMotion.size === 0) {
        return;
      }
      for (const property of sourceMotion.keys()) {
        element.style.removeProperty(property);
      }
      const computed = ownerWindow(element).getComputedStyle(element);
      const inherited = Array.from(sourceMotion).filter(
        ([property, sourceValue]) => computed.getPropertyValue(property) === sourceValue,
      );
      for (const [property] of inherited) {
        element.style.setProperty(property, 'none', 'important');
      }
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      observer.disconnect();
      contextualStyles?.destroy();
      wrapper.remove();
    },
  };
}
