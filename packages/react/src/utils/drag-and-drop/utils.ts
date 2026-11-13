import { fastObjectShallowCompare } from '@base-ui/utils/fastObjectShallowCompare';
import { ownerWindow } from '@base-ui/utils/owner';
import type { DraggableInput, DraggablePosition } from '../../draggable/DraggableProvider';
import { getComposedParentElement } from './composedTree';
import {
  getOwnLinearTransform,
  identityLinearTransform,
  multiplyLinearTransforms,
} from './linearTransform';

/**
 * Marks the element the engine positions: a `Draggable.Positioner`, or the copy it leaves
 * when its root unmounts mid-drag. Internal; the public styling hook is
 * `data-drag-preview`, on the `Draggable.Preview` inside it.
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

/**
 * The layout viewport rect in client coordinates. `innerWidth/innerHeight` include
 * the scrollbar gutter, where `elementFromPoint` finds nothing, so they're only the
 * fallback when layout reports 0, as in a detached document or jsdom.
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
 * Whether `element` resolves to right-to-left. It forces a style resolve, so per-frame
 * callers cache it.
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

// Check the shorthand alongside each longhand, not as a fallback, since jsdom reports
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

/** The product of `zoom` on the element and its ancestors. */
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
    // The top layer escapes its ancestors' transforms, but not their `zoom`.
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
