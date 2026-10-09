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
 * Marks the element the engine positions: `"clone"` for the source's clone, `"content"`
 * for the copy of a custom preview's content. The engine finds the preview through it,
 * even while it settles after the drag. Internal; the public styling hook on the same
 * element is `data-drag-preview`.
 */
export const PREVIEW_ELEMENT_ATTRIBUTE = 'data-base-ui-drag-preview';

export type DragModifierKeys = Pick<DraggableInput, 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'>;

/**
 * Wrap a cleanup so only the first call runs it. Cleanups returned to consumers can
 * be called again after React already ran them.
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
 * Resolve an element given as an element, a ref, or a getter called with `argument`,
 * as `handle`, `container`, and `restrictToElement` accept. `null` when unset.
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
 * The parent of `element` in the composed tree: its assigned slot, then its parent, then
 * its shadow host. `assignedSlot` is `null` for a slot in a closed shadow root, which would
 * skip whatever wraps the `<slot>`, so the slot is looked up in `closedRootsByHost` instead.
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
 * Hit-tests the point, descending into shadow roots since `elementFromPoint` stops at the
 * host. `rootsByHost` supplies the registered closed roots, which `Element.shadowRoot`
 * hides. Never throws: it runs from the activation commit, outside any containment, where
 * a `TypeError` would leave the sensor refusing every later pickup.
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
 * {@link deepElementFromPoint}, skipping the drag preview. Consumer preview content
 * can set `pointer-events: auto` and would then pin drop-target resolution to the
 * preview. On such a hit, hide the preview synchronously and hit-test again. No
 * repaint happens in between, so nothing flickers.
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
  // Not `visibility: hidden`: a descendant with `visibility: visible` would stay
  // hit-testable. `ignore` is the preview, never the engine's `[popover]` wrapper,
  // so this doesn't close the popover that keeps it in the top layer.
  const previousDisplay = ignore.style.display;
  ignore.style.display = 'none';
  const behind = deepElementFromPoint(doc, clientX, clientY, rootsByHost);
  ignore.style.display = previousDisplay;
  return behind;
}

/**
 * Whether a document's browsing context is gone (iframe removed, popout closed). A
 * drag there never gets an ending event, since its listeners lived in the dead
 * realm, so the sensors reset instead of refusing every later pickup. Connection
 * isn't checked: a virtualizer can detach the dragged node while its document lives.
 */
export function isDetachedDocument(doc: Document): boolean {
  const win = doc.defaultView;
  return win === null || win.closed === true;
}

/**
 * The layout viewport rect in client coordinates. `innerWidth/innerHeight` include
 * the scrollbar gutter, where `elementFromPoint` finds nothing, so they're only the
 * fallback when layout reports 0 (detached document, jsdom).
 */
export function getViewportRect(win: Window) {
  const docEl = win.document.documentElement;
  const width = docEl.clientWidth || win.innerWidth;
  const height = docEl.clientHeight || win.innerHeight;
  return { left: 0, top: 0, right: width, bottom: height, width, height };
}

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
 * Move a `DraggableInput` to `point`, shifting the page coordinates by the same delta.
 * The sensor applies `modifiers` through it, so the drop hit-test and the reported
 * input follow the constrained point, not the raw pointer.
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

/** For inputs synthesized without an event. */
export const NO_MODIFIER_KEYS: DragModifierKeys = {
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
};

export function getModifierKeys(event: KeyboardEvent | MouseEvent): DragModifierKeys {
  return {
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
  };
}

/** Lets a key press that changes no modifier be ignored. */
export function modifierKeysChanged(a: DragModifierKeys, b: DragModifierKeys): boolean {
  return (
    a.ctrlKey !== b.ctrlKey ||
    a.shiftKey !== b.shiftKey ||
    a.altKey !== b.altKey ||
    a.metaKey !== b.metaKey
  );
}

/**
 * Runs a consumer callback and, if it throws, logs the error with `message` and `element`
 * and returns `fallback`, so one failing callback can't abort a dispatch or loop for every
 * other consumer. `message` ships to production, so keep it to what threw and what the
 * engine did instead. Pass a function to build it only on error.
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
 * Run every cleanup, then rethrow the first error. A plain sequence would stop at the
 * first throw and leak the rest, such as a drop target left live after a draggable's
 * cleanup failed.
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
 * {@link containConsumerError} with a shared message for a named callback on a
 * registered element. It runs for every target and auto-scroll candidate each frame,
 * so the message is built only on error.
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
 * Whether `element` resolves to right-to-left. `getComputedStyle` forces style
 * resolution, so the auto-scroller caches the result per element.
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
    // Some non-browser DOMs don't resolve inherited `direction`, so walk up.
    current = getComposedParentElement(current);
  }
  return false;
}

export interface OverflowFlags {
  x: boolean;
  y: boolean;
  /** `overflow` is `hidden` or `clip` on this axis. On the root or body, the page can't scroll. */
  blockedX: boolean;
  blockedY: boolean;
}

// `hidden` has a scrolling box the user can't reach and `clip` has none, yet both
// report `scrollHeight > clientHeight`, so only the overflow value tells them apart.
// floating-ui's `isOverflowElement` treats all five values alike.
const SCROLLABLE_OVERFLOW = new Set(['auto', 'scroll', 'overlay']);
const BLOCKED_OVERFLOW = new Set(['hidden', 'clip']);

// Check the shorthand alongside each longhand, not as a fallback: jsdom reports
// `visible` for the longhands when only `overflow` is set. In a browser, a two-value
// shorthand such as `"hidden auto"` matches neither set, so the longhands decide.
function onAxis(values: Set<string>, longhand: string, shorthand: string): boolean {
  return values.has(longhand) || values.has(shorthand);
}

/** Which axes `element` can scroll. Uncached; hot-path callers keep a per-drag cache. */
export function getOverflowFlags(element: Element): OverflowFlags {
  const { overflow, overflowX, overflowY, display } =
    ownerWindow(element).getComputedStyle(element);
  const blockedX = onAxis(BLOCKED_OVERFLOW, overflowX, overflow);
  const blockedY = onAxis(BLOCKED_OVERFLOW, overflowY, overflow);
  // An inline or `display: contents` box never has a scrolling box.
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

/** Maps a zero, negative, or non-finite scale to `1`, so callers can divide by it. */
function usableScale(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/** The element's own `zoom`, or `1`. Reads the inline value where computed style lacks it. */
export function getOwnZoom(node: Element, style: CSSStyleDeclaration): number {
  return usableScale(Number.parseFloat(style.zoom || (node as HTMLElement).style?.zoom || ''));
}

/**
 * The product of `zoom` on the element and its ancestors. Unlike transforms, zoom
 * still compounds when a preview enters the top layer.
 */
export function getElementZoom(element: HTMLElement): number {
  const win = ownerWindow(element);
  let zoom = 1;
  for (let node: Element | null = element; node; node = getComposedParentElement(node)) {
    zoom *= getOwnZoom(node, win.getComputedStyle(node));
  }
  return zoom;
}

// Browsers without the popover API throw a `SyntaxError` on `:popover-open`, and no
// element can be an open popover there.
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
 * The scale that CSS transforms and `zoom` apply to `element` through its ancestors, such
 * as a zoomable canvas, or `1` on an axis it can't read. It uses the accumulated matrix's
 * column norms, which ignore rotation, because comparing the rendered rect to the layout
 * box would misread a rotated bounding box as scale.
 */
export function getElementScale(element: HTMLElement): DraggablePosition {
  const win = ownerWindow(element);
  let matrix = identityLinearTransform;
  let zoom = 1;
  let node: Element | null = element;
  let escapedTransforms = false;

  while (node) {
    const style = win.getComputedStyle(node);
    // The `scale` and `rotate` properties don't fold into the computed `transform`, so
    // they're read separately. `rotate` decides which axis a non-uniform ancestor
    // scale lands on; only `translate` can be ignored.
    if (!escapedTransforms) {
      matrix = multiplyLinearTransforms(getOwnLinearTransform(style), matrix);
    }
    // `zoom` isn't a transform, so it compounds outside the matrix.
    zoom *= getOwnZoom(node, style);
    if (isOpenPopover(node)) {
      escapedTransforms = true;
    }
    node = getComposedParentElement(node);
  }

  // Column norms give the length each unit axis maps to; a mirror such as
  // `scale(-1)` reports its magnitude.
  return {
    x: usableScale(Math.hypot(matrix.a, matrix.b) * zoom),
    y: usableScale(Math.hypot(matrix.c, matrix.d) * zoom),
  };
}

export function adoptStyleSheet(root: DocumentOrShadowRoot, sheet: CSSStyleSheet): void {
  if (!root.adoptedStyleSheets.includes(sheet)) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  }
}

export function unadoptStyleSheet(root: DocumentOrShadowRoot, sheet: CSSStyleSheet): void {
  if (root.adoptedStyleSheets.includes(sheet)) {
    root.adoptedStyleSheets = root.adoptedStyleSheets.filter((adopted) => adopted !== sheet);
  }
}

/** `buttons` is a bitmask, and bit 0 is the primary button. */
export function isPrimaryHeld(event: PointerEvent): boolean {
  return event.buttons % 2 !== 0;
}

/** Installed only while a gesture is alive (see `onPointerDown` and `startDrag`). */
export function preventContextMenu(event: Event): void {
  event.preventDefault();
}

/**
 * Block the native HTML5 drag that a nested `<img>` or `<a href>` starts from the same
 * press. `draggable="false"` on the source doesn't cover its descendants.
 */
export function preventNativeDragStart(event: Event): void {
  event.preventDefault();
}

/**
 * Run a pointer capture operation, swallowing the `DOMException` it throws when the
 * pointer is no longer active or capture was already released. Checked against the
 * element's realm, since an iframe or popout has its own `DOMException`.
 */
export function swallowPointerCaptureError(element: Element, operation: () => void): void {
  try {
    operation();
  } catch (err) {
    if (!(err instanceof ownerWindow(element).DOMException)) {
      throw err;
    }
  }
}

export function releasePointerCaptureSafely(element: Element, pointerId: number): void {
  swallowPointerCaptureError(element, () => {
    if (element.hasPointerCapture?.(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  });
}

export function setPointerCaptureSafely(element: Element, pointerId: number): void {
  // Optional-chained so jsdom (no pointer capture) no-ops instead of throwing.
  swallowPointerCaptureError(element, () => element.setPointerCapture?.(pointerId));
}
