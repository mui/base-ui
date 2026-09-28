import { clamp } from '@base-ui/utils/clamp';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { closest } from '@base-ui/utils/shadowDom';
import { warn } from '@base-ui/utils/warn';
import { isShadowRoot } from '@floating-ui/utils/dom';
import { WindowAnimationFrame } from '../windowAnimationFrame';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type {
  DraggableAccept,
  DraggableInput,
  DraggableLocationHistory,
} from '../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../draggable/root/DraggableRoot';
import type { DragSourceEventValue, MoveEventDetails, DropTargetChangeEventDetails } from './types';
import { matchesAccept } from './dragKind';
import { addMonitor, removeMonitor } from './monitor';
import type { RegisterMonitorParameters } from './monitor';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import {
  onceCleanup,
  safeCallConsumer,
  getComposedParentElement,
  getOverflowFlags,
  getViewportSize,
  isPointInRect,
  isRtlElement,
} from './utils';
import type { OverflowFlags } from './utils';
import { getRawActivePointerInput, notifyExternalScroll } from './synthetic/syntheticSensor';
import { dragSessionStore } from './dragSessionStore';
import * as DraggablePreviewDataAttributes from '../../draggable/preview/DraggablePreviewDataAttributes';
import { getMaxScrollOffset } from '../scrollEdges';
import type {
  DraggableViewportDragScrollEventDetails,
  DraggableViewportDragScrollValue,
  DraggableViewportMaxSpeedContext,
  DraggableViewportOverflowMargin,
} from '../../draggable/viewport/DraggableViewport';

const EDGE_THRESHOLD = 0.25;
const MAX_EDGE_SIZE = 180;
const DEFAULT_MAX_SPEED = 900;
const MUTATION_OBSERVER_OPTIONS: MutationObserverInit = {
  attributes: true,
  attributeFilter: ['class', 'style'],
  childList: true,
  subtree: true,
};
// No subtree for ancestors: preview positioning and unrelated descendants must
// not generate mutation records on every active scroll frame. Direct children
// are observed so reparenting a container, or one of its ancestors, rebuilds
// the chain.
const CHAIN_OBSERVER_OPTIONS: MutationObserverInit = {
  attributes: true,
  attributeFilter: MUTATION_OBSERVER_OPTIONS.attributeFilter,
  childList: true,
};
const PREVIEW_SELECTOR = `[${DraggablePreviewDataAttributes.dragPreview}]`;
const ELEMENT_NODE = 1;
// Ramp the speed in over the first engaged frames rather than starting at
// `maxSpeed`: a pointer that merely clips a container's edge on its way past
// would otherwise lurch it, and the ramp restarts whenever the pointer leaves and
// re-enters the zone (see `engagementStart`). The auto-scroll docs mention the
// ramp, because a high `maxSpeed` reads as a crawl for this long and looks broken.
const RAMP_UP_DURATION = 400;
// Cap the per-frame delta so a stalled/paused rAF (long consumer `onMove`, GC
// pause, throttled tab) can't produce one oversized `scrollBy` on resume.
const MAX_FRAME_DELTA_MS = 64;

/** A getter for a scroller's latest parameters, so `scrollLoop` reads the freshest callbacks each frame. */
type ScrollerGetter = () => RegisterViewportParameters<any, any>;

const state = getSharedSlot<AutoScrollerState>('registerViewport', () => ({
  scrollers: new Map<HTMLElement, ScrollerGetter[]>(),
  scrollLoopRaf: null,
  scrollWindow: null,
  scrollMonitorGetter: null,
  lastTimestamp: 0,
  currentInput: null,
  currentReportedInput: null,
  currentSource: null,
  engagementStart: new Map<HTMLElement, number>(),
  overflowEligible: new Set<HTMLElement>(),
  sortedScrollers: null,
  chainMutationObserver: null,
  observedChainElements: new Set<Element>(),
  idleMutationObserver: null,
  overflowCache: new WeakMap<HTMLElement, OverflowFlags>(),
  rtlCache: new WeakMap<HTMLElement, boolean>(),
}));

const holds = createGetterStackRegistry<HTMLElement, ScrollerGetter>({
  entries: state.scrollers,
});

// The engine-internal monitor that drives the scroll loop, installed by the
// first viewport registration.
const SCROLL_MONITOR_PARAMS: RegisterMonitorParameters = {
  onMoveStart: ({ source }, { location }) => startScrollSession(source, location),
  onMove: refreshDragInput,
  onTargetChange: refreshDragInput,
  onMoveEnd: stopScrollLoop,
};

/**
 * Register a scroll-container getter against `element`, ref-counted per node so
 * merged refs on one element don't clobber each other and the first unmount can't
 * delete the getter the second still needs — mirroring the draggable and
 * drop-target registries. The last-pushed getter is the active one.
 *
 * The first registration installs the scroll monitor and the last one removes
 * it. The loop itself only runs between a drag's start and end, and parks
 * whenever no container is engaged.
 */
export function addScrollerRegistration(
  element: HTMLElement,
  getParameters: ScrollerGetter,
): () => void {
  const release = holds.hold(element, getParameters);
  invalidateScrollerOrder();
  // Registering mid-drag has to buy a frame: the loop parks itself whenever
  // nothing is engaged, and a container revealed under an already-stationary
  // pointer (a panel opening at the viewport edge) produces no input of its own
  // to wake it with — so without this it would sit still until the user moved.
  // The input the woken frame reads is not stale: the loop only parks after a
  // frame that saw the latest input, and any input since would have woken it.
  wakeScrollLoop();
  if (state.scrollMonitorGetter === null) {
    const getMonitor = () => SCROLL_MONITOR_PARAMS;
    state.scrollMonitorGetter = getMonitor;
    // A scroller mounting mid-drag activates the monitor for the in-progress drag.
    addMonitor(getMonitor);
    const session = dragSessionStore.getSnapshot();
    if (session) {
      startScrollSession(session.source, session.location);
    }
  }
  const scrollMonitor = state.scrollMonitorGetter;
  return onceCleanup(() => {
    release();
    if (!state.scrollers.has(element)) {
      state.overflowEligible.delete(element);
    }
    invalidateScrollerOrder();
    if (state.scrollers.size > 0) {
      return;
    }
    // React detaches an old render node before attaching its replacement in
    // the same commit. Defer the last release so that swap keeps the live drag
    // input and loop; the replacement's registration cancels this retirement.
    // Test teardown can reset the monitor before a mounted consumer's cleanup
    // runs, and that stale cleanup must not retire the next test's monitor.
    queueMicrotask(() => {
      if (state.scrollers.size === 0 && state.scrollMonitorGetter === scrollMonitor) {
        state.scrollMonitorGetter = null;
        stopScrollLoop();
        removeMonitor(scrollMonitor);
      }
    });
  });
}

/**
 * Refresh computed-style caches and wake the loop, for a restyle that can alter
 * whether a registered container scrolls or which side is its inline end. The
 * next frame re-reads both computed-style facts (see `handleObservedMutations`
 * for when this is warranted — it is the expensive answer, not the default one).
 */
function refreshAutoScroll(): void {
  resetStyleCaches();
  wakeScrollLoop();
}

function isPreviewMutation(record: MutationRecord): boolean {
  const target = record.target;
  return target.nodeType === ELEMENT_NODE && closest(target as Element, PREVIEW_SELECTOR) !== null;
}

/** Whether a batch of `childList` records added or removed an observed chain element. */
function movesChainElement(records: MutationRecord[]): boolean {
  for (const record of records) {
    if (record.type !== 'childList' || isPreviewMutation(record)) {
      continue;
    }
    for (const nodes of [record.addedNodes, record.removedNodes]) {
      for (const node of nodes) {
        if (state.observedChainElements.has(node as Element)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Route one batch of observed mutations to the cheapest adequate response.
 *
 * The registered containers, and the whole document while the loop is parked,
 * are watched as subtrees, and most of what that reports during a drag has
 * nothing to do with scroll containers: a consumer's `onMove`-driven re-render
 * restyling a drop indicator, or a virtualizer swapping rows in and out under
 * an auto-scroll. Answering each with `refreshAutoScroll` would discard the
 * per-drag style caches on practically every commit of a
 * reorder-with-auto-scroll drag.
 *
 * - Engine-owned preview writes change neither a container's overflow nor its
 *   scroll extent: ignored.
 * - Moving a registered container, or one of its ancestors, can change both
 *   the nesting order and what its styles resolve to: the order is rebuilt and
 *   the caches refreshed.
 * - Other content changes (`childList`) and restyles outside the observed
 *   chains can give a container something to scroll — rows appended below the
 *   fold — but not change which elements are containers or which way they
 *   scroll: the loop is woken so the next frame re-reads the scroll extents.
 * - A `class`/`style` change on a registered container or one of its
 *   ancestors (where a descendant selector can flip an overflow or a
 *   direction) is what the caches cannot survive: full refresh.
 *
 * A restyle that reaches a container only through `:has()` or a sibling
 * combinator is the one this routing misses until the next refresh; rare enough
 * to trade for a quiet loop.
 */
function handleObservedMutations(records: MutationRecord[]): void {
  if (state.currentSource === null) {
    return;
  }
  // Ordinary content growth preserves both style caches and the depth order.
  if (movesChainElement(records)) {
    invalidateScrollerOrder();
    refreshAutoScroll();
    return;
  }
  let wake = false;
  for (const record of records) {
    if (isPreviewMutation(record)) {
      continue;
    }
    // An attribute record always targets an element.
    if (record.type === 'attributes' && state.observedChainElements.has(record.target as Element)) {
      refreshAutoScroll();
      return;
    }
    wake = true;
  }
  if (wake) {
    wakeScrollLoop();
  }
}

/**
 * Invalidate the cached inner-first ordering. The next `runScrollFrame` rebuilds
 * it and re-observes the chains (see `sortAndObserveScrollers`).
 */
function invalidateScrollerOrder(): void {
  state.sortedScrollers = null;
}

/**
 * Edge-tests one axis and returns the signed engagement depth in `[-1, 1]`
 * (negative toward the home edge), or `0` when the pointer sits outside both
 * edge zones or the container has no room left in that direction.
 *
 * The limit check is a thunk so an off-edge frame never pays for it: on the
 * horizontal axis it resolves the container's direction, which costs a
 * `getComputedStyle`. An edge zone is capped at a quarter of the dimension, so
 * the two zones can never overlap and the order of the tests doesn't matter.
 */
function getEdgeScrollDepth(
  relative: number,
  size: number,
  canScroll: (sign: number) => boolean,
): number {
  const edge = Math.min(size * EDGE_THRESHOLD, MAX_EDGE_SIZE);
  if (relative < edge) {
    return canScroll(-1) ? -(1 - relative / edge) : 0;
  }
  if (relative > size - edge) {
    return canScroll(1) ? 1 - (size - relative) / edge : 0;
  }
  return 0;
}

/**
 * A throwing callback costs the scroller this drag frame, keeping one buggy
 * scroller from aborting the shared scroll loop for every other scroller.
 */
function safeCall<T>(
  callbackName: 'maxSpeed' | 'getParameters' | 'onDragScroll',
  element: Element,
  call: () => T,
  fallback: T,
): T {
  return safeCallConsumer('viewport', callbackName, element, call, fallback);
}

/**
 * A speed that isn't a non-negative finite number falls back to the default: a
 * negative one would scroll the container backwards and a `NaN` would freeze it,
 * neither with anything to diagnose.
 */
function resolveMaxSpeed(
  registration: RegisterViewportParameters,
  element: HTMLElement,
  feedback: DraggableViewportMaxSpeedContext,
): number {
  const { maxSpeed } = registration;
  if (maxSpeed === undefined) {
    return DEFAULT_MAX_SPEED;
  }
  const resolved =
    typeof maxSpeed === 'function'
      ? safeCall('maxSpeed', element, () => maxSpeed(feedback), DEFAULT_MAX_SPEED)
      : maxSpeed;
  return Number.isFinite(resolved) && resolved >= 0 ? resolved : DEFAULT_MAX_SPEED;
}

const AXES = ['x', 'y'] as const;
type Axis = (typeof AXES)[number];
type AxisFlags = Record<Axis, boolean>;

/**
 * Whether `el` has room left to scroll on `axis`, toward the start (top/left)
 * for a negative `sign` and toward the end otherwise. `Math.ceil`/`Math.floor`
 * guard against Chrome 115+ fractional scroll units.
 */
function canScrollToward(
  el: HTMLElement,
  axis: Axis,
  sign: number,
  isPageScroller: boolean,
): boolean {
  if (axis === 'y') {
    return sign < 0
      ? el.scrollTop > 0
      : Math.ceil(el.scrollTop) + el.clientHeight < el.scrollHeight;
  }
  if (!resolveRtl(el, isPageScroller)) {
    return sign < 0
      ? el.scrollLeft > 0
      : Math.ceil(el.scrollLeft) + el.clientWidth < el.scrollWidth;
  }
  // In RTL containers `scrollLeft` is 0 at the (right-hand) home position and
  // grows negative toward the end, so a naive `scrollLeft > 0` never detects a
  // leftward scroll and `scrollLeft + clientWidth < scrollWidth` always reads as
  // scrollable. `-el.scrollLeft` is the distance already scrolled away from the
  // home edge: scrolling left moves away from it, so it is possible until the
  // far extent is reached; scrolling right moves back toward it.
  return sign < 0
    ? Math.ceil(-el.scrollLeft) < getMaxScrollOffset(el.scrollWidth, el.clientWidth)
    : Math.floor(-el.scrollLeft) > 0;
}

/**
 * Whether `<body>`'s overflow propagates to the viewport. CSS Overflow
 * propagates it only while `<html>`'s computed overflow is `visible` on both
 * axes; once the root sets any overflow of its own, `<body>` is a regular
 * element whose overflow applies to itself (the predicate `useScrollLock`'s
 * `getViewportScroller` uses).
 */
function bodyPropagatesToViewport(doc: Document): boolean {
  const root = readOverflowFlags(doc.documentElement);
  return !root.x && !root.y && !root.blockedX && !root.blockedY;
}

/**
 * Resolve a registration on the document's root to the element whose scroll
 * properties move the viewport (`scrollingElement`: `documentElement` in
 * standards mode, `body` in quirks mode), or `null` for a regular overflow
 * container. A `body` registration also maps to the page scroller while
 * `<html>` leaves its overflow `visible`: whatever overflow `body` carries then
 * propagates to the viewport instead of making `body` a scroll container of
 * its own (the browser computes the other axis to `auto` when one is set, but
 * `body.scrollBy` still moves nothing), so a scroller registered on it would
 * otherwise be silently inert. Once `<html>` sets an overflow of its own,
 * `body` is a regular element: it scrolls itself when styled as an overflow
 * container and is rejected like any non-scrolling element otherwise.
 * Environments that don't implement `scrollingElement` (jsdom) fall back to
 * the standards-mode answer, the document element.
 */
function resolvePageScroller(element: HTMLElement): HTMLElement | null {
  const doc = ownerDocument(element);
  const scrollingElement = (doc.scrollingElement ?? doc.documentElement) as HTMLElement | null;
  if (scrollingElement === null) {
    return null;
  }
  if (element === scrollingElement || element === doc.documentElement) {
    return scrollingElement;
  }
  if (element === doc.body && bodyPropagatesToViewport(doc)) {
    // `readPageOverflowFlags` reads a `hidden`/`clip` on `body` as "the page
    // has been stopped on this axis".
    return scrollingElement;
  }
  return null;
}

/**
 * Whether `scrollLeft` runs right-to-left for `scrollTarget`.
 *
 * A regular overflow container decides that with its own `direction`. The page
 * scroller does not: HTML propagates `direction` from `<body>` to the viewport
 * the same way it propagates `background`, so a `<body dir="rtl">` page scrolls
 * RTL (`scrollLeft <= 0`) while `getComputedStyle(documentElement).direction` is
 * still `ltr`. Reading the root there leaves the left edge never auto-scrolling
 * and the right edge spinning against the home edge.
 */
function resolveRtl(scrollTarget: HTMLElement, isPageScroller: boolean): boolean {
  // Always read `body` for the page scroller: an unstyled `body` inherits the
  // root's direction, so this is right whether or not it carries one of its own.
  const body = isPageScroller ? (ownerDocument(scrollTarget).body as HTMLElement | null) : null;
  return readCached(state.rtlCache, body ?? scrollTarget, isRtlElement);
}

// The viewport in client coordinates. `getViewportSize` is the engine's single
// viewport definition (scrollbar-excluding, with the detached-document/jsdom
// fallback), so the edge zones here agree with `restrictToWindowEdges` on where
// the edge is.
function getViewportRect(element: HTMLElement) {
  const { width, height } = getViewportSize(ownerWindow(element));
  return {
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
  };
}

// `getComputedStyle`-derived per-element facts (overflow, `isRtl`) are stable
// for the duration of a drag but cost a style resolve on every read; cache them
// per drag (the loop's start and stop reset the caches).
function readCached<T>(
  cache: WeakMap<HTMLElement, T>,
  element: HTMLElement,
  compute: (el: HTMLElement) => T,
): T {
  let cached = cache.get(element);
  if (cached === undefined) {
    cached = compute(element);
    cache.set(element, cached);
  }
  return cached;
}

const BOTH_AXES: AxisFlags = { x: true, y: true };

function readOverflowFlags(element: HTMLElement): OverflowFlags {
  return readCached(state.overflowCache, element, getOverflowFlags);
}

/**
 * Which axes the *viewport* scrolls on. The page is scrollable by default —
 * `<html>` is not an overflow element yet the viewport still scrolls — so this
 * asks the opposite question from {@link readOverflowFlags}: which axes has the
 * page been stopped on. `<body>` is consulted too, but only while `<html>`'s
 * overflow is `visible` on both axes: that is when `body`'s overflow propagates
 * to the viewport (see {@link bodyPropagatesToViewport}), which is what keeps a
 * `body`-based scroll lock holding during a drag. Once `<html>` sets its own
 * overflow, `body`'s value applies to `body` alone and says nothing about the
 * page.
 */
function readPageOverflowFlags(element: HTMLElement): AxisFlags {
  const doc = ownerDocument(element);
  const root = readOverflowFlags(doc.documentElement);
  const body =
    doc.body !== null && bodyPropagatesToViewport(doc) ? readOverflowFlags(doc.body) : null;
  return {
    x: !root.blockedX && !body?.blockedX,
    y: !root.blockedY && !body?.blockedY,
  };
}

/**
 * Order the registered viewports inner-first, and observe the ancestor chains of
 * those in `doc` (see `observeChainMutations`) from the same walk.
 */
function sortAndObserveScrollers(doc: Document): HTMLElement[] {
  const depths = new Map<HTMLElement, number>();
  const chain = new Set<Element>([doc.documentElement]);
  if (doc.body) {
    chain.add(doc.body);
  }
  // The composed walk steps from a shadow root's top-level children straight to
  // its host, so the roots are collected separately to observe their children.
  const shadowRoots = new Set<ShadowRoot>();
  for (const el of state.scrollers.keys()) {
    const observed = ownerDocument(el) === doc;
    let depth = 0;
    // Walk composed ancestors (piercing shadow boundaries) so a scroller nested
    // inside a shadow tree sorts deeper than its light-DOM ancestors, matching
    // the shadow-safe traversal used elsewhere in the engine.
    for (let node: Element | null = el; node !== null; node = getComposedParentElement(node)) {
      depth += 1;
      if (observed) {
        chain.add(node);
        if (node.parentNode && isShadowRoot(node.parentNode)) {
          shadowRoots.add(node.parentNode);
        }
      }
    }
    depths.set(el, depth);
  }
  observeChainMutations(doc, chain, shadowRoots);
  return [...depths.keys()].sort((a, b) => depths.get(b)! - depths.get(a)!);
}

/**
 * One loop frame, with the frame slot released if the body throws.
 *
 * `wakeScrollLoop` bails on `scrollLoopRaf !== null`, so a throw out of the
 * body — a consumer `onDragScroll`, a drop-target getter behind a re-resolution —
 * would strand this already-fired (and therefore spent) id in the slot and leave
 * auto-scroll wedged shut for the rest of the drag.
 *
 * Cleared here on the way out rather than on the way in: the id has to stay set
 * *through* the body, because `wakeScrollLoop` reads it to tell "a frame is
 * already pending" from "the loop is parked". A consumer registering a scroller
 * mid-frame wakes the loop, and with the slot already nulled that wake would
 * schedule a second frame whose id the reschedule below then overwrites —
 * leaking an uncancellable frame and running the loop at double rate.
 */
function scrollLoop(timestamp: number): void {
  try {
    runScrollFrame(timestamp);
  } catch (error) {
    state.scrollLoopRaf = null;
    throw error;
  }
}

function runScrollFrame(timestamp: number): void {
  // Snapshotted for the whole iteration. The loop below runs consumer-reachable
  // callbacks (`onDragScroll`, the drop-target getters behind a re-resolution), any
  // of which can re-entrantly end the drag and null these — and every read after
  // that point would then dereference `null`.
  const currentInput = state.currentInput;
  const currentReportedInput = state.currentReportedInput;
  const currentSource = state.currentSource;

  // A drag can end abnormally — a consumer callback throwing tears down the
  // lifecycle via `clearActiveMonitors()` without ever dispatching `onMoveEnd` to
  // the scroll monitor, so `stopScrollLoop` never runs and this loop keeps
  // rescheduling itself (and scrolling) forever. Self-terminate the moment no
  // drag session is live. The input and source checks are defensive only:
  // `stopScrollLoop` nulls them together with the frame.
  if (currentInput === null || currentSource === null || dragSessionStore.getSnapshot() === null) {
    stopScrollLoop();
    return;
  }

  const rawDeltaMs = state.lastTimestamp > 0 ? timestamp - state.lastTimestamp : 16;
  const deltaMs = Math.min(rawDeltaMs, MAX_FRAME_DELTA_MS);
  state.lastTimestamp = timestamp;

  // Scrollers can be registered from another document (e.g. an iframe), but the
  // drag input's client coordinates are only meaningful in the source's
  // document — edge-testing a foreign scroller's frame-local rect against them
  // could scroll the wrong document's container on a coincidental overlap.
  const sourceDocument = ownerDocument(currentSource.element);
  // Nested viewports get first use of an axis.
  if (state.sortedScrollers === null) {
    state.sortedScrollers = sortAndObserveScrollers(sourceDocument);
  }
  const sortedElements = state.sortedScrollers;
  // Each element engaged this frame, with when its engagement began. Replaces
  // `engagementStart` at the end of the frame, so a ramp restarts once its
  // element sits a frame out.
  const engaged = new Map<HTMLElement, number>();

  // Read every candidate before scrolling any, so the entry/exit history updates
  // even when an inner viewport consumes both axes. Otherwise an outer viewport
  // could retain permission after the pointer left its margin, or miss an entry
  // while the inner viewport was scrolling.
  const candidates: ScrollCandidate[] = [];
  for (const element of sortedElements) {
    const getParameters = holds.getActive(element);
    if (ownerDocument(element) !== sourceDocument || getParameters === undefined) {
      continue;
    }
    const registration = safeCall<RegisterViewportParameters | null>(
      'getParameters',
      element,
      getParameters,
      null,
    );
    if (state.currentSource !== currentSource) {
      return;
    }
    if (holds.getActive(element) !== getParameters) {
      continue;
    }
    if (
      registration == null ||
      registration.disabled ||
      !matchesAccept(registration.accept, currentSource)
    ) {
      state.overflowEligible.delete(element);
      continue;
    }
    const pageScroller = resolvePageScroller(element);
    const rect = pageScroller ? getViewportRect(element) : element.getBoundingClientRect();
    let overflowRect: ScrollCandidate['overflowRect'] = rect;
    // The page ignores `overflowMargin`: its probe is the pointer clamped into
    // the viewport (see below), so it never needs the entry history either.
    if (pageScroller === null) {
      const marginRect = expandScrollRect(rect, registration.overflowMargin);
      if (resolveProbePoint(currentInput, currentReportedInput, rect, false) !== null) {
        state.overflowEligible.add(element);
      } else if (
        resolveProbePoint(currentInput, currentReportedInput, marginRect, false) === null
      ) {
        state.overflowEligible.delete(element);
      }
      if (state.overflowEligible.has(element)) {
        overflowRect = marginRect;
      }
    }
    candidates.push({ element, registration, getParameters, pageScroller, rect, overflowRect });
  }
  const preferReported = reportedPointHasCandidate(candidates, currentInput, currentReportedInput);
  const consumed: AxisFlags = { x: false, y: false };
  const overflowCandidates: ScrollCandidate[] = [];

  // Ordinary edge scrolling gets first use of each axis. Only unclaimed axes
  // reach the second pass, which retains inner-first order among outside probes.
  for (const pass of [candidates, overflowCandidates]) {
    const overflowPass = pass === overflowCandidates;
    for (const candidate of pass) {
      // Inner-first ordering: once both axes are consumed no remaining (outer)
      // scroller can engage, so skip their scroll callbacks.
      if (consumed.x && consumed.y) {
        break;
      }
      const { element, rect, overflowRect, registration, pageScroller } = candidate;
      // A preceding callback can unregister a viewport read above.
      if (holds.getActive(element) !== candidate.getParameters) {
        continue;
      }
      const scrollTarget = pageScroller ?? element;
      const isPageScroller = pageScroller !== null;
      // Page scrolling already clamps captured pointers beyond the viewport.
      // Element margins don't change that existing behavior.
      const probe = pageScroller
        ? {
            ...currentInput,
            clientX: clamp(currentInput.clientX, rect.left, rect.right),
            clientY: clamp(currentInput.clientY, rect.top, rect.bottom),
          }
        : resolveProbePoint(currentInput, currentReportedInput, overflowRect, preferReported);
      if (probe === null) {
        continue;
      }
      if (!overflowPass && !isPointInRect(probe.clientX, probe.clientY, rect)) {
        overflowCandidates.push(candidate);
        continue;
      }
      // Preserve the real edge zones and cap engagement at 1 beyond an edge.
      // The callback still receives the selected, unclamped drag coordinates.
      const relative = {
        x: clamp(probe.clientX, rect.left, rect.right) - rect.left,
        y: clamp(probe.clientY, rect.top, rect.bottom) - rect.top,
      };
      const size = { x: rect.width, y: rect.height };

      // A handler can implement movement on either axis, regardless of native
      // overflow or extent. Those gates only constrain the default scroll.
      const onDragScroll = registration.onDragScroll;
      const nativeOverflow: AxisFlags = pageScroller
        ? readPageOverflowFlags(element)
        : readOverflowFlags(element);
      const hasHandler = onDragScroll !== undefined;
      const overflow = hasHandler ? BOTH_AXES : nativeOverflow;
      if (!overflow.x && !overflow.y) {
        if (process.env.NODE_ENV !== 'production') {
          if (!pageScroller) {
            warn(
              'an auto-scroll container was registered on an element that does not scroll, ' +
                'so its parameters (including `disabled`) have no effect. ' +
                'Register the element whose own `overflow` clips the scrollable content, ' +
                'or provide `onDragScroll` if the surface moves its content some other way. ' +
                'See https://base-ui.com/react/utils/draggable.',
            );
          }
        }
        continue;
      }

      // `probe`, not the raw pointer: this is the point the engine just decided this
      // container's edge zones from, so a consumer re-deriving the same test
      // (`onDragScroll: (value, { input, element }) => isPointInRect(input…, element…)`)
      // reaches the same answer. Reporting the raw pointer would tell a consumer the
      // drag is outside a container the engine is busy scrolling.
      const feedback = { input: probe, source: currentSource, element };

      const depth = { x: 0, y: 0 };
      for (const axis of AXES) {
        if (overflow[axis] && !consumed[axis]) {
          // The limit check stays behind the `hasHandler` short-circuit: on the
          // horizontal axis it resolves the direction, so delegating must not
          // pay its `getComputedStyle`.
          depth[axis] = getEdgeScrollDepth(
            relative[axis],
            size[axis],
            (sign) => hasHandler || canScrollToward(scrollTarget, axis, sign, isPageScroller),
          );
        }
      }
      if (depth.x === 0 && depth.y === 0) {
        continue;
      }

      // Resolve the speed only for engaged axes, so a callback form costs
      // nothing on the frames this element doesn't engage.
      const maxSpeed = resolveMaxSpeed(registration, element, feedback);
      if (state.currentSource !== currentSource) {
        return;
      }
      // A container pinned at zero speed never moves, so it must not engage
      // either: engaging would consume both axes from the outer container and
      // hold the loop awake for a scroll that can never happen.
      if (maxSpeed === 0) {
        continue;
      }

      const engagementStart = state.engagementStart.get(element) ?? timestamp;
      engaged.set(element, engagementStart);
      const rampFactor = Math.min((timestamp - engagementStart) / RAMP_UP_DURATION, 1);
      const frameSpeed = (maxSpeed / 1000) * deltaMs * rampFactor;

      if (onDragScroll === undefined) {
        // A scroll container moves every axis it engaged, having only engaged the
        // ones it had room on. `behavior: 'instant'` so a CSS
        // `scroll-behavior: smooth` on the container can't turn each per-frame
        // delta into a competing smooth animation.
        scrollTarget.scrollBy({
          left: depth.x * frameSpeed,
          top: depth.y * frameSpeed,
          behavior: 'instant',
        });
        // Consume the axis on engagement intent, not on the applied delta: on the
        // first engaged frame `frameSpeed` is 0 (ramp-up), so keying off the
        // delta would leave the axis unconsumed and let an outer scroller also
        // scroll it for that frame.
        consumed.x ||= depth.x !== 0;
        consumed.y ||= depth.y !== 0;
        continue;
      }

      // Each engaged axis gets its own event so a handler can cancel vertical or
      // horizontal movement independently.
      let handled = false;
      for (const axis of AXES) {
        if (depth[axis] === 0) {
          continue;
        }
        const delta = depth[axis] * frameSpeed;
        const value: DraggableViewportDragScrollValue = {
          source: currentSource,
          x: axis === 'x' ? delta : 0,
          y: axis === 'y' ? delta : 0,
          direction: axis === 'x' ? 'horizontal' : 'vertical',
        };
        const eventDetails = createAutoScrollEventDetails(probe, element);
        const succeeded = safeCall(
          'onDragScroll',
          element,
          () => {
            onDragScroll(value, eventDetails);
            return true;
          },
          false,
        );
        if (state.currentSource !== currentSource) {
          return;
        }
        // A failed callback must not move this viewport or block an ancestor.
        if (!succeeded) {
          continue;
        }
        const shouldScroll =
          !eventDetails.isCanceled &&
          nativeOverflow[axis] &&
          canScrollToward(scrollTarget, axis, depth[axis], isPageScroller);
        if (shouldScroll) {
          scrollTarget.scrollBy({ left: value.x, top: value.y, behavior: 'instant' });
        }
        // Two separate signals. `cancel()` says the handler took the axis over
        // (a custom surface moving itself), which keeps the element engaged so
        // its speed ramp keeps running — without that a surface with no native
        // overflow would be dropped every frame and never receive a delta above
        // zero. `consume()` is what withholds the axis from outer viewports; a
        // handler parked at its own bound leaves it alone so an ancestor can
        // scroll instead.
        handled ||= eventDetails.isCanceled || eventDetails.isConsumed || shouldScroll;
        consumed[axis] ||= eventDetails.isConsumed || shouldScroll;
      }

      if (!handled) {
        // Nothing moved, so this element must not hold the loop awake: a surface
        // parked at its own bound would otherwise burn a frame forever under a
        // stationary pointer. Dropping it also resets its ramp, so a callback
        // that throws every frame can't accumulate speed and then apply it all
        // at once when it recovers.
        engaged.delete(element);
      }
    }
  }

  state.engagementStart = engaged;
  if (engaged.size > 0) {
    // `scroll` events are not composed, so a scrolled shadow-root container never
    // reaches the sensor's document-level listener — mark the frame dirty directly.
    notifyExternalScroll();
  } else if (state.sortedScrollers !== null) {
    // Nothing is edge-scrolling, so the next frame would recompute the same
    // answer. Park the loop; only new input can change which scroller engages,
    // and that input wakes it (see `wakeScrollLoop`). A pointer resting in the
    // middle of the page therefore costs no frames and no geometry reads.
    idleScrollLoop(sourceDocument);
    return;
  }
  // Reached with nothing engaged only when a callback registered or released a
  // viewport during this frame: the held frame slot dropped that wake, so the
  // next frame evaluates and observes the change.
  state.scrollLoopRaf = requestScrollFrame(currentSource);
}

// Schedule in the source window so popout drags are not throttled with their opener.
function requestScrollFrame(source: DraggableRootRecord): number {
  state.scrollWindow ??= ownerWindow(source.element);
  return state.scrollWindow.requestAnimationFrame(scrollLoop);
}

/**
 * Suspend the loop until the next drag input, without dropping the drag state
 * `wakeScrollLoop` needs to resume.
 *
 * A parked viewport can need scrolling again without any input event: content
 * changing elsewhere on the page can move its edge zone under the stationary
 * pointer, and `chainMutationObserver` only covers the viewports' subtrees and
 * ancestor chains. So the whole document is observed while parked.
 *
 * One observer per drag, connected while parked and disconnected on wake: a
 * pointer crossing the middle of the page parks and wakes the loop on every
 * frame, and constructing a fresh document-wide observer for each park was the
 * most expensive thing such a frame did.
 */
function idleScrollLoop(doc: Document): void {
  state.scrollLoopRaf = null;
  const root = doc.documentElement;
  state.idleMutationObserver ??= new (ownerWindow(root).MutationObserver)(handleObservedMutations);
  state.idleMutationObserver.observe(root, MUTATION_OBSERVER_OPTIONS);
}

/**
 * Observe the registered containers, their composed ancestors, and the page's
 * `<html>`/`<body>` (which the page scroller reads) for restyles that can change
 * a cached overflow or direction, and for moves that change the ancestors
 * themselves. The style caches only hold registered containers and
 * `<html>`/`<body>`, so where the pointer is doesn't matter.
 *
 * The containers' subtrees are observed too, for content changes that can give
 * one something to scroll. Each container is observed directly, so one inside
 * a closed shadow root is covered as well.
 */
function observeChainMutations(
  doc: Document,
  elements: Set<Element>,
  shadowRoots: Set<ShadowRoot>,
): void {
  state.chainMutationObserver ??= new (ownerWindow(doc.documentElement).MutationObserver)(
    handleObservedMutations,
  );
  const observer = state.chainMutationObserver;
  const records = observer.takeRecords();
  observer.disconnect();
  for (const element of elements) {
    // A container re-registered during the drag may have been restyled while
    // unobserved. Elements that stayed observed keep their cached measurements.
    if (!state.observedChainElements.has(element)) {
      state.overflowCache.delete(element as HTMLElement);
      state.rtlCache.delete(element as HTMLElement);
    }
    observer.observe(
      element,
      state.scrollers.has(element as HTMLElement)
        ? MUTATION_OBSERVER_OPTIONS
        : CHAIN_OBSERVER_OPTIONS,
    );
  }
  for (const shadowRoot of shadowRoots) {
    observer.observe(shadowRoot, { childList: true });
  }
  state.observedChainElements = elements;
  handleObservedMutations(records);
}

/** Resume a parked loop when fresh input may have moved the pointer into an edge zone. */
function wakeScrollLoop(): void {
  if (state.currentSource === null || state.scrollLoopRaf !== null) {
    return;
  }
  state.idleMutationObserver?.disconnect();
  state.lastTimestamp = 0;
  state.scrollLoopRaf = requestScrollFrame(state.currentSource);
}

/**
 * Wake a parked loop so the next frame re-evaluates the live parameters at the
 * current pointer position. React registrations call this after a parameter
 * change, because the loop may have parked while the element was disabled or
 * dynamically declined scrolling. The parameters are read through the getter
 * every frame, so nothing cached has to be dropped for a change to apply.
 * @internal
 */
export { wakeScrollLoop as wakeAutoScroll };

/**
 * The style caches are `WeakMap`s, so they are replaced rather than cleared —
 * and holding them across a drag would keep every element the last drag crossed
 * alive until the next one.
 */
function resetStyleCaches(): void {
  state.overflowCache = new WeakMap();
  state.rtlCache = new WeakMap();
}

function stopScrollLoop(): void {
  const scrollLoopRaf = state.scrollLoopRaf;
  const scrollWindow = state.scrollWindow;
  // Release the state before reaching into a possibly closed iframe/popout.
  // Firefox can throw for a dead Window proxy; the callback cannot run once its
  // realm is gone, so cancellation is best-effort while the engine state must
  // always become reusable.
  state.scrollLoopRaf = null;
  state.scrollWindow = null;
  state.currentInput = null;
  state.currentReportedInput = null;
  state.currentSource = null;
  state.engagementStart.clear();
  state.overflowEligible.clear();
  state.chainMutationObserver?.disconnect();
  state.chainMutationObserver = null;
  state.observedChainElements.clear();
  state.idleMutationObserver?.disconnect();
  state.idleMutationObserver = null;
  // Rebuilt, with the chain observation, on the next drag's first frame.
  invalidateScrollerOrder();
  resetStyleCaches();
  if (scrollLoopRaf !== null && scrollWindow !== null) {
    WindowAnimationFrame.cancel(scrollLoopRaf, scrollWindow);
  }
}

/**
 * Tear the loop down between tests. `reset()` clears the active monitors without
 * dispatching `onMoveEnd`, so the scroll monitor never runs `stopScrollLoop` and
 * a still-engaged loop would keep calling `scrollBy` into the next test's
 * document — while `currentSource` pinned the previous test's detached DOM.
 */
export function resetForTests(): void {
  // The registry is deliberately left alone: those entries are owned by the
  // cleanups the consumer still holds, and dropping them here would unregister a
  // scroller out from under a live test.
  stopScrollLoop();
  if (state.scrollMonitorGetter) {
    removeMonitor(state.scrollMonitorGetter);
    state.scrollMonitorGetter = null;
  }
}

/**
 * The point to measure `rect`'s edge zones from, or `null` when the candidate is
 * nowhere near either one.
 *
 * Two positions describe the same frame: the physical pointer, and the
 * `modifiers`-constrained point the lifecycle reports. Neither alone is right.
 * Prefer the physical one — an axis lock pins the reported point on the row the
 * drag started from, so a container the user is genuinely pushing against would
 * never see its edge zone entered. But a *clamping* modifier
 * (`restrictToElement`) moves the physical pointer out of the very container it
 * confined the drag to, which would then silently drop out. So fall back to the
 * reported point when the raw one has left the rect, and reject the candidate
 * only when neither is inside it.
 *
 * When `preferReported` is set, some registered container holds the reported
 * point, and a candidate holding only the raw one is rejected: with a drag
 * clamped into list A, the physical pointer pushing past A's edge lands in the
 * neighbouring list B, and B would otherwise take the axis from A — the only
 * container the item can still be dropped in.
 */
function resolveProbePoint(
  raw: DraggableInput,
  reported: DraggableInput | null,
  rect: { left: number; top: number; right: number; bottom: number },
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

/**
 * Whether a `modifiers`-constrained reported point that differs from the
 * physical pointer sits inside any registered (non-page) container in the
 * source's document — the case where `resolveProbePoint` must prefer it. The
 * common unmodified drag has identical points and pays nothing; the page
 * scroller is left out because it never competes on geometry (its probe is the
 * raw pointer clamped into the viewport).
 */
function reportedPointHasCandidate(
  candidates: ReadonlyArray<ScrollCandidate>,
  raw: DraggableInput,
  reported: DraggableInput | null,
): boolean {
  if (reported === null || (reported.clientX === raw.clientX && reported.clientY === raw.clientY)) {
    return false;
  }
  return candidates.some(
    (candidate) =>
      candidate.pageScroller === null &&
      isPointInRect(reported.clientX, reported.clientY, candidate.overflowRect),
  );
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
  rect: ScrollRect,
  overflowMargin: DraggableViewportOverflowMargin | undefined,
) {
  const margin = normalizeOverflowMargin(overflowMargin);
  return {
    top: rect.top - margin.top,
    right: rect.right + margin.right,
    bottom: rect.bottom + margin.bottom,
    left: rect.left - margin.left,
  };
}

type ScrollRect = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left' | 'width' | 'height'>;
interface ScrollCandidate {
  element: HTMLElement;
  getParameters: ScrollerGetter;
  registration: RegisterViewportParameters;
  pageScroller: HTMLElement | null;
  rect: ScrollRect;
  overflowRect: Pick<ScrollRect, 'top' | 'right' | 'bottom' | 'left'>;
}

// Re-seed the loop from any fresh drag input; shared by `onMove` and
// `onTargetChange`, which need identical handling.
function refreshDragInput(
  { source }: DragSourceEventValue,
  { location }: MoveEventDetails | DropTargetChangeEventDetails,
): void {
  if (state.currentSource === null) {
    return;
  }
  setDragInput(location, source);
  wakeScrollLoop();
}

function setDragInput(location: DraggableLocationHistory, source: DraggableRootRecord): void {
  // The physical pointer when the synthetic sensor owns the drag; the edge tests
  // pick between it and the reported point (see `resolveProbePoint`).
  state.currentInput = getRawActivePointerInput() ?? location.current.input;
  state.currentReportedInput = location.current.input;
  state.currentSource = source;
}

function startScrollSession(source: DraggableRootRecord, location: DraggableLocationHistory): void {
  // A drag that ended abnormally with the loop *parked* leaves the last
  // input/source referenced: the loop's own no-session self-termination only
  // runs when a frame fires. Clear that state before this drag decides anything.
  stopScrollLoop();
  setDragInput(location, source);
  wakeScrollLoop();
}

function createAutoScrollEventDetails(
  input: DraggableInput,
  element: HTMLElement,
): DraggableViewportDragScrollEventDetails {
  const details: DraggableViewportDragScrollEventDetails = createChangeEventDetails(
    REASONS.none,
    undefined,
    undefined,
    {
      input,
      element,
      isConsumed: false,
      consume() {
        details.isConsumed = true;
      },
    },
  );
  return details;
}

interface AutoScrollerState {
  /** Each scroll container maps to the stack of getters held against it (merged refs). */
  scrollers: Map<HTMLElement, ScrollerGetter[]>;
  scrollLoopRaf: number | null;
  scrollWindow: Window | null;
  scrollMonitorGetter: (() => RegisterMonitorParameters) | null;
  lastTimestamp: number;
  /** The physical pointer; see {@link resolveProbePoint}. */
  currentInput: DraggableInput | null;
  /** The `modifiers`-constrained point the lifecycle reported; see {@link resolveProbePoint}. */
  currentReportedInput: DraggableInput | null;
  /**
   * Set while auto-scroll is armed for a drag, from the scroll monitor's
   * `onMoveStart` to `stopScrollLoop`. Distinct from `scrollLoopRaf !== null`,
   * which is false while the loop is merely parked between edge engagements
   * (see `idleScrollLoop`).
   */
  currentSource: DraggableRootRecord | null;
  /** When the pointer first entered each element's edge zone. */
  engagementStart: Map<HTMLElement, number>;
  /** Viewports entered during this drag without subsequently leaving their margin. */
  overflowEligible: Set<HTMLElement>;
  /**
   * Cached inner-first ordering of the registered viewports; `null` when stale.
   * Rebuilding it also rebuilds the observed chains (see `sortAndObserveScrollers`).
   */
  sortedScrollers: HTMLElement[] | null;
  /**
   * Watches the registered viewports' subtrees and their ancestor chains in the
   * source document during a drag.
   */
  chainMutationObserver: MutationObserver | null;
  /** The elements `chainMutationObserver` watches (see `observeChainMutations`). */
  observedChainElements: Set<Element>;
  /** Watches for content/style changes only while the frame loop is parked. */
  idleMutationObserver: MutationObserver | null;
  /** Per-drag per-axis overflow cache (see `readCached`). */
  overflowCache: WeakMap<HTMLElement, OverflowFlags>;
  /** Per-drag `isRtl` cache (see `readCached`). */
  rtlCache: WeakMap<HTMLElement, boolean>;
}

export interface RegisterViewportParameters<TSourcePayload = unknown, TDragData = unknown> {
  /**
   * How far outside the container a drag can continue auto-scrolling, in CSS pixels.
   * The drag must enter the container first, and enter it again after moving beyond
   * the margin or while the container is disabled.
   * A number applies to every edge; an object sets physical edges independently.
   * Omitted, negative, and non-finite edge values are treated as `0`.
   * Outside an edge, scrolling keeps its maximum engagement and existing speed ramp.
   * Viewports containing the drag position take priority over outside margins.
   * Does not change drop targets, layout, or document/page scrolling.
   * @default 0
   */
  overflowMargin?: DraggableViewportOverflowMargin | undefined;
  /**
   * One or more kinds of draggable that scroll this container. Omit it to scroll
   * for every drag.
   */
  accept?: DraggableAccept<TSourcePayload, TDragData> | undefined;
  /**
   * Whether auto-scrolling is disabled. An ancestor viewport can then scroll instead.
   * Changing it during a drag pauses or resumes scrolling. Scrolling from
   * `overflowMargin` resumes once the drag enters the container again.
   * Use `onDragScroll` for a decision that depends on the drag.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The scrolling speed reached at the container's edge, in pixels per second.
   * Accepts a number or a function called on every scrolling frame.
   * `0` stops this container and lets an ancestor viewport scroll instead.
   * @default 900
   */
  maxSpeed?:
    | number
    | ((parameters: DraggableViewportMaxSpeedContext<TSourcePayload, TDragData>) => number)
    | undefined;
  /**
   * Event handler called once per direction on every scrolling frame.
   * Call `eventDetails.cancel()` to prevent scrolling in that direction, or to apply
   * the movement yourself for an element Base UI can't scroll, such as a panned canvas.
   * After moving, call `eventDetails.consume()` to keep an ancestor viewport from
   * scrolling on the same axis. Skip it at a bound the element can't move past.
   */
  onDragScroll?:
    | ((
        value: DraggableViewportDragScrollValue<TSourcePayload, TDragData>,
        eventDetails: DraggableViewportDragScrollEventDetails,
      ) => void)
    | undefined;
}
