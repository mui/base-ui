import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { isShadowRoot } from '@floating-ui/utils/dom';
import { applySourceSizeVars } from '../customDragPreview';
import { getSharedSlot } from '../sharedState';
import {
  identityLinearTransform,
  multiplyLinearTransforms,
  parseComputedLinearTransform,
  parseRotateLinearTransform,
  parseScaleLinearTransform,
  type LinearTransform,
} from '../linearTransform';

/**
 * Marks the preview so consumers can style it with the source's own selector —
 * `.Card[data-drag-preview] { box-shadow: … }`. This only works because the clone
 * keeps the source's classes and the engine writes *geometry* inline and nothing
 * else; any visual property written inline would beat every class rule.
 */
const DRAG_PREVIEW_ATTR = 'data-drag-preview';

/**
 * Properties the preview must not inherit from the source. The preview is
 * repositioned by writing `translate` every frame: a source `transition` that
 * covers it would ease every one of those writes so the preview trails the
 * pointer, and a running `@keyframes` on it sits in the animation origin and
 * would pin it in place entirely.
 *
 * `transform` is neutralized too, but for its geometry rather than its timing:
 * its translation components (a source grabbed mid-FLIP) would shift the clone
 * off the grab anchor and double-count the offset already baked into the
 * measured rect.
 *
 * `rotate` and `scale` are deliberately *not* neutralized: the individual
 * properties compose as `translate × rotate × scale × transform`, so the engine's
 * `translate` stays outermost and they spin or scale the preview about its own
 * box without displacing it — they are the properties consumers use to style the
 * preview (`.Card[data-drag-preview] { rotate: 4deg }`, Tailwind's `rotate-4`),
 * and a source that carries them keeps its look on the clone. The unlayered
 * engine rule below outranks every declaration that lives in a cascade layer —
 * which is where all of a Tailwind v4 consumer's utilities sit — so neutralizing
 * them here would make that styling hook unreachable for layered CSS.
 * `translate` itself needs no rule: the engine's inline positioning write beats
 * any author value.
 *
 * Cleared from both origins the clone inherits them through — the sheet below for
 * class rules, `removeProperty` for the source's own inline style — so the two
 * lists are derived from this one.
 */
const NEUTRALIZED_PROPERTIES = ['transition', 'animation', 'transform'];

/**
 * Deliberately *not* `:where()`: at specificity (0,1,0) this beats the source's
 * own `.Card { transition }` on order, while a consumer rule that also keys on
 * the attribute (`.Card[data-drag-preview] { transition: box-shadow .3s }`) still
 * wins — which an inline declaration would have made impossible without
 * `!important`.
 *
 * The UA `[popover]` chrome needs no author-origin reset here: the `popover`
 * attribute lives on the engine-owned wrapper (see below), never on the preview
 * itself, so the chrome lands on an element with no consumer styling contract
 * and is neutralized inline.
 */
const NEUTRALIZER_CSS = `[${DRAG_PREVIEW_ATTR}]{${NEUTRALIZED_PROPERTIES.map((p) => `${p}:none`).join(';')};}`;

/**
 * A constructable stylesheet rather than a `<style>` element: the CSSOM path is
 * exempt from CSP `style-src`, so a strict policy can't block it. Adopted once per
 * document/shadow root (deduped via the shared slot); a shadow root needs its own,
 * because document styles do not cross the boundary but the UA popover rules do.
 */
const neutralizerRoots = getSharedSlot(
  'dragPreviewNeutralizerRoots',
  () => new WeakSet<DocumentOrShadowRoot>(),
);

function ensureNeutralizerStyles(host: Element | ShadowRoot | Document): void {
  const root = 'getRootNode' in host ? host.getRootNode() : host;
  // Realm-safe `instanceof` (`isShadowRoot`): a draggable inside a shadow root that
  // lives in an iframe/popout has its own `ShadowRoot` constructor, and this realm's
  // would never match — the neutralizer sheet would then land on the iframe document
  // instead of the shadow root, leaving the preview with the source's transitions.
  const target: DocumentOrShadowRoot = isShadowRoot(root) ? root : ownerDocument(host as Element);
  if (neutralizerRoots.has(target) || !('adoptedStyleSheets' in target)) {
    return;
  }
  neutralizerRoots.add(target);
  const sheet = new (ownerWindow(host as Element).CSSStyleSheet)();
  sheet.replaceSync(NEUTRALIZER_CSS);
  target.adoptedStyleSheets = [...target.adoptedStyleSheets, sheet];
}

export interface DragPreviewElementHandle {
  /** The preview element. The engine writes only its `translate`. */
  readonly element: HTMLElement;
  /** `true` when this is an empty host for a declared preview, not a clone of the source. */
  readonly isHost: boolean;
  /** The source's border box at drag start. Measured once; reused by the callers. */
  readonly sourceRect: DOMRect;
  /**
   * Re-home the preview if its host was torn out mid-drag (a virtualizer recycling
   * the row, a `dangerouslySetInnerHTML` parent re-rendering). Cheap enough to call
   * every frame — the happy path is a single `isConnected` read.
   */
  ensureConnected(): void;
  destroy(): void;
}

export interface CreateDragPreviewElementOptions {
  /**
   * `'clone'` copies the source element. `'host'` creates an empty element for a
   * `Draggable.Preview` to render its content into — it sits in the same place and
   * gets the same treatment, so custom previews inherit the app's CSS exactly as
   * the clone does.
   */
  content: 'clone' | 'host';
  /** Where to inject the preview. Defaults to the source's parent (in place). */
  container?: HTMLElement | null | undefined;
}

export type DragPreviewElementFactory = (
  source: HTMLElement,
  container: HTMLElement | null,
) => DragPreviewElementHandle | null;

type PreviewHost = HTMLElement | ShadowRoot;

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';

/**
 * The node the preview hangs off. A draggable that is a *direct* child of a shadow
 * root has no `parentElement`, and appending to the shadow root keeps the preview
 * under the same styles.
 */
function hostOf(node: Node): PreviewHost | null {
  const parent = node.parentNode;
  if (parent && isShadowRoot(parent)) {
    return parent;
  }
  return (node as Element).parentElement ?? null;
}

/**
 * A custom element cannot be cloned inertly in its live document: `cloneNode`
 * runs its constructor, and connecting the preview then runs lifecycle callbacks.
 * Treat both defined and not-yet-defined custom-element names as unsafe, since a
 * definition registered during the drag would upgrade the connected clone.
 */
function isCustomElementCandidate(element: Element): boolean {
  return (
    element.namespaceURI === HTML_NAMESPACE &&
    (element.localName.includes('-') || element.getAttribute('is')?.includes('-') === true)
  );
}

/**
 * Clone a tree while replacing custom elements with native inert placeholders.
 * The computed style copy preserves the host box reasonably closely without
 * constructing, upgrading, connecting, or disconnecting application code.
 */
function cloneWithoutCustomElements(
  source: HTMLElement,
  win: Window & typeof globalThis,
): { element: HTMLElement; sourceNodes: Element[]; cloneNodes: Element[] } {
  const sourceNodes: Element[] = [];
  const cloneNodes: Element[] = [];

  function cloneNode(node: Node): Node {
    if (!(node instanceof win.Element)) {
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
      for (let index = 0; index < computed.length; index += 1) {
        const property = computed.item(index);
        placeholderStyle.setProperty(
          property,
          computed.getPropertyValue(property),
          computed.getPropertyPriority(property),
        );
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
function sanitize(clone: HTMLElement, cloneNodes: Element[], idSuffix: string): void {
  // Duplicate ids would poison `getElementById`, `<label for>` and
  // `aria-labelledby`. Rewrite them, then re-point the references that live
  // inside the clone so they keep resolving to the clone's own nodes.
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
        // `srcdoc` wins over `src`; left in place, inserting the clone would
        // re-execute the embedded document (scripts and all) once per drag.
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
        // submitted alongside the real one — and a checked radio with the same
        // `name` would uncheck the original when inserted.
        node.removeAttribute('name');
        break;
      default:
        break;
    }

    const id = node.getAttribute('id');
    if (id) {
      const next = `${id}${idSuffix}`;
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
      for (const attribute of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
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
 * Copy the live state `cloneNode` leaves behind. It copies *attributes*, so a form
 * control clones with its `defaultValue`/`defaultChecked` rather than what the user
 * typed, and a canvas clones with a blank backing store.
 *
 * The two node lists are zipped, which is only sound while they are still
 * structurally identical — so this runs on the freshly-cloned tree, before
 * `sanitize()` removes anything from it. Scroll offsets are no-ops on a detached
 * node, so they are deferred to `applyPostInsertion`.
 */
function copyLiveState(
  sourceNodes: Element[],
  cloneNodes: Element[],
  win: Window & typeof globalThis,
): { applyPostInsertion: () => void } {
  const scrolls: Array<{ node: HTMLElement; top: number; left: number }> = [];

  for (let i = 0; i < sourceNodes.length; i += 1) {
    const from = sourceNodes[i];
    const to = cloneNodes[i];

    // Realm-safe: a draggable inside an iframe or popout window has its own
    // constructors, and this realm's would never match.
    if (from instanceof win.HTMLInputElement && to instanceof win.HTMLInputElement) {
      // A file input's value cannot be set programmatically (a non-empty
      // assignment throws `InvalidStateError`), and the selection isn't
      // copyable anyway — leave the clone's empty.
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

  return {
    applyPostInsertion() {
      for (const { node, top, left } of scrolls) {
        node.scrollTop = top;
        node.scrollLeft = left;
      }
    },
  };
}

interface PreparedDragPreviewClone {
  element: HTMLElement;
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

  const { applyPostInsertion } = copyLiveState(sourceNodes, cloneNodes, win);
  sanitize(element, cloneNodes, '-drag-preview');
  element.removeAttribute('data-dragging');
  element.removeAttribute('data-displacing');
  element.removeAttribute('data-starting-style');
  element.style.removeProperty('--drag-displacement-x');
  element.style.removeProperty('--drag-displacement-y');

  return { element, applyPostInsertion };
}

/** A `transform` that only translates, which leaves the box's size untouched. */
const TRANSLATE_ONLY = /^translate(3d|X|Y)?\([^)]*\)$/;
const MATRIX = /^matrix(3d)?\(([^)]*)\)$/;

/**
 * Whether a computed `transform` only translates. Browsers resolve the computed
 * `transform` of a rendered element to matrix form, so the literal
 * `translate(…)` spelling only ever appears in non-rendering environments —
 * a pure translation has to be recognized in its matrix form too: an identity
 * matrix with only the offset components (`m41`/`m42`/`m43`) free.
 */
function isTranslationOnly(transform: string): boolean {
  if (TRANSLATE_ONLY.test(transform)) {
    return true;
  }
  const matrix = transform.match(MATRIX);
  if (!matrix) {
    return false;
  }
  const values = matrix[2].split(',').map(Number);
  if (matrix[1]) {
    // Column-major: the diagonal sits at 0/5/10/15, the translation at 12–14.
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
    const parts = sourceStyle.scale.trim().split(/\s+/);
    const scale = parseScaleLinearTransform(sourceStyle.scale);
    if (!scale || parts.length > 3 || parts.some((part) => !Number.isFinite(Number(part)))) {
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
  // transformed axis-aligned bounding box. Undo that center displacement using
  // the real transform origin; unlike re-centering, this works for top-left and
  // other custom origins as well as the default center.
  const centerX = width / 2;
  const centerY = height / 2;
  const relativeX = centerX - originX;
  const relativeY = centerY - originY;
  const transformedCenterX = originX + matrix.a * relativeX + matrix.c * relativeY;
  const transformedCenterY = originY + matrix.b * relativeX + matrix.d * relativeY;

  return new win.DOMRect(
    rect.x + rect.width / 2 - transformedCenterX,
    rect.y + rect.height / 2 - transformedCenterY,
    width,
    height,
  );
}

/**
 * Build the element that follows the pointer — a clone of the source, or an empty
 * host a declared preview renders its content into — and inject it next to the source
 * so the app's CSS still applies to it. Inherited properties, custom properties,
 * and contextual selectors (`.dark .card`, `.list > .item`, CSS-module ancestor
 * rules) all keep matching, because the preview's ancestor chain is the source's.
 *
 * It is promoted to the **top layer** through an engine-owned wrapper carrying
 * `popover="manual"`, which reparents the wrapper's box to a sibling of the root:
 * the containing block becomes the viewport, so a transformed ancestor can no
 * longer offset the preview, and no ancestor can clip it or trap it in a stacking
 * context — all while both stay where they are in the DOM. `manual` never
 * light-dismisses and never steals focus, so Escape still cancels the drag.
 * The wrapper, not the preview, is the popover on purpose: the UA `[popover]`
 * chrome (`margin: auto`, a solid border, an opaque `Canvas` background,
 * `CanvasText` color) lands on an element with no consumer styling contract and is
 * neutralized inline there. An author-sheet reset on the preview itself would sit
 * unlayered and defeat every consumer declaration that lives in a cascade layer
 * (see `NEUTRALIZED_PROPERTIES`).
 * Engines without the Popover API fall back to a plain `position: fixed` element,
 * which is correct outside transformed/clipping ancestors.
 *
 * Returns `null` when there is nowhere to inject it (a detached or parentless
 * source); the drag then simply runs without a preview.
 */
function createPreparedDragPreviewElement(
  source: HTMLElement,
  options: {
    container?: HTMLElement | null | undefined;
    clone?: PreparedDragPreviewClone | undefined;
  },
): DragPreviewElementHandle | null {
  const doc = ownerDocument(source);
  let container = options.container ?? null;
  // The preview is measured, styled and positioned in the source's realm — viewport
  // coordinates from one document mean nothing in another, and the neutralizer
  // sheet is adopted into the source's root. Adopting the preview into a foreign
  // document would offset it by the frame's own position, so keep it in place instead.
  if (container && ownerDocument(container) !== doc) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Base UI: a drag preview `container` belongs to a different document than its draggable. ' +
          'Viewport coordinates do not carry across documents, so the preview would be offset by the frame position. ' +
          'Rendering the preview in place instead — pass a container from the draggable’s own document.',
      );
    }
    container = null;
  }

  const host = container ?? hostOf(source);
  if (!host || !source.isConnected) {
    return null;
  }

  const win = ownerWindow(source);
  // Keyed on the *host*, not the source: the preview mounts into
  // `container ?? hostOf(source)`, and with a container in a different root
  // (a shadow tree, say) adopting the sheet into the source's root leaves the
  // preview carrying the source transitions the neutralizer exists to remove.
  ensureNeutralizerStyles(host);

  // `getBoundingClientRect` includes the source's own transform. The clone
  // renders with `transform` neutralized but re-applies the individual
  // `rotate`/`scale` properties to whatever box it is given, so a transformed
  // source must be measured from its untransformed border box.
  //
  // CSS Transforms 2 splits `scale`/`rotate`/`translate` out of `transform`, and
  // they do *not* fold into the computed `transform` — so a source styled
  // `scale: 1.5` (the hover-lift pattern) reads as untransformed unless all four
  // are checked. Sizing from the transformed AABB would compound the re-applied
  // `scale: 1.5` to ~2.25x.
  const untransformedRect = source.getBoundingClientRect();
  const sourceStyle = win.getComputedStyle(source);
  // Translation is excluded, in both spellings: it moves the box without resizing
  // it, so the rect's own dimensions are already right — and they are exact,
  // where `offsetWidth` rounds to an integer and would cost the preview its
  // subpixel size.
  //
  const hasTransform =
    (sourceStyle.transform !== '' &&
      sourceStyle.transform !== 'none' &&
      !isTranslationOnly(sourceStyle.transform)) ||
    (sourceStyle.scale !== '' && sourceStyle.scale !== 'none') ||
    (sourceStyle.rotate !== '' && sourceStyle.rotate !== 'none');
  const width = hasTransform ? source.offsetWidth : untransformedRect.width;
  const height = hasTransform ? source.offsetHeight : untransformedRect.height;
  // Everything downstream — the default `'source'` offset, the `--drag-source-*`
  // variables — has to describe the same box the preview actually has, or the
  // preview is anchored against a box it doesn't own and jumps on pickup.
  //
  // So the untransformed *size* has to be paired with the position obtained by
  // undoing the source's own transform around its computed transform-origin.
  const sourceRect = hasTransform
    ? getUntransformedSourceRect(untransformedRect, width, height, sourceStyle, win)
    : untransformedRect;

  const isClone = options.clone !== undefined;
  const element = options.clone?.element ?? doc.createElement('div');
  const applyPostInsertion = options.clone?.applyPostInsertion ?? (() => {});

  element.setAttribute(DRAG_PREVIEW_ATTR, '');
  element.setAttribute('aria-hidden', 'true');
  // A cloned `tabindex="0"` would otherwise be tabbable, and the preview must never
  // be hit-tested or reachable.
  element.setAttribute('inert', '');

  // Let a custom preview match the element it replaces if it wants to.
  applySourceSizeVars(element, sourceRect);

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
    // Park off-screen until the first frame positions it. `translate`, not
    // `transform`: positioning composes outside a consumer `rotate`/`scale`
    // (see `positionPreviewElement`), and it overwrites any `translate` the
    // source carried.
    translate: '-10000px -10000px',
    zIndex: '2147483647',
    // A clone must keep the box it had in the layout it just left; a custom preview
    // sizes itself to its own content.
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

  // Strip rather than overwrite: a clone carries the source's `style` attribute,
  // and an inline declaration would beat `NEUTRALIZER_CSS`.
  for (const property of NEUTRALIZED_PROPERTIES) {
    element.style.removeProperty(property);
  }

  // The element that actually gets promoted to the top layer. Engine-owned, so the
  // UA `[popover]` chrome can be neutralized inline without competing with any
  // consumer rule on the preview itself (see the top-layer note above). It never
  // paints or clips: the preview inside is `position: fixed` and positions against
  // the viewport.
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
    // The UA popover chrome sets `color: CanvasText`, which the preview would
    // inherit; `inherit` re-opens the chain to the wrapper's own parent.
    color: 'inherit',
    pointerEvents: 'none',
    zIndex: '2147483647',
  });
  wrapper.appendChild(element);

  // The ancestor chain, captured while it is still alive, so a mid-drag teardown can
  // re-home the preview as close to its original cascade as possible. It ends at
  // `documentElement` (or the shadow root), which outlives any subtree the app tears down.
  const ancestorChain: PreviewHost[] = [];
  for (let node: PreviewHost | null = host; node !== null; ) {
    ancestorChain.push(node);
    // Crossing out through a shadow host leaves that cascade behind, but that step is
    // only ever reached once the shadow root itself has been torn out.
    node = isShadowRoot(node) ? (node.host as HTMLElement) : hostOf(node);
  }

  let destroyed = false;
  let usesPopover = false;

  function openInTopLayer(): void {
    if (typeof wrapper.showPopover !== 'function') {
      return;
    }
    try {
      wrapper.setAttribute('popover', 'manual');
      wrapper.showPopover();
      usesPopover = true;
    } catch {
      // A disconnected node throws. Fall back to the plain fixed wrapper — the
      // `popover` attribute would otherwise keep it `display: none`.
      wrapper.removeAttribute('popover');
      usesPopover = false;
    }
  }

  // Insert as the *last* child rather than next to the source: both are after the
  // source in tree order (so `getElementById` still finds the real element), but
  // last-child leaves every existing sibling's `:nth-child` index untouched. It
  // does still shift `:last-child` / `:only-child` / `:nth-last-child` on the
  // siblings — pass a `container` to avoid that.
  host.appendChild(wrapper);
  openInTopLayer();
  applyPostInsertion();

  function reconnect(): void {
    if (destroyed || element.isConnected) {
      return;
    }
    // The nearest ancestor still in the document keeps as much of the original
    // cascade as survives; the document body is the floor.
    const survivor =
      ancestorChain.find((ancestor) => ancestor.isConnected) ?? doc.body ?? doc.documentElement;
    survivor.appendChild(wrapper);
    // Any DOM move closes an open popover (and sends it back to `display: none`).
    // Reopen it *before* restoring state: writing `scrollTop` into a
    // `display: none` subtree clamps to 0 and the restoration is silently lost.
    if (usesPopover) {
      openInTopLayer();
    }
    // Re-appending resets descendant scroll positions to 0; restore the captured
    // offsets so an internally-scrolled preview subtree keeps its scroll after a
    // mid-drag re-home, in the same order as the initial insertion.
    applyPostInsertion();
  }

  // A React commit that recycles the preview's host — a virtualizer scrolling the
  // row out, a keyed remount — detaches it *after* whatever engine callback
  // triggered that commit, so no synchronous check at the call site can see it.
  // The observer fires in the microtask right after the commit, so the preview is
  // repaired even while the pointer sits still and nothing re-renders it.
  // `childList` on the whole captured chain, because detaching an ancestor does
  // not mutate the preview's own parent.
  const observer = new (ownerWindow(source).MutationObserver)(reconnect);
  for (const ancestor of ancestorChain) {
    observer.observe(ancestor, { childList: true });
  }

  return {
    element,
    isHost: !isClone,
    sourceRect,
    ensureConnected: reconnect,
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      observer.disconnect();
      if (usesPopover && wrapper.isConnected) {
        try {
          wrapper.hidePopover();
        } catch {
          // Already closed by a DOM move; removing it below is enough.
        }
      }
      wrapper.remove();
    },
  };
}

export const createDragPreviewHostElement: DragPreviewElementFactory = (source, container) =>
  createPreparedDragPreviewElement(source, { container });

export const createClonedDragPreviewElement: DragPreviewElementFactory = (source, container) =>
  source.isConnected
    ? createPreparedDragPreviewElement(source, {
        container,
        clone: prepareDragPreviewClone(source, ownerWindow(source)),
      })
    : null;

/** @internal Kept as a test helper for exercising both preview element variants. */
export function createDragPreviewElement(
  source: HTMLElement,
  options: CreateDragPreviewElementOptions,
): DragPreviewElementHandle | null {
  return options.content === 'clone'
    ? createClonedDragPreviewElement(source, options.container ?? null)
    : createDragPreviewHostElement(source, options.container ?? null);
}
