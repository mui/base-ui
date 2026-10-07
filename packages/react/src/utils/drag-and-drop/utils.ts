import { fastObjectShallowCompare } from '@base-ui/utils/fastObjectShallowCompare';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { isShadowRoot } from '@floating-ui/utils/dom';
import { contains } from '@base-ui/utils/shadowDom';
import type {
  DraggableInput,
  DraggablePointerType,
  DraggablePosition,
} from '../../draggable/DraggableProvider';
import { getParentElement } from '../getParentElement';
import { getElementAtPoint } from '../getElementAtPoint';
import {
  getOwnLinearTransform,
  identityLinearTransform,
  multiplyLinearTransforms,
} from './linearTransform';

/**
 * Marks the element the engine positions: `"clone"` for the clone of the source, or
 * `"content"` for the copy of a custom preview's content. The engine finds the
 * preview through it in either mode, including a preview still settling after its
 * drag. The same element carries the public `data-drag-preview`. The
 * `data-base-ui-` prefix means this one is internal, not a styling hook.
 */
export const PREVIEW_ELEMENT_ATTRIBUTE = 'data-base-ui-drag-preview';

/** The four modifier key flags, as the events that carry them report them. */
export type DragModifierKeys = Pick<DraggableInput, 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'>;

/**
 * Wrap a cleanup so that only the first call runs it, even if React already ran
 * it. Registrations and setups rely on this when they return cleanups to consumers.
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

/** `root` and all its descendant elements, in tree order. */
export function getSubtreeElements(root: Element): Element[] {
  return [root, ...Array.from(root.querySelectorAll('*'))];
}

/** The value `map` holds for `key`, created with `create` and stored on first access. */
export function getOrCreate<K, V>(
  map: { get(key: K): V | undefined; set(key: K, value: V): unknown },
  key: K,
  create: (key: K) => V,
): V {
  let value = map.get(key);
  if (value === undefined) {
    value = create(key);
    map.set(key, value);
  }
  return value;
}

/**
 * A shallow copy of `value`, stored in `cache` under `key` and replaced only when a
 * field changes. A getter that mutates and returns one object can't change the copy.
 */
export function getShallowSnapshot<K extends object, V extends object>(
  cache: WeakMap<K, V>,
  key: K,
  value: V,
): V {
  let snapshot = cache.get(key);
  if (snapshot === undefined || !fastObjectShallowCompare(value, snapshot)) {
    snapshot = { ...value };
    cache.set(key, snapshot);
  }
  return snapshot;
}

/**
 * Resolve an element given as a plain element, a ref, or a getter, or return
 * `null` when unset. `handle`, `container`, and the `element` of
 * `restrictToElement` use this shape. `argument` is passed to the getter.
 * `container` passes the source element so a callback can find a container
 * relative to it.
 */
export function resolveElementReference<T extends Element, TArgument = void>(
  reference:
    T | { current: T | null } | ((argument: TArgument) => T | null | undefined) | undefined,
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

const NO_CLOSED_ROOTS: ReadonlyMap<Element, ShadowRoot> = new Map();

/**
 * The parent of `element` in the composed tree: its assigned slot, then its
 * parent, then the host of its shadow root.
 *
 * `assignedSlot` is `null` for an element slotted into a closed shadow root, so a
 * plain walk would jump from the element straight to its host and skip whatever
 * wraps the `<slot>`. `closedRootsByHost` supplies the closed roots the engine
 * knows about, such as those holding a registered drop target, and the slot is
 * looked up in the host's root instead.
 */
export function getComposedParentElement(
  element: Element,
  closedRootsByHost: ReadonlyMap<Element, ShadowRoot> = NO_CLOSED_ROOTS,
): Element | null {
  if (closedRootsByHost.size > 0 && element.assignedSlot === null) {
    const host = element.parentElement;
    const root = host === null ? undefined : closedRootsByHost.get(host);
    if (root !== undefined) {
      for (const slot of root.querySelectorAll('slot')) {
        if (slot.assignedElements().includes(element)) {
          return slot;
        }
      }
    }
  }
  return getParentElement(element);
}

/** The event root that can observe a node before closed-shadow retargeting. */
export function getDragEventRoot(node: Element): Document | ShadowRoot {
  const root = node.getRootNode();
  return isShadowRoot(root) ? root : ownerDocument(node);
}

/**
 * Hit-test the element under (`clientX`, `clientY`), descending into shadow roots.
 * `elementFromPoint` on the document stops at the shadow host, so a drop target
 * inside a shadow tree would never be entered. `rootsByHost` supplies registered
 * closed roots, which their host doesn't expose through `Element.shadowRoot`.
 *
 * Both levels go through {@link getElementAtPoint} because jsdom implements
 * `elementFromPoint` on neither `Document` nor `ShadowRoot`. This runs from the
 * activation commit, outside every containment boundary and after the pending
 * listeners are removed. A `TypeError` here would leave the sensor stuck and
 * refuse every later pickup, so a missing method reports nothing under the pointer.
 * A non-finite coordinate, which browsers reject with a `TypeError`, reports
 * nothing for the same reason.
 */
export function deepElementFromPoint(
  doc: Document,
  clientX: number,
  clientY: number,
  rootsByHost: ReadonlyMap<Element, ShadowRoot>,
): Element | null {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return null;
  }
  let hit = getElementAtPoint(doc, clientX, clientY);
  let innerRoot = hit ? (hit.shadowRoot ?? rootsByHost.get(hit)) : undefined;
  while (innerRoot) {
    const inner = getElementAtPoint(innerRoot, clientX, clientY);
    if (!inner || inner === hit) {
      break;
    }
    hit = inner;
    innerRoot = hit.shadowRoot ?? rootsByHost.get(hit);
  }
  return hit;
}

/**
 * Hit-test the element under (`clientX`, `clientY`) in `doc`, ignoring the drag
 * preview and descending into shadow roots like {@link deepElementFromPoint}.
 * The preview has `pointer-events: none`, so `elementFromPoint` normally skips it.
 * Consumer preview content can set `pointer-events: auto` and catch the hit, which
 * would pin drop-target resolution to the preview. When the hit lands inside the
 * preview, hide it synchronously and hit-test again. No repaint happens in between,
 * so nothing flickers.
 */
export function elementFromPointIgnoring(
  doc: Document,
  clientX: number,
  clientY: number,
  ignore: HTMLElement | null,
  rootsByHost: ReadonlyMap<Element, ShadowRoot>,
): Element | null {
  const found = deepElementFromPoint(doc, clientX, clientY, rootsByHost);
  if (!found || ignore == null || !contains(ignore, found)) {
    return found;
  }
  // Use `display: none`, not `visibility: hidden`. A descendant with inline
  // `visibility: visible` would stay hit-testable. `display: none` removes the
  // whole subtree from hit-testing. `ignore` is the preview itself, never the
  // engine's `[popover]` wrapper around it, so hiding it doesn't close the
  // popover that keeps the preview in the top layer.
  const previousDisplay = ignore.style.display;
  ignore.style.display = 'none';
  const behind = deepElementFromPoint(doc, clientX, clientY, rootsByHost);
  ignore.style.display = previousDisplay;
  return behind;
}

/**
 * Whether a document's browsing context is gone, because its iframe was removed
 * or its popout window closed. A drag session in such a document never receives
 * an ending event, since its teardown listeners lived in the dead realm. The
 * sensors use this check to reset instead of refusing every later pickup. It
 * doesn't test whether the element is connected, because a virtualizer can
 * detach the dragged node mid-drag while its document is still alive.
 */
export function isDetachedDocument(doc: Document): boolean {
  const win = doc.defaultView;
  return win === null || win.closed === true;
}

/**
 * The layout viewport rect in client coordinates. Prefers
 * `documentElement.clientWidth/Height` over `innerWidth/innerHeight`, which include
 * the scrollbar gutter where `elementFromPoint` finds nothing. Falls back to the
 * window size when layout reports 0, as in a detached document or jsdom.
 */
export function getViewportRect(win: Window) {
  const docEl = win.document.documentElement;
  const width = docEl.clientWidth || win.innerWidth;
  const height = docEl.clientHeight || win.innerHeight;
  return { left: 0, top: 0, right: width, bottom: height, width, height };
}

/**
 * Whether the client point (`x`, `y`) lies within `rect`, inclusive of all four
 * edges.
 */
export function isPointInRect(
  x: number,
  y: number,
  rect: { left: number; top: number; right: number; bottom: number },
): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export function normalizePointerType(raw: string | undefined): DraggablePointerType {
  if (raw === 'touch' || raw === 'pen') {
    return raw;
  }
  return 'mouse';
}

/** Build a `DraggableInput` snapshot from a pointer event. */
export function getInput(event: MouseEvent & { pointerType?: string | undefined }): DraggableInput {
  return {
    button: event.button,
    buttons: event.buttons,
    clientX: event.clientX,
    clientY: event.clientY,
    pageX: event.pageX,
    pageY: event.pageY,
    pointerType: normalizePointerType(event.pointerType),
    ...getModifierKeys(event),
  };
}

/**
 * Rebase a `DraggableInput` onto `point`, shifting the page coordinates by the same
 * delta. The sensor applies `modifiers` through it, so the drop hit-test and the
 * reported input follow the constrained point rather than the raw pointer.
 */
export function remapInput(input: DraggableInput, point: DraggablePosition): DraggableInput {
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

/** No modifier key held. Used for inputs synthesized without an event. */
export const NO_MODIFIER_KEYS: DragModifierKeys = {
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
};

/** The four modifier flags of an event, to copy onto a synthesized input. */
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
 * Run a consumer callback and catch what it throws. The error is logged with
 * `message` and the element, when there is one, and `fallback` is returned. One
 * failing callback can't abort an engine dispatch or loop for every other consumer.
 *
 * `message` says what threw and what the engine did instead. It doesn't announce
 * the error, which the console prints next to it. These strings ship in the
 * production bundle, so keep them short. Pass a function to build the message
 * only when something throws.
 */
export function containConsumerError<T>(
  message: string | (() => string),
  element: Element | null,
  call: () => T,
  fallback: T,
): T {
  try {
    return call();
  } catch (error) {
    const text = typeof message === 'function' ? message() : message;
    if (element === null) {
      console.error(text, error);
    } else {
      console.error(text, element, error);
    }
    return fallback;
  }
}

/**
 * Run every cleanup, then rethrow the first error. A plain sequence would stop at
 * the first throw and leak the remaining registrations, for example leaving a
 * drop target live after the draggable's cleanup failed.
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
 * element. Drop targets and auto-scrollers share this message instead of each
 * writing their own.
 *
 * It runs for each target and auto-scroll candidate on every frame, so the
 * message is built only when something throws.
 */
export function safeCallConsumer<T>(
  subject: string,
  callbackName: string,
  element: Element,
  call: () => T,
  fallback: T,
): T {
  return containConsumerError(
    () => `Base UI: ${subject} "${callbackName}" threw and was skipped for this drag.`,
    element,
    call,
    fallback,
  );
}

/**
 * Whether `element` resolves to right-to-left direction. `getComputedStyle`
 * forces style resolution, so the auto-scroller caches the result per element.
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
    // Some non-browser DOMs don't resolve inherited `direction`. Walking up the
    // composed ancestors gives the browser's answer without guessing a value.
    current = getComposedParentElement(current);
  }
  return false;
}

/** Whether an element scrolls on each axis, and whether each axis is explicitly stopped. */
export interface OverflowFlags {
  x: boolean;
  y: boolean;
  /**
   * `overflow` is `hidden` or `clip` on this axis. On the root or body, this stops
   * the page from scrolling.
   */
  blockedX: boolean;
  blockedY: boolean;
}

// Only these values make a box scrollable. `hidden` has a scrolling box the user
// can't reach, and `clip` has none, so `scrollBy` does nothing on it. Both still
// report `scrollHeight > clientHeight`, so only the overflow value tells them
// apart. floating-ui's `isOverflowElement` treats all five values alike, so it
// can't be used here.
const SCROLLABLE_OVERFLOW = new Set(['auto', 'scroll', 'overlay']);
const BLOCKED_OVERFLOW = new Set(['hidden', 'clip']);

// Check the shorthand alongside each longhand, not as a fallback. jsdom reports
// `visible` for the longhands when a style sets only `overflow`, so a `||` chain
// would never reach the shorthand. In a browser, a two-value shorthand such as
// `"hidden auto"` matches neither set, so the longhands decide.
function onAxis(values: Set<string>, longhand: string, shorthand: string): boolean {
  return values.has(longhand) || values.has(shorthand);
}

/**
 * Which axes `element` can scroll, from its computed overflow. Not cached, like
 * {@link isRtlElement}. Callers on hot paths keep their own per-drag cache.
 */
export function getOverflowFlags(element: Element): OverflowFlags {
  const { overflow, overflowX, overflowY, display } =
    ownerWindow(element).getComputedStyle(element);
  const blockedX = onAxis(BLOCKED_OVERFLOW, overflowX, overflow);
  const blockedY = onAxis(BLOCKED_OVERFLOW, overflowY, overflow);
  // An inline or `display: contents` box has no scrolling box, whatever its
  // overflow. floating-ui's `isOverflowElement` makes the same exclusion.
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

/** Replace a zero, negative, or non-finite scale with `1`, so callers can divide by it. */
function usableScale(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/**
 * The element's own `zoom`, or `1` when it has none. Falls back to the inline
 * declaration for engines whose computed style does not expose `zoom`.
 */
export function getOwnZoom(node: Element, style: CSSStyleDeclaration): number {
  return usableScale(Number.parseFloat(style.zoom || (node as HTMLElement).style?.zoom || ''));
}

/**
 * The product of `zoom` on the element and its ancestors. Zoom still compounds
 * when a preview enters the top layer.
 */
export function getElementZoom(element: HTMLElement): number {
  const win = ownerWindow(element);
  let zoom = 1;
  for (let node: Element | null = element; node; node = getComposedParentElement(node)) {
    zoom *= getOwnZoom(node, win.getComputedStyle(node));
  }
  return zoom;
}

// Set once `:popover-open` has failed to parse. Browsers that predate the popover
// API throw a `SyntaxError` on the selector, and a `popover` attribute does
// nothing there, so no element can be an open popover.
let popoverOpenUnsupported = false;

/** Whether `node` is a shown popover, which renders in the top layer. */
function isOpenPopover(node: Element): boolean {
  if (popoverOpenUnsupported || !node.hasAttribute('popover')) {
    return false;
  }
  try {
    return node.matches(':popover-open');
  } catch {
    popoverOpenUnsupported = true;
    return false;
  }
}

/**
 * The scale that CSS transforms and `zoom` apply to `element`, accumulated over the
 * element and its ancestors, such as a zoomable canvas or a scaled preview container.
 *
 * It reads the transforms instead of comparing the rendered rect to the layout box.
 * That ratio is a scale only while everything in the chain is axis-aligned. A rotated
 * element's rect is its bounding box, which is larger than its layout box, and the
 * ratio would report the difference as a scale. The column norms of the accumulated
 * matrix ignore rotation and still include any scale combined with it.
 *
 * Returns `1` on either axis it cannot read.
 */
export function getElementScale(element: HTMLElement): DraggablePosition {
  const win = ownerWindow(element);
  let matrix = identityLinearTransform;
  let zoom = 1;
  let node: Element | null = element;
  let escapedTransforms = false;

  while (node) {
    const style = win.getComputedStyle(node);
    // The `scale`, `rotate`, and `translate` properties don't fold into the computed
    // `transform`, so a `scale: 1.5` hover lift has to be read on its own. `rotate`
    // doesn't change a scale by itself, but it changes which axis an ancestor's scale
    // lands on. Leaving it out would swap the axes under a non-uniform ancestor scale.
    // Only `translate` can be ignored.
    if (!escapedTransforms) {
      matrix = multiplyLinearTransforms(getOwnLinearTransform(style), matrix);
    }
    // `zoom` is not a transform, so it stays out of the matrix. It compounds down the
    // tree the same way, so it is multiplied in separately.
    zoom *= getOwnZoom(node, style);
    if (isOpenPopover(node)) {
      escapedTransforms = true;
    }
    node = getComposedParentElement(node);
  }

  // The column norms give the length each unit axis maps to. A mirror such as
  // `scale(-1)` reports its magnitude, the only part a step size can use.
  return {
    x: usableScale(Math.hypot(matrix.a, matrix.b) * zoom),
    y: usableScale(Math.hypot(matrix.c, matrix.d) * zoom),
  };
}

/** Add `sheet` to `root`'s adopted style sheets unless it is already there. */
export function adoptStyleSheet(root: DocumentOrShadowRoot, sheet: CSSStyleSheet): void {
  if (!root.adoptedStyleSheets.includes(sheet)) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  }
}

/** Remove `sheet` from `root`'s adopted style sheets. */
export function unadoptStyleSheet(root: DocumentOrShadowRoot, sheet: CSSStyleSheet): void {
  if (root.adoptedStyleSheets.includes(sheet)) {
    root.adoptedStyleSheets = root.adoptedStyleSheets.filter((adopted) => adopted !== sheet);
  }
}
