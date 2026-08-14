import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { isShadowRoot } from '@floating-ui/utils/dom';
import { contains } from '@base-ui/utils/shadowDom';
import type { DragInput, DragModifierKeys, DragPointerType, DragPosition } from '../../types/drag';
import { getParentElement as getComposedParentElement } from '../getParentElement';
import {
  identityLinearTransform,
  multiplyLinearTransforms,
  parseComputedLinearTransform,
  parseRotateLinearTransform,
  parseScaleLinearTransform,
} from './linearTransform';

/**
 * Wrap a cleanup so calling it more than once (or after React has already run
 * it) is a no-op. The engine's registrations and setups all rely on this
 * idempotence when they hand cleanups to consumers.
 */
export function onceCleanup(cleanup: () => void): () => void {
  let done = false;
  return () => {
    if (done) {
      return;
    }
    done = true;
    cleanup();
  };
}

/**
 * Resolve an element declared as a plain element, a ref, or a getter — the
 * shape shared by `dragHandle`, `container`, and `restrictToElement`'s `element`
 * — or `null` when unset. `argument` is handed to the getter form; `container`
 * passes the source element so a callback can find a container relative to it.
 */
export function resolveElementReference<T extends Element, TArgument = void>(
  reference:
    | T
    | { current: T | null }
    | ((argument: TArgument) => T | null | undefined)
    | undefined,
  argument: TArgument,
): T | null {
  if (!reference) {
    return null;
  }
  if (typeof reference === 'function') {
    return reference(argument) ?? null;
  }
  if ('current' in reference) {
    return reference.current;
  }
  return reference;
}

/**
 * The host of the shadow root a node lives in, or `null` when the node is not
 * inside a shadow tree. Realm-safe (`isShadowRoot` resolves `ShadowRoot` from the
 * node's own window).
 */
export function getShadowHost(node: Element): Element | null {
  const root = node.getRootNode();
  return isShadowRoot(root) ? root.host : null;
}

/**
 * Walk to a node's composed parent element, stepping through an assigned slot
 * and crossing out of a shadow root through its host. Returns `null` at the top
 * of the document.
 */
export { getComposedParentElement };

/** The event root that can observe a node before closed-shadow retargeting. */
export function getDragEventRoot(node: Element): Document | ShadowRoot {
  const root = node.getRootNode();
  return isShadowRoot(root) ? root : ownerDocument(node);
}

/**
 * Hit-test what sits under (`clientX`, `clientY`), descending into open shadow
 * roots: `elementFromPoint` on the document stops at the shadow *host*, so a drop
 * target inside a shadow tree would otherwise never be entered. Registered closed
 * roots can be supplied because their host does not expose them through
 * `Element.shadowRoot`.
 *
 * Optional-chained at both levels: jsdom implements `elementFromPoint` on neither
 * `Document` nor `ShadowRoot`. This runs from the activation commit, outside every
 * containment boundary and after the pending listeners are gone, so a `TypeError`
 * here would strand the sensor and refuse every later pickup. Degrade to "nothing
 * under the pointer" instead.
 */
export function deepElementFromPoint(
  doc: Document,
  clientX: number,
  clientY: number,
  retainedShadowRoots: Iterable<ShadowRoot> = [],
): Element | null {
  const rootsByHost = new Map<Element, ShadowRoot>();
  for (const retained of retainedShadowRoots) {
    let root: Node = retained;
    // A target's retained root can itself be nested in a closed outer root.
    // Walking out through each host recovers those otherwise-invisible roots
    // without making the registry retain/count the same target more than once.
    while (isShadowRoot(root)) {
      rootsByHost.set(root.host, root);
      root = root.host.getRootNode();
    }
  }
  let hit = doc.elementFromPoint?.(clientX, clientY) ?? null;
  let innerRoot = hit ? (hit.shadowRoot ?? rootsByHost.get(hit)) : undefined;
  while (innerRoot) {
    const inner = innerRoot.elementFromPoint?.(clientX, clientY);
    if (!inner || inner === hit) {
      break;
    }
    hit = inner;
    innerRoot = hit.shadowRoot ?? rootsByHost.get(hit);
  }
  return hit;
}

/**
 * Hit-test what sits under (`clientX`, `clientY`) in `doc`, ignoring the drag
 * preview and descending into open shadow roots (see {@link deepElementFromPoint}).
 * The preview is `pointer-events: none`, so it is normally skipped by
 * `elementFromPoint` — but consumer preview content can set `pointer-events: auto`
 * and intercept the hit, which would otherwise freeze drop-target resolution on the
 * preview itself. When the hit lands inside it, remove it from hit-testing
 * synchronously (no repaint, so no flicker) and re-resolve what is underneath.
 */
export function elementFromPointIgnoring(
  doc: Document,
  clientX: number,
  clientY: number,
  ignore: HTMLElement | null,
  retainedShadowRoots: Iterable<ShadowRoot> = [],
): Element | null {
  const shadowRoots = [...retainedShadowRoots];
  const found = deepElementFromPoint(doc, clientX, clientY, shadowRoots);
  if (!found || ignore == null || !contains(ignore, found)) {
    return found;
  }
  // Use `display: none`, not `visibility: hidden`: a descendant with inline
  // `visibility: visible` re-shows itself and stays hit-testable, defeating the
  // ignore. `display: none` removes the whole subtree from layout/hit-testing
  // regardless of any descendant override.
  //
  // Hiding a manual popover closes it, which silently demotes the preview out of
  // the top layer — where it then clips and offsets under transformed ancestors
  // for the rest of the drag. Nothing re-opens it: the reconnect path only runs
  // for a *disconnected* preview. So note whether it was open and restore that.
  const wasPopoverOpen = isPopoverOpen(ignore);
  const previousDisplay = ignore.style.display;
  ignore.style.display = 'none';
  const behind = deepElementFromPoint(doc, clientX, clientY, shadowRoots);
  ignore.style.display = previousDisplay;
  if (wasPopoverOpen && !isPopoverOpen(ignore)) {
    try {
      ignore.showPopover();
    } catch {
      // Already open, or no longer connected: nothing to repair.
    }
  }
  return behind;
}

/** Whether `element` is an open popover, in browsers that implement it. */
function isPopoverOpen(element: HTMLElement): boolean {
  try {
    return typeof element.showPopover === 'function' && element.matches(':popover-open');
  } catch {
    // `:popover-open` is unknown to older engines, where `matches` throws.
    return false;
  }
}

/**
 * Whether a document's browsing context is gone — its iframe was removed, or
 * its popout window closed. A drag session living in such a document can never
 * receive a terminating event (every teardown listener lived in the dead
 * realm), so the sensors use this to self-heal instead of refusing every
 * future pickup. Deliberately not element connectivity: a virtualizer detaches
 * the dragged node mid-drag while its document stays perfectly alive.
 */
export function isDetachedDocument(doc: Document): boolean {
  const win = doc.defaultView;
  return win === null || win.closed === true;
}

/**
 * The layout viewport size. Prefers `documentElement.clientWidth/Height` over
 * `innerWidth/innerHeight`, which include the scrollbar gutter where
 * `elementFromPoint` resolves nothing; falls back to the window size when layout
 * reports 0 (a detached document, or jsdom). Shared by the keyboard sensor's
 * cursor clamp and `restrictToWindowEdges` so both agree on where the edge is.
 */
export function getViewportSize(win: Window): { width: number; height: number } {
  const docEl = win.document.documentElement;
  return {
    width: docEl.clientWidth || win.innerWidth,
    height: docEl.clientHeight || win.innerHeight,
  };
}

/**
 * Whether the client point (`x`, `y`) lies within `rect`, inclusive of all four
 * edges. Shared by the auto-scroller (pointer-in-scroller test) and keyboard
 * collision (skip a container the cursor is already inside).
 */
export function isPointInRect(
  x: number,
  y: number,
  rect: { left: number; top: number; right: number; bottom: number },
): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export function normalizePointerType(raw: string | undefined): DragPointerType {
  if (raw === 'touch' || raw === 'pen') {
    return raw;
  }
  return 'mouse';
}

/** Build an `DragInput` snapshot from a pointer event. */
export function getInput(event: PointerEvent): DragInput {
  return {
    button: event.button,
    buttons: event.buttons,
    clientX: event.clientX,
    clientY: event.clientY,
    pageX: event.pageX,
    pageY: event.pageY,
    pointerType: normalizePointerType(event.pointerType),
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
  };
}

/**
 * Rebase a `DragInput` onto `point`, shifting the page coordinates by the same
 * delta. Shared by both sensor stacks so consumer predicates are asked about
 * the position the cursor would land on rather than the one it is leaving.
 */
export function remapInput(input: DragInput, point: DragPosition): DragInput {
  if (point.x === input.clientX && point.y === input.clientY) {
    return input;
  }
  return {
    ...input,
    clientX: point.x,
    clientY: point.y,
    pageX: input.pageX + (point.x - input.clientX),
    pageY: input.pageY + (point.y - input.clientY),
  };
}

/** No modifier key held: what an input synthesized without an event reports. */
export const NO_MODIFIER_KEYS: DragModifierKeys = {
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
};

/** Just the four modifier flags of an event, for handing on to a synthesized input. */
export function getModifierKeys(event: KeyboardEvent | MouseEvent): DragModifierKeys {
  return {
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
  };
}

/** Whether two key snapshots differ, so a no-op key press can be ignored. */
export function modifierKeysChanged(a: DragModifierKeys, b: DragModifierKeys): boolean {
  return (
    a.ctrlKey !== b.ctrlKey ||
    a.shiftKey !== b.shiftKey ||
    a.altKey !== b.altKey ||
    a.metaKey !== b.metaKey
  );
}

/**
 * Build a synthetic `DragInput` for the keyboard sensor, which has no real pointer
 * event. `pointerType` is `null` (there is no pointer device); the keyboard
 * modality is carried by `DragMode` instead.
 *
 * `keys` are the modifier flags of the keydown that drove the move, so a keyboard drag
 * reports the same key state a pointer drag does. Omit them where no event is in hand.
 */
export function createSyntheticInput(
  reference: Element,
  clientX: number,
  clientY: number,
  keys: DragModifierKeys = NO_MODIFIER_KEYS,
): DragInput {
  const win = ownerWindow(reference);
  return {
    button: 0,
    buttons: 0,
    clientX,
    clientY,
    pageX: clientX + win.scrollX,
    pageY: clientY + win.scrollY,
    pointerType: null,
    ctrlKey: keys.ctrlKey,
    shiftKey: keys.shiftKey,
    altKey: keys.altKey,
    metaKey: keys.metaKey,
  };
}

/**
 * Run a consumer-supplied callback with an error boundary: a throw is caught,
 * logged with `message` and the offending element (when the boundary has one)
 * for diagnosis, and `fallback` is returned so one buggy consumer can't unwind
 * an engine dispatch or loop for everyone else.
 *
 * `message` states what threw and what the engine did instead — never that the
 * error follows, which the console already shows. Every one of these strings
 * ships in the production bundle, so they stay to the point.
 */
export function containConsumerError<T>(
  message: string,
  element: Element | null,
  call: () => T,
  fallback: T,
): T {
  try {
    return call();
  } catch (error) {
    if (element === null) {
      console.error(message, error);
    } else {
      console.error(message, element, error);
    }
    return fallback;
  }
}

/**
 * Run every cleanup, then rethrow the first error any of them raised. A plain
 * sequence would leak the remaining registrations the moment one throws — the
 * drop target would stay live after the draggable's cleanup failed.
 */
export function runAllCleanups(cleanups: ReadonlyArray<() => void>): void {
  let firstError: unknown;
  for (const cleanup of cleanups) {
    try {
      cleanup();
    } catch (error) {
      firstError ??= error;
    }
  }
  if (firstError !== undefined) {
    throw firstError;
  }
}

/**
 * {@link containConsumerError} for a named callback declared on a registered
 * element. One shared wording for every registry — drop targets, auto-scrollers —
 * so the diagnostic prose is written once instead of per module.
 */
export function safeCallConsumer<T>(
  subject: string,
  callbackName: string,
  element: Element,
  call: () => T,
  fallback: T,
): T {
  return containConsumerError(
    `Base UI: ${subject} "${callbackName}" threw and was skipped for this drag.`,
    element,
    call,
    fallback,
  );
}

/**
 * Whether `element` resolves to right-to-left direction. Uncached —
 * `getComputedStyle` forces style resolution, so hot paths (the auto-scroller's
 * frame loop, the collection's per-frame drop position) keep their own per-drag
 * or per-element caches around this single implementation.
 */
export function isRtlElement(element: Element): boolean {
  let current: Element | null = element;
  while (current) {
    const direction = ownerWindow(current).getComputedStyle(current).direction;
    if (direction === 'rtl') {
      return true;
    }
    if (direction === 'ltr') {
      return false;
    }
    // Some non-browser DOMs do not resolve inherited `direction`. Walking the
    // composed ancestry preserves the browser answer without guessing a value.
    current = getComposedParentElement(current);
  }
  return false;
}

/** Whether an element scrolls on each axis, and whether each axis is explicitly stopped. */
export interface OverflowFlags {
  x: boolean;
  y: boolean;
  /** `overflow` is `hidden`/`clip` on this axis, which is what stops the *page* scrolling. */
  blockedX: boolean;
  blockedY: boolean;
}

// Only these make a box scrollable. Notably *not* `hidden` or `clip`: `hidden`
// has a scrolling box the user deliberately can't reach, and `clip` has none at
// all, so `scrollBy` is a no-op on it. Both still report
// `scrollHeight > clientHeight`, so a scroll-extent test can't tell them apart —
// the overflow value is the only signal. (This is why `isOverflowElement` from
// floating-ui, which lumps all five together, can't answer this question.)
const SCROLLABLE_OVERFLOW = new Set(['auto', 'scroll', 'overlay']);
const BLOCKED_OVERFLOW = new Set(['hidden', 'clip']);

// The shorthand is consulted alongside each longhand rather than as a fallback:
// jsdom reports `visible` for the longhands even when a style set `overflow`
// alone, so a `||` chain would never reach it. A real browser's two-value
// shorthand serialization (`"hidden auto"`) matches neither set, leaving the
// longhands to decide.
function onAxis(values: Set<string>, longhand: string, shorthand: string): boolean {
  return values.has(longhand) || values.has(shorthand);
}

/**
 * Which axes `element` can scroll, resolved from its computed overflow. Uncached,
 * like {@link isRtlElement} — callers on hot paths keep their own per-drag cache.
 */
export function getOverflowFlags(element: Element): OverflowFlags {
  const { overflow, overflowX, overflowY, display } =
    ownerWindow(element).getComputedStyle(element);
  const blockedX = onAxis(BLOCKED_OVERFLOW, overflowX, overflow);
  const blockedY = onAxis(BLOCKED_OVERFLOW, overflowY, overflow);
  // An inline or `display: contents` box generates no scrolling box whatever its
  // overflow says (the same exclusion floating-ui's `isOverflowElement` makes).
  if (display === 'inline' || display === 'contents') {
    return { x: false, y: false, blockedX, blockedY };
  }
  return {
    x: onAxis(SCROLLABLE_OVERFLOW, overflowX, overflow),
    y: onAxis(SCROLLABLE_OVERFLOW, overflowY, overflow),
    blockedX,
    blockedY,
  };
}

/** Never report a scale that would divide badly downstream. */
function usableScale(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/**
 * The scale a CSS transform (or a `zoom`) applies to `element`, accumulated over the element
 * and every ancestor — a zoomable canvas, a scaled preview container.
 *
 * Read from the transforms themselves rather than from the rendered rect against the layout
 * box: that ratio is only a scale while everything in the chain is axis-aligned. A *rotated*
 * element's rect is its bounding box, several times its layout box, and the ratio reports
 * that inflation as a scale. Taking the column norms of the accumulated matrix leaves a
 * rotation at 1 and still reports the scale composed with it.
 *
 * Returns `1` on either axis it cannot read.
 */
export function getElementScale(element: HTMLElement): DragPosition {
  const win = ownerWindow(element);
  let matrix = identityLinearTransform;
  let zoom = 1;
  let node: Element | null = element;

  while (node) {
    const style = win.getComputedStyle(node);
    // CSS Transforms 2 splits `scale`/`rotate`/`translate` out of `transform`, and they do
    // not fold into the computed `transform` — so a `scale: 1.5` (the hover-lift pattern)
    // has to be read on its own. `rotate` too: a rotation cannot change a scale by itself,
    // but it reorients which axis an ancestor's scale lands on, so leaving it out of the
    // matrix would swap the axes under a non-uniform ancestor scale. Only `translate` can
    // be ignored. Order within an element is `rotate`, then `scale`, then `transform`.
    const own = parseComputedLinearTransform(style.transform);
    if (own) {
      matrix = multiplyLinearTransforms(own, matrix);
    }
    const scaleLonghand = parseScaleLinearTransform(style.scale);
    if (scaleLonghand) {
      matrix = multiplyLinearTransforms(scaleLonghand, matrix);
    }
    const rotateLonghand = parseRotateLinearTransform(style.rotate);
    if (rotateLonghand) {
      matrix = multiplyLinearTransforms(rotateLonghand, matrix);
    }
    // `zoom` never reaches the matrix — it is not a transform — but it is the other way a
    // surface is scaled, and it compounds down the tree the same way.
    const elementZoom = Number.parseFloat(style.zoom || (node as HTMLElement).style?.zoom || '');
    if (Number.isFinite(elementZoom) && elementZoom > 0) {
      zoom *= elementZoom;
    }
    node = getComposedParentElement(node);
  }

  // Column norms: how long each unit axis comes out. A mirror (`scale(-1)`) reports its
  // magnitude, which is the only part of it a step size can use.
  return {
    x: usableScale(Math.hypot(matrix.a, matrix.b) * zoom),
    y: usableScale(Math.hypot(matrix.c, matrix.d) * zoom),
  };
}
