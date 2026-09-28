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
 * layered CSS out of that styling hook. `translate` needs no rule, because the
 * engine's inline write beats any author value.
 *
 * The clone inherits these from class rules and from the source's inline style.
 * The sheet below clears the first and `removeProperty` the second, and both
 * derive their property list from this one.
 */
const NEUTRALIZED_PROPERTIES = ['transition', 'animation', 'transform'];

/**
 * Not wrapped in `:where()`. At specificity (0,1,0) it beats the source's own
 * `.Card { transition }` on source order, while a consumer rule that also keys on
 * the attribute (`.Card[data-drag-preview] { transition: box-shadow .3s }`) still
 * wins. An inline declaration would force that consumer rule to use `!important`.
 *
 * The UA `[popover]` chrome needs no reset here. The `popover` attribute is on the
 * engine-owned wrapper (see below), not on the preview, and the wrapper resets
 * that chrome inline.
 */
const NEUTRALIZER_CSS = `[${DraggablePreviewDataAttributes.dragPreview}]{${NEUTRALIZED_PROPERTIES.map((p) => `${p}:none`).join(';')};}`;

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
      case 'video':
      case 'audio':
        node.removeAttribute('autoplay');
        node.setAttribute('preload', 'none');
        break;
      case 'input':
      case 'select':
      case 'textarea':
      case 'button':
        // A cloned control still belongs to the source's form, so it would be
        // submitted with the real one. A checked radio with the same `name` would
        // also uncheck the original when inserted.
        node.removeAttribute('name');
        break;
      default:
        break;
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
        'style',
      ]) {
        const value = node.getAttribute(attribute);
        if (value?.includes('url(')) {
          node.setAttribute(attribute, remapUrlFragments(value));
        }
      }
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
      node.scrollTop = top;
      node.scrollLeft = left;
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
  const width = hasTransform ? source.offsetWidth * ancestorScale.x : rect.width;
  const height = hasTransform ? source.offsetHeight * ancestorScale.y : rect.height;
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
    warn(
      'a drag preview `container` belongs to a different document than its draggable. ' +
        'Viewport coordinates do not carry across documents, so the preview would be offset by the frame position. ' +
        "Rendering the preview in place instead. Pass a container from the draggable's own document.",
    );
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

  element.setAttribute(DraggablePreviewDataAttributes.dragPreview, '');
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
  });
  const restoredMotion = new Map<string, string>();
  // Read from the source while the clone is still detached. Inserting the clone
  // beside the source would shift every sibling's `:nth-child` index and snapshot
  // it at a position the source does not hold.
  const contextualStyles = clone && capturePreviewStyles(clone.sourceNodes, clone.nodes);
  wrapper.appendChild(element);

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
      const value = previewStyle.getPropertyValue(property);
      const activeMotion =
        property === 'transition'
          ? previewStyle.transitionDuration
              .split(',')
              .some((duration) => Number.parseFloat(duration) > 0)
          : value !== 'none';
      if (activeMotion && value && value === sourceStyle.getPropertyValue(property)) {
        // `transform` is geometry rather than motion, so it stays neutralized for the drop.
        if (property !== 'transform') {
          restoredMotion.set(property, value);
        }
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
    } else if (!usesPopover || wrapper.matches(':popover-open')) {
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
      // Allow a distinct ending rule without reviving inherited source motion.
      for (const [property, inheritedValue] of restoredMotion) {
        element.style.removeProperty(property);
        if (
          ownerWindow(element).getComputedStyle(element).getPropertyValue(property) ===
          inheritedValue
        ) {
          element.style.setProperty(property, 'none', 'important');
        }
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
