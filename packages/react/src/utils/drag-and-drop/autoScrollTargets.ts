import { clamp } from '@base-ui/utils/clamp';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import type { DraggableInput } from '../../draggable/DraggableProvider';
import type { DraggableViewportOverflowMargin } from '../../draggable/viewport/DraggableViewport';
import type { ViewportParameters } from './autoScroller';
import { getSharedSlot } from './sharedState';
import {
  getOrCreate,
  getOverflowFlags,
  getViewportRect,
  isPointInRect,
  isRtlElement,
  remapInput,
} from './utils';
import type { OverflowFlags } from './utils';
import { getMaxScrollOffset } from '../scrollEdges';

const EDGE_THRESHOLD = 0.25;
const MAX_EDGE_SIZE = 180;

export const AXES = ['x', 'y'] as const;
export type Axis = (typeof AXES)[number];
export type AxisFlags = Record<Axis, boolean>;

type EdgeRect = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left'>;
type ScrollRect = EdgeRect & Pick<DOMRect, 'width' | 'height'>;

/**
 * A registered viewport resolved for one frame. A regular element and the page have
 * the same shape, so the auto-scroll arbitration reads both the same way.
 */
export interface ScrollTarget {
  /** The registered element, which the callbacks receive. */
  element: HTMLElement;
  getParameters: () => ViewportParameters<any, any>;
  registration: ViewportParameters;
  adapter: ScrollAdapter;
  /** The element `scrollBy` moves: `element`, or the page's scrolling element. */
  scroller: HTMLElement;
  /** The rect the edge zones are measured in. */
  rect: ScrollRect;
  /** `rect` plus `overflowMargin` while the drag may scroll from the margin. */
  overflowRect: EdgeRect;
  /** The point that picks the pass and is hit-tested, or `null` outside `overflowRect`. */
  probe: DraggableInput | null;
  /** The point the edge zones test and the callbacks receive, `null` with `probe`. */
  input: DraggableInput | null;
}

/** How one kind of target scrolls natively: a regular element, or the page. */
interface ScrollAdapter {
  /** Which axes scroll natively. */
  getOverflow(element: HTMLElement): AxisFlags;
  /** Whether offsets on `axis` run from -max to 0, as in RTL or a reversed flex flow. */
  hasNegativeOrigin(scroller: HTMLElement, axis: Axis): boolean;
}

/** Flow properties that place the scroll origin. */
interface ScrollFlow {
  negativeOrigin: AxisFlags;
  reversedAxis: Axis | null;
}

// `getComputedStyle` costs a style resolve per read, so overflow and flow are cached
// per drag. Shared, since the loop can run any bundle copy's code.
const styles = getSharedSlot('autoScrollStyles', () => ({
  overflow: new WeakMap<HTMLElement, OverflowFlags>(),
  flow: new WeakMap<HTMLElement, ScrollFlow>(),
}));

/** The caches are `WeakMap`s, which have no `clear()`, so they are replaced. */
export function resetStyleCaches(): void {
  styles.overflow = new WeakMap();
  styles.flow = new WeakMap();
}

export function forgetStyles(element: HTMLElement): void {
  styles.overflow.delete(element);
  styles.flow.delete(element);
}

function readOverflowFlags(element: HTMLElement): OverflowFlags {
  return getOrCreate(styles.overflow, element, getOverflowFlags);
}

function readScrollFlow(element: HTMLElement): ScrollFlow {
  return getOrCreate(styles.flow, element, getScrollFlow);
}

function getScrollFlow(element: HTMLElement): ScrollFlow {
  const style = ownerWindow(element).getComputedStyle(element);
  const rtl = style.direction ? style.direction === 'rtl' : isRtlElement(element);
  const vertical = /^(vertical|sideways)-/.test(style.writingMode);
  const flex = style.display === 'flex' || style.display === 'inline-flex';
  let reversedAxis: Axis | null = null;
  if (flex) {
    if (style.flexDirection === 'row-reverse') {
      reversedAxis = vertical ? 'y' : 'x';
    } else if (style.flexDirection === 'column-reverse') {
      reversedAxis = vertical ? 'x' : 'y';
    }
  }
  return {
    negativeOrigin: {
      x: vertical ? style.writingMode.endsWith('-rl') : rtl,
      y: vertical && (style.writingMode === 'sideways-lr' ? !rtl : rtl),
    },
    reversedAxis,
  };
}

/**
 * Whether `<body>`'s overflow propagates to the viewport. Per CSS Overflow, it
 * does only while `<html>`'s computed overflow is `visible` on both axes.
 * `useScrollLock`'s `getViewportScroller` uses the same check.
 */
function bodyPropagatesToViewport(doc: Document): boolean {
  const root = readOverflowFlags(doc.documentElement);
  return !root.x && !root.y && !root.blockedX && !root.blockedY;
}

const ELEMENT_SCROLLER: ScrollAdapter = {
  getOverflow: readOverflowFlags,
  hasNegativeOrigin(scroller, axis) {
    const flow = readScrollFlow(scroller);
    return flow.negativeOrigin[axis] !== (flow.reversedAxis === axis);
  },
};

export const PAGE_SCROLLER: ScrollAdapter = {
  // The viewport scrolls by default, so this asks which axes are blocked. `<body>`
  // counts while its overflow propagates, so a scroll lock on `body` holds during a drag.
  getOverflow(element) {
    const doc = ownerDocument(element);
    const root = readOverflowFlags(doc.documentElement);
    const body =
      doc.body !== null && bodyPropagatesToViewport(doc) ? readOverflowFlags(doc.body) : null;
    return {
      x: !root.blockedX && !body?.blockedX,
      y: !root.blockedY && !body?.blockedY,
    };
  },
  // `direction` propagates from `<body>` to the viewport, so a `<body dir="rtl">` page
  // scrolls RTL while `<html>` computes `ltr`. A flex flow doesn't move its origin.
  hasNegativeOrigin: (scroller, axis) =>
    readScrollFlow(ownerDocument(scroller).body ?? scroller).negativeOrigin[axis],
};

/**
 * Returns the element that scrolls the viewport (`scrollingElement`, or `documentElement`
 * in jsdom) when `element` is the page root, or `null` for a regular container. `body`
 * maps to it too while its overflow propagates to the viewport, because `body.scrollBy`
 * then moves nothing.
 */
function resolvePageScroller(element: HTMLElement): HTMLElement | null {
  const doc = ownerDocument(element);
  const scrollingElement = (doc.scrollingElement ?? doc.documentElement) as HTMLElement | null;
  if (scrollingElement === null) {
    return null;
  }
  if (
    element === scrollingElement ||
    element === doc.documentElement ||
    (element === doc.body && bodyPropagatesToViewport(doc))
  ) {
    return scrollingElement;
  }
  return null;
}

/**
 * Resolves a registration into this frame's target, without its probe (see
 * `resolveProbes`). An element's `overflowMargin` applies once the drag has entered
 * its rect, until the drag leaves the margin; `eligible` keeps that entry across frames.
 */
export function resolveScrollTarget(
  element: HTMLElement,
  getParameters: ScrollTarget['getParameters'],
  registration: ViewportParameters,
  raw: DraggableInput,
  reported: DraggableInput | null,
  eligible: Set<HTMLElement>,
): ScrollTarget {
  const pageScroller = resolvePageScroller(element);
  // `getViewportRect` excludes scrollbars, so the page's edge zones match the edges
  // `restrictToWindowEdges` uses.
  const rect = pageScroller
    ? getViewportRect(ownerWindow(element))
    : element.getBoundingClientRect();
  let overflowRect: EdgeRect = rect;
  // The page ignores `overflowMargin`: its probe is the pointer clamped into the viewport.
  if (pageScroller === null) {
    const marginRect = expandScrollRect(rect, registration.overflowMargin);
    if (resolveProbePoint(raw, reported, rect, false) !== null) {
      eligible.add(element);
    } else if (resolveProbePoint(raw, reported, marginRect, false) === null) {
      eligible.delete(element);
    }
    if (eligible.has(element)) {
      overflowRect = marginRect;
    }
  }
  return {
    element,
    getParameters,
    registration,
    adapter: pageScroller ? PAGE_SCROLLER : ELEMENT_SCROLLER,
    scroller: pageScroller ?? element,
    rect,
    overflowRect,
    probe: null,
    input: null,
  };
}

/**
 * Sets each target's `probe` and `input`. The reported point is preferred when it
 * differs from the physical pointer and some element's `overflowRect` holds it (see
 * `resolveProbePoint`).
 */
export function resolveProbes(
  targets: ReadonlyArray<ScrollTarget>,
  raw: DraggableInput,
  reported: DraggableInput | null,
): void {
  const preferReported =
    reported !== null &&
    (reported.clientX !== raw.clientX || reported.clientY !== raw.clientY) &&
    targets.some(
      (target) =>
        target.adapter !== PAGE_SCROLLER &&
        isPointInRect(reported.clientX, reported.clientY, target.overflowRect),
    );
  for (const target of targets) {
    const { rect } = target;
    if (target.adapter === PAGE_SCROLLER) {
      // Past an edge, the clamped pointer engages at full depth.
      target.probe = remapInput(raw, {
        x: clamp(raw.clientX, rect.left, rect.right),
        y: clamp(raw.clientY, rect.top, rect.bottom),
      });
      target.input = target.probe;
      continue;
    }
    const probe = resolveProbePoint(raw, reported, target.overflowRect, preferReported);
    target.probe = probe;
    // A reported probe stands in for a raw pointer outside the container, as when
    // `restrictToElement` clamps the preview. It stops short of the far edge by the
    // preview's size, so it can miss the edge zone exactly when the user pushes past.
    // On an axis the raw pointer left, the raw pointer is tested instead.
    target.input =
      probe === null || probe === raw
        ? probe
        : remapInput(probe, {
            x: raw.clientX < rect.left || raw.clientX > rect.right ? raw.clientX : probe.clientX,
            y: raw.clientY < rect.top || raw.clientY > rect.bottom ? raw.clientY : probe.clientY,
          });
  }
}

/**
 * Returns the point to test `rect`'s edge zones against, or `null` when neither is inside.
 * The physical pointer wins, since an axis lock pins the reported point away from the edge
 * being pushed. The reported point is the fallback for clamps like `restrictToElement`,
 * which the pointer escapes. `preferReported` (some container holds the reported point)
 * rejects raw-only candidates, so a pointer pushing out of clamped list A into list B can't
 * take the axis from A.
 */
function resolveProbePoint(
  raw: DraggableInput,
  reported: DraggableInput | null,
  rect: EdgeRect,
  preferReported: boolean,
): DraggableInput | null {
  const reportedInside =
    reported !== null && isPointInRect(reported.clientX, reported.clientY, rect);
  if (preferReported && !reportedInside) {
    return null;
  }
  if (isPointInRect(raw.clientX, raw.clientY, rect)) {
    return raw;
  }
  return reportedInside ? reported : null;
}

export function isProbeInRect(target: ScrollTarget): boolean {
  const { probe, rect } = target;
  return probe !== null && isPointInRect(probe.clientX, probe.clientY, rect);
}

/**
 * Whether `target` has room left to scroll on `axis`, toward the top or left for a
 * negative `sign`. `Math.ceil`/`Math.floor` guard against Chrome 115+ fractional
 * scroll units.
 */
export function canScrollToward(target: ScrollTarget, axis: Axis, sign: number): boolean {
  const el = target.scroller;
  const negativeOrigin = target.adapter.hasNegativeOrigin(el, axis);
  const x = axis === 'x';
  const offset = x ? el.scrollLeft : el.scrollTop;
  const size = x ? el.clientWidth : el.clientHeight;
  const scrollSize = x ? el.scrollWidth : el.scrollHeight;
  if (negativeOrigin) {
    return sign < 0
      ? Math.ceil(-offset) < getMaxScrollOffset(scrollSize, size)
      : Math.floor(-offset) > 0;
  }
  return sign < 0 ? offset > 0 : Math.ceil(offset) + size < scrollSize;
}

/**
 * Returns the signed engagement depth of `input` on `axis` in `[-1, 1]`, negative at
 * the top or left edge, or `0` outside the edge zones or when `target` can't scroll
 * that way. Each zone is at most a quarter of the rect, so they never overlap.
 * `anyExtent` skips the extent check, and its `getComputedStyle`, for a handler that
 * moves the surface itself.
 */
export function getEdgeScrollDepth(
  target: ScrollTarget,
  input: DraggableInput,
  axis: Axis,
  anyExtent: boolean,
): number {
  const { rect } = target;
  const x = axis === 'x';
  const start = x ? rect.left : rect.top;
  const size = x ? rect.width : rect.height;
  // Clamped into the rect, so a probe beyond an edge engages at depth 1 without
  // moving the edge zones.
  const relative =
    clamp(x ? input.clientX : input.clientY, start, x ? rect.right : rect.bottom) - start;
  const edge = Math.min(size * EDGE_THRESHOLD, MAX_EDGE_SIZE);
  if (relative < edge) {
    return anyExtent || canScrollToward(target, axis, -1) ? -(1 - relative / edge) : 0;
  }
  if (relative > size - edge) {
    return anyExtent || canScrollToward(target, axis, 1) ? 1 - (size - relative) / edge : 0;
  }
  return 0;
}

/**
 * `behavior: 'instant'` stops a CSS `scroll-behavior: smooth` from turning each
 * frame's delta into its own smooth animation.
 */
export function scrollTargetBy(target: ScrollTarget, left: number, top: number): void {
  target.scroller.scrollBy({ left, top, behavior: 'instant' });
}

export function normalizeOverflowMargin(value: DraggableViewportOverflowMargin | undefined) {
  const edge = (amount: number | undefined) =>
    amount !== undefined && Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const edges =
    typeof value === 'number' ? { top: value, right: value, bottom: value, left: value } : value;
  return {
    top: edge(edges?.top),
    right: edge(edges?.right),
    bottom: edge(edges?.bottom),
    left: edge(edges?.left),
  };
}

function expandScrollRect(
  rect: EdgeRect,
  overflowMargin: DraggableViewportOverflowMargin | undefined,
): EdgeRect {
  const margin = normalizeOverflowMargin(overflowMargin);
  return {
    top: rect.top - margin.top,
    right: rect.right + margin.right,
    bottom: rect.bottom + margin.bottom,
    left: rect.left - margin.left,
  };
}
