import { clamp } from '@base-ui/utils/clamp';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { closest, contains } from '@base-ui/utils/shadowDom';
import { warn } from '@base-ui/utils/warn';
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
import {
  monitorRegistry,
  engageMonitorIfDragging,
  removeMonitor,
  type RegisterMonitorParameters,
} from './monitor';
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
  type OverflowFlags,
} from './utils';
import {
  getActiveHitElement,
  getRawActivePointerInput,
  notifyExternalScroll,
} from './activePointer';
import { dragSessionStore } from './dragSessionStore';
import { DRAG_PREVIEW_ATTR } from './dragAttributes';
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
const PREVIEW_SELECTOR = `[${DRAG_PREVIEW_ATTR}]`;
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
type ScrollerGetter<TSourcePayload = any, TDragData = any> = () => RegisterViewportParameters<
  TSourcePayload,
  TDragData
>;

const state = getSharedSlot<AutoScrollerState>('registerViewport', () => ({
  scrollers: new Map<HTMLElement, ScrollerGetter[]>(),
  scrollLoopRaf: null,
  scrollWindow: null,
  enabled: false,
  scrollMonitorGetter: null,
  scrollMonitorRetainers: 0,
  lastTimestamp: 0,
  currentInput: null,
  currentReportedInput: null,
  currentSource: null,
  currentDropTargetElement: null,
  engagementStart: new Map<HTMLElement, number>(),
  chainAnchor: null,
  chainAnchorParent: null,
  chainSourceParent: null,
  sortedScrollers: null,
  engagedThisFrame: new Set<HTMLElement>(),
  scrollerMutationObserver: null,
  scrollerObserverRefreshScheduled: false,
  observedScrollers: new Set<HTMLElement>(),
  chainMutationObserver: null,
  observedChainElements: new Set<Element>(),
  idleMutationObserver: null,
  idleObserving: false,
  overflowCache: new WeakMap<HTMLElement, OverflowFlags>(),
  rtlCache: new WeakMap<HTMLElement, boolean>(),
}));

const holds = createGetterStackRegistry<HTMLElement, ScrollerGetter>({
  entries: state.scrollers,
});

/**
 * Register a scroll-container getter against `element`, ref-counted per node so
 * merged refs on one element don't clobber each other and the first unmount can't
 * delete the getter the second still needs — mirroring the draggable and
 * drop-target registries. The last-pushed getter is the active one.
 */
export function addScrollerRegistration(
  element: HTMLElement,
  getParameters: ScrollerGetter,
): () => void {
  const release = holds.hold(element, getParameters);
  observeScrollerMutations(element);
  invalidateScrollerOrder();
  // Registering mid-drag has to buy a frame: the loop parks itself whenever
  // nothing is engaged, and a container revealed under an already-stationary
  // pointer (a panel opening at the viewport edge) produces no input of its own
  // to wake it with — so without this it would sit still until the user moved.
  // The input the woken frame reads is not stale: the loop only parks after a
  // frame that saw the latest input, and any input since would have woken it.
  wakeScrollLoop();
  return () => {
    release();
    if (!state.scrollers.has(element)) {
      clearScrollerMutationObserver(element);
    }
    invalidateScrollerOrder();
  };
}

/**
 * Refresh computed-style caches and wake the loop, for a restyle that can alter
 * whether a candidate scrolls or which side is its inline end without changing
 * the observed ancestor chain. The next frame re-reads both computed-style
 * facts and rebuilds that chain (see `handleObservedMutations` for when this is
 * warranted — it is the expensive answer, not the default one).
 */
function refreshAutoScroll(): void {
  if (!state.enabled) {
    return;
  }
  resetStyleCaches();
  state.chainAnchor = null;
  wakeScrollLoop();
}

/**
 * Route one batch of observed mutations to the cheapest adequate response.
 *
 * Both observers watch whole subtrees, and most of what they see during a drag
 * has nothing to do with scroll containers: a consumer's `onMove`-driven
 * re-render restyling a drop indicator, or a virtualizer swapping rows in and out
 * under an auto-scroll. Answering each with `refreshAutoScroll` discarded the
 * per-drag style caches and rebuilt the observed chain (a `getComputedStyle`
 * per composed ancestor, plus a depth sort) on practically every commit of a
 * reorder-with-auto-scroll drag.
 *
 * - Engine-owned preview writes change neither a container's overflow nor its
 *   scroll extent: ignored.
 * - Content changes (`childList`) and restyles outside the candidate chain can
 *   give a container something to scroll — rows appended below the fold — but
 *   not change which elements are containers or which way they scroll: the
 *   loop is woken so the next frame re-reads the scroll extents.
 * - A `class`/`style` change on a registered container, or on an ancestor of
 *   the chain anchor or the source (where a descendant selector can flip an
 *   overflow or a direction), is what the caches cannot survive: full refresh.
 *
 * An `:has()` rule turning an ancestor into a scroller off a descendant's class
 * change is the one restyle this routing picks up a frame late (on the next
 * chain change); rare enough to trade for a quiet loop.
 */
function isPreviewMutation(record: MutationRecord): boolean {
  const target = record.target;
  return target.nodeType === ELEMENT_NODE && closest(target as Element, PREVIEW_SELECTOR) !== null;
}

/** Every element a batch of `childList` records added or removed. */
function collectMovedElements(records: MutationRecord[]): Set<Node> {
  const moved = new Set<Node>();
  for (const record of records) {
    if (record.type !== 'childList' || isPreviewMutation(record)) {
      continue;
    }
    for (const nodes of [record.addedNodes, record.removedNodes]) {
      for (const node of nodes) {
        if (node.nodeType === ELEMENT_NODE) {
          moved.add(node);
        }
      }
    }
  }
  return moved;
}

/** Whether a registered scroller, or one of its ancestors, was among `moved`. */
function movesScrollerAncestor(moved: Set<Node>): boolean {
  if (moved.size === 0) {
    return false;
  }
  for (const scroller of state.scrollers.keys()) {
    for (let node: Element | null = scroller; node; node = getComposedParentElement(node)) {
      if (moved.has(node)) {
        return true;
      }
    }
  }
  return false;
}

function handleObservedMutations(records: MutationRecord[]): void {
  if (!state.enabled) {
    return;
  }
  // Walk viewport ancestors once per batch instead of checking every moved row
  // against every viewport. Ordinary content growth preserves both style caches
  // and the depth order.
  if (movesScrollerAncestor(collectMovedElements(records))) {
    invalidateScrollerOrder();
    refreshAutoScroll();
    return;
  }
  let wake = false;
  for (const record of records) {
    const target = record.target;
    if (isPreviewMutation(record)) {
      continue;
    }
    if (record.type === 'childList' || target.nodeType !== ELEMENT_NODE) {
      wake = true;
      continue;
    }
    if (affectsCandidateChain(target as Element)) {
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
 * Whether a restyle of `element` can change a candidate's overflow or
 * direction: it is a registered container itself, or a strict ancestor of the
 * element the observed chain was walked from (or of the source, whose chain is
 * unioned in). The anchor and source themselves are excluded: a hover class
 * toggled on the hovered row restyles it on every target change, and a leaf's
 * own overflow never gates a registered ancestor.
 */
function affectsCandidateChain(element: Element): boolean {
  if (state.scrollers.has(element as HTMLElement)) {
    return true;
  }
  const anchor = state.chainAnchor;
  if (anchor === null) {
    // No chain walked yet, so nothing to compare against: stay conservative.
    return true;
  }
  return (
    isStrictAncestor(element, anchor) ||
    isStrictAncestor(element, state.currentSource?.element ?? null)
  );
}

function isStrictAncestor(element: Element, descendant: Element | null): boolean {
  return descendant !== null && element !== descendant && contains(element, descendant);
}

/** Invalidate the cached inner-first ordering; recomputed lazily in `scrollLoop`. */
function invalidateScrollerOrder(): void {
  state.sortedScrollers = null;
}

function getEdgeSize(dimension: number): number {
  return Math.min(dimension * EDGE_THRESHOLD, MAX_EDGE_SIZE);
}

/**
 * Edge-tests one axis and returns the signed engagement depth in `[-1, 1]`
 * (negative toward the home edge), or `0` when the pointer sits outside both
 * edge zones or the container has no room left in that direction.
 *
 * The limit checks are thunks so an off-edge frame never pays for them: on the
 * horizontal axis `canScrollEnd` resolves the container's direction, which costs
 * a `getComputedStyle`. `getEdgeSize` caps an edge zone at a quarter of the
 * dimension, so the two zones can never overlap and the order of the tests
 * doesn't matter.
 */
function getEdgeScrollDepth(
  relative: number,
  size: number,
  canScrollStart: () => boolean,
  canScrollEnd: () => boolean,
): number {
  const edge = getEdgeSize(size);
  if (relative < edge) {
    return canScrollStart() ? -(1 - relative / edge) : 0;
  }
  if (relative > size - edge) {
    return canScrollEnd() ? 1 - (size - relative) / edge : 0;
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

function canScrollUp(el: Element): boolean {
  return el.scrollTop > 0;
}

// `Math.ceil` for Chrome 115+ fractional scroll units.
function canScrollDown(el: Element): boolean {
  return Math.ceil(el.scrollTop) + el.clientHeight < el.scrollHeight;
}

// In RTL containers `scrollLeft` is 0 at the home position and grows negative
// toward the end, so a naive `scrollLeft > 0` never detects a leftward scroll
// and `scrollLeft + clientWidth < scrollWidth` always reads as scrollable. Work
// in a direction-normalized coordinate where the home edge is 0 and the far edge
// is the max scroll extent, so both edges are detected identically in LTR/RTL.
// In RTL `scrollLeft` is ≤ 0, so `-el.scrollLeft` is the distance already
// scrolled away from the (right-hand) home edge.

// `Math.ceil`/`Math.floor` guard against Chrome 115+ fractional scroll units.
function canScrollLeft(el: Element, rtl: boolean): boolean {
  // Scrolling left in RTL moves AWAY from the (right-hand) home edge, so it is
  // possible until the far extent is reached; in LTR it moves TOWARD the
  // (left-hand) home edge, so it is possible while anything is scrolled off it.
  return rtl
    ? Math.ceil(-el.scrollLeft) < getMaxScrollOffset(el.scrollWidth, el.clientWidth)
    : el.scrollLeft > 0;
}

function canScrollRight(el: Element, rtl: boolean): boolean {
  return rtl
    ? Math.floor(-el.scrollLeft) > 0
    : Math.ceil(el.scrollLeft) + el.clientWidth < el.scrollWidth;
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
 * The element whose `direction` decides which way `scrollLeft` runs for
 * `scrollTarget`.
 *
 * For a regular overflow container that is the container itself. For the page
 * scroller it is not: HTML propagates `direction` from `<body>` to the viewport
 * the same way it propagates `background`, so a `<body dir="rtl">` page scrolls
 * RTL (`scrollLeft <= 0`) while `getComputedStyle(documentElement).direction` is
 * still `ltr`. Reading the root there leaves the left edge never auto-scrolling
 * and the right edge spinning against the home edge.
 */
function directionSourceFor(scrollTarget: HTMLElement, isPageScroller: boolean): HTMLElement {
  if (!isPageScroller) {
    return scrollTarget;
  }
  // Always read `body` for the page scroller: an unstyled `body` inherits the
  // root's direction, so this is right whether or not it carries one of its own.
  const body = ownerDocument(scrollTarget).body as HTMLElement | null;
  return body ?? scrollTarget;
}

function resolveRtl(scrollTarget: HTMLElement, isPageScroller: boolean): boolean {
  return readCached(state.rtlCache, directionSourceFor(scrollTarget, isPageScroller), isRtlElement);
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

const BOTH_AXES: OverflowFlags = { x: true, y: true, blockedX: false, blockedY: false };

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
function readPageOverflowFlags(element: HTMLElement): OverflowFlags {
  const doc = ownerDocument(element);
  const root = readOverflowFlags(doc.documentElement);
  const body =
    doc.body !== null && bodyPropagatesToViewport(doc) ? readOverflowFlags(doc.body) : null;
  return {
    x: !root.blockedX && !body?.blockedX,
    y: !root.blockedY && !body?.blockedY,
    blockedX: false,
    blockedY: false,
  };
}

function sortByDepthDesc(elements: HTMLElement[]): HTMLElement[] {
  const depths = new Map<HTMLElement, number>();
  for (const el of elements) {
    let depth = 0;
    // Walk composed ancestors (piercing shadow boundaries) so a scroller nested
    // inside a shadow tree sorts deeper than its light-DOM ancestors, matching
    // the shadow-safe traversal used elsewhere in the engine.
    let node: Element | null = el;
    while (node) {
      depth += 1;
      node = getComposedParentElement(node);
    }
    depths.set(el, depth);
  }
  return elements.sort((a, b) => depths.get(b)! - depths.get(a)!);
}

/**
 * One loop frame, with the frame slot released if the body throws.
 *
 * Both resume paths (`startScrollLoop`, `wakeScrollLoop`) bail on
 * `scrollLoopRaf !== null`, so a throw out of the body — a consumer `onDragScroll`,
 * a drop-target getter behind a re-resolution — would strand this already-fired
 * (and therefore spent) id in the slot and leave auto-scroll wedged shut for the
 * rest of the drag.
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
  if (!state.currentInput || !state.currentSource) {
    // Defensive only (`stopScrollLoop` nulls these together with the frame):
    // clear the already-fired frame id so `startScrollLoop`'s null guard can't
    // wedge shut if this branch is ever reached.
    state.scrollLoopRaf = null;
    return;
  }
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
  // drag session is live.
  if (dragSessionStore.getSnapshot() === null) {
    stopScrollLoop();
    return;
  }

  const rawDeltaMs = state.lastTimestamp > 0 ? timestamp - state.lastTimestamp : 16;
  const deltaMs = Math.min(rawDeltaMs, MAX_FRAME_DELTA_MS);
  state.lastTimestamp = timestamp;

  let verticalConsumed = false;
  let horizontalConsumed = false;

  // Track the active DOM ancestry for style changes and live reparenting.
  // This observation does not register ancestors as scrolling candidates.
  const dropTargetElement = state.currentDropTargetElement;
  const chainAnchor: Element = getActiveHitElement() ?? dropTargetElement ?? currentSource.element;
  // The parent is compared too: a live reorder can move the anchor's own node
  // between containers without remounting it, which leaves the anchor identical
  // while every scroller above it changes.
  const chainAnchorParent = getComposedParentElement(chainAnchor);
  // The source is walked too, so its parent is watched the same way: a live
  // reorder that moves the dragged row into another column changes its chain
  // while the pointer stays over the very same hit element.
  const sourceParent = getComposedParentElement(currentSource.element);
  const anchorChanged = chainAnchor !== state.chainAnchor;
  const ancestryChanged =
    chainAnchorParent !== state.chainAnchorParent || sourceParent !== state.chainSourceParent;
  if (anchorChanged || ancestryChanged) {
    state.chainAnchor = chainAnchor;
    state.chainAnchorParent = chainAnchorParent;
    state.chainSourceParent = sourceParent;
    // The per-drag overflow cache survives the fresh walk: a container restyled
    // mid-drag (a collapsed section auto-expanding from `onDraggableEnter`) is caught
    // by the mutation observer, whose refresh resets the cache, so only the new
    // leaf is measured here.
    // The registered set decides the scroll order, not the anchor, so the sorted
    // order survives an anchor change; structural mutations invalidate it
    // separately when a registered viewport's ancestry changes.
    observeChainMutations(chainAnchor, currentSource.element);
  }

  // Only registered elements may scroll. Nested viewports get first use of an axis.
  if (state.sortedScrollers === null) {
    state.sortedScrollers = sortByDepthDesc([...state.scrollers.keys()]);
  }
  const sortedElements = state.sortedScrollers;
  const engagedThisFrame = state.engagedThisFrame;
  engagedThisFrame.clear();
  // Scrollers can be registered from another document (e.g. an iframe), but the
  // drag input's client coordinates are only meaningful in the source's
  // document — edge-testing a foreign scroller's frame-local rect against them
  // could scroll the wrong document's container on a coincidental overlap.
  const sourceDocument = ownerDocument(currentSource.element);
  // Share geometry and parameters between the modified-point check and both
  // passes. In particular, an overflow candidate's getter runs only once per frame.
  const candidates = new Map<HTMLElement, ScrollCandidate | null>();
  const readCandidate = (element: HTMLElement): ScrollCandidate | null => {
    if (state.currentSource !== currentSource) {
      return null;
    }
    if (candidates.has(element)) {
      return candidates.get(element)!;
    }
    const getParameters = holds.getActive(element);
    if (ownerDocument(element) !== sourceDocument || getParameters === undefined) {
      candidates.set(element, null);
      return null;
    }
    const registration = safeCall<RegisterViewportParameters | null>(
      'getParameters',
      element,
      getParameters,
      null,
    );
    if (state.currentSource !== currentSource || holds.getActive(element) !== getParameters) {
      return null;
    }
    if (
      registration == null ||
      registration.disabled ||
      !matchesAccept(registration.accept, currentSource)
    ) {
      candidates.set(element, null);
      return null;
    }
    const pageScroller = resolvePageScroller(element);
    const rect = pageScroller ? getViewportRect(element) : element.getBoundingClientRect();
    const candidate = {
      registration,
      getParameters,
      pageScroller,
      rect,
      overflowRect: expandScrollRect(rect, normalizeOverflowMargin(registration.overflowMargin)),
    };
    candidates.set(element, candidate);
    return candidate;
  };
  const preferReported = reportedPointHasCandidate(
    sortedElements,
    currentInput,
    currentReportedInput,
    readCandidate,
  );
  if (state.currentSource !== currentSource) {
    return;
  }
  const overflowElements: HTMLElement[] = [];

  // Ordinary edge scrolling gets first use of each axis. Only unclaimed axes
  // reach the second pass, which retains inner-first order among outside probes.
  for (const elements of [sortedElements, overflowElements]) {
    const overflowPass = elements === overflowElements;
    for (const element of elements) {
      // Inner-first ordering: once both axes are consumed no remaining (outer)
      // scroller can engage, so skip their rect reads and consumer callbacks.
      if (verticalConsumed && horizontalConsumed) {
        break;
      }
      const candidate = readCandidate(element);
      if (state.currentSource !== currentSource) {
        return;
      }
      // A preceding callback can unregister a viewport already read by the
      // modified-point check or queued for overflow scrolling.
      if (candidate === null || holds.getActive(element) !== candidate.getParameters) {
        continue;
      }
      const { rect, overflowRect, registration, pageScroller } = candidate;
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
        overflowElements.push(element);
        continue;
      }
      // Preserve the real edge zones and cap engagement at 1 beyond an edge.
      // The callback still receives the selected, unclamped drag coordinates.
      const relativeX = clamp(probe.clientX, rect.left, rect.right) - rect.left;
      const relativeY = clamp(probe.clientY, rect.top, rect.bottom) - rect.top;

      // A handler can implement movement on either axis, regardless of native
      // overflow or extent. Those gates only constrain the default scroll.
      const onDragScroll = registration.onDragScroll;
      const nativeOverflow = pageScroller
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

      let scrollX = 0;
      let scrollY = 0;

      if (overflow.y && !verticalConsumed) {
        scrollY = getEdgeScrollDepth(
          relativeY,
          rect.height,
          () => hasHandler || canScrollUp(scrollTarget),
          () => hasHandler || canScrollDown(scrollTarget),
        );
      }

      if (overflow.x && !horizontalConsumed) {
        // The RTL resolution stays behind the `hasHandler` short-circuit: it only
        // picks which limit check runs, so delegating must not pay its
        // `getComputedStyle`.
        scrollX = getEdgeScrollDepth(
          relativeX,
          rect.width,
          () => hasHandler || canScrollLeft(scrollTarget, resolveRtl(scrollTarget, isPageScroller)),
          () =>
            hasHandler || canScrollRight(scrollTarget, resolveRtl(scrollTarget, isPageScroller)),
        );
      }

      if (scrollX !== 0 || scrollY !== 0) {
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

        engagedThisFrame.add(element);

        if (!state.engagementStart.has(element)) {
          state.engagementStart.set(element, timestamp);
        }
        const elementElapsed = timestamp - state.engagementStart.get(element)!;
        const rampFactor = Math.min(elementElapsed / RAMP_UP_DURATION, 1);
        const frameSpeed = (maxSpeed / 1000) * deltaMs * rampFactor;

        const finalScrollX = scrollX * frameSpeed;
        const finalScrollY = scrollY * frameSpeed;

        // A scroll container moves every axis it engaged, having only engaged the
        // ones it had room on. Each axis gets its own event so a handler can cancel
        // vertical or horizontal movement independently.
        // Whether this element withholds the axis from outer viewports. Without a
        // handler every engaged axis is: the element scrolls it natively.
        let claimedX = scrollX !== 0;
        let claimedY = scrollY !== 0;
        // Whether anything moved (or a handler took over) on this element; a
        // claimed axis is always a handled one.
        let handledX = true;
        let handledY = true;
        if (onDragScroll !== undefined) {
          handledX = false;
          handledY = false;
          claimedX = false;
          claimedY = false;
          const axes = [
            { direction: 'horizontal' as const, engaged: scrollX !== 0, x: finalScrollX, y: 0 },
            { direction: 'vertical' as const, engaged: scrollY !== 0, x: 0, y: finalScrollY },
          ];
          for (const axis of axes) {
            if (!axis.engaged) {
              continue;
            }
            const value: DraggableViewportDragScrollValue = {
              source: currentSource,
              x: axis.x,
              y: axis.y,
              direction: axis.direction,
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
            let shouldScroll = false;
            if (!eventDetails.isCanceled) {
              if (axis.direction === 'horizontal' && nativeOverflow.x) {
                const rtl = resolveRtl(scrollTarget, isPageScroller);
                shouldScroll =
                  scrollX < 0
                    ? canScrollLeft(scrollTarget, rtl)
                    : canScrollRight(scrollTarget, rtl);
              } else if (axis.direction === 'vertical' && nativeOverflow.y) {
                shouldScroll =
                  scrollY < 0 ? canScrollUp(scrollTarget) : canScrollDown(scrollTarget);
              }
            }
            if (shouldScroll) {
              scrollTarget.scrollBy({ left: axis.x, top: axis.y, behavior: 'instant' });
            }
            // Two separate signals. `cancel()` says the handler took the axis over
            // (a custom surface moving itself), which keeps the element engaged so
            // its speed ramp keeps running — without that a surface with no native
            // overflow would be dropped every frame and never receive a delta above
            // zero. `consume()` is what withholds the axis from outer viewports; a
            // handler parked at its own bound leaves it alone so an ancestor can
            // scroll instead.
            const handled = eventDetails.isCanceled || eventDetails.isConsumed || shouldScroll;
            const claimed = eventDetails.isConsumed || shouldScroll;
            if (axis.direction === 'horizontal') {
              handledX = handled;
              claimedX = claimed;
            }
            if (axis.direction === 'vertical') {
              handledY = handled;
              claimedY = claimed;
            }
          }
        } else {
          // `behavior: 'instant'` so a CSS `scroll-behavior: smooth` on the container
          // can't turn each per-frame delta into a competing smooth animation.
          scrollTarget.scrollBy({ left: finalScrollX, top: finalScrollY, behavior: 'instant' });
        }

        // Consume the axis on engagement intent, not on the applied delta: on the
        // first engaged frame `frameSpeed` is 0 (ramp-up), so keying off
        // `finalScroll*` would leave the axis unconsumed and let an outer scroller
        // also scroll it for that frame.
        if (claimedY) {
          verticalConsumed = true;
        }
        if (claimedX) {
          horizontalConsumed = true;
        }

        if (!handledX && !handledY) {
          // Nothing moved, so this element must not hold the loop awake: a surface
          // parked at its own bound would otherwise burn a frame forever under a
          // stationary pointer. Dropping it also lets the end-of-frame sweep reset
          // its ramp, so a callback that throws every frame can't accumulate speed
          // and then apply it all at once when it recovers.
          engagedThisFrame.delete(element);
        }
      }
    }
  }

  for (const el of state.engagementStart.keys()) {
    if (!engagedThisFrame.has(el)) {
      state.engagementStart.delete(el);
    }
  }

  if (engagedThisFrame.size === 0) {
    // Nothing is edge-scrolling, so the next frame would recompute the same
    // answer. Park the loop; only new input can change which scroller engages,
    // and that input wakes it (see `wakeScrollLoop`). A pointer resting in the
    // middle of the page therefore costs no frames and no geometry reads.
    idleScrollLoop();
    return;
  }

  // `scroll` events are not composed, so a scrolled shadow-root container never
  // reaches the sensor's document-level listener — mark the frame dirty directly.
  notifyExternalScroll();

  state.scrollLoopRaf = requestScrollFrame();
}

// Schedule in the source window so popout drags are not throttled with their opener.
function requestScrollFrame(): number | null {
  const source = state.currentSource;
  if (source === null) {
    return null;
  }
  if (state.scrollWindow === null) {
    state.scrollWindow = ownerWindow(source.element);
  }
  return WindowAnimationFrame.request(scrollLoop, state.scrollWindow);
}

/**
 * Suspend the loop until the next drag input, without dropping the drag state
 * `wakeScrollLoop` needs to resume. The frame clock resets so the first frame
 * after the pause isn't billed for the whole idle interval.
 */
function idleScrollLoop(): void {
  state.scrollLoopRaf = null;
  state.lastTimestamp = 0;
  observeIdleMutations();
}

/**
 * Stop delivering idle mutations. The observer itself is kept for the next
 * park (see `observeIdleMutations`); `clearIdleMutationObserver` releases it.
 */
function pauseIdleMutationObserver(): void {
  if (state.idleObserving) {
    state.idleMutationObserver?.disconnect();
    state.idleObserving = false;
  }
}

function clearIdleMutationObserver(): void {
  pauseIdleMutationObserver();
  state.idleMutationObserver = null;
}

function observeScrollerMutations(element: HTMLElement): void {
  if (
    !state.enabled ||
    state.currentSource === null ||
    state.observedScrollers.has(element) ||
    ownerDocument(element) !== ownerDocument(state.currentSource.element)
  ) {
    return;
  }
  // One observer batches overlapping subtree mutations from nested scrollers.
  // Observe each container directly so closed shadow roots are covered too.
  state.scrollerMutationObserver ??= new (ownerWindow(element).MutationObserver)(
    handleObservedMutations,
  );
  state.scrollerMutationObserver.observe(element, MUTATION_OBSERVER_OPTIONS);
  state.observedScrollers.add(element);
}

function clearScrollerMutationObserver(element: HTMLElement): void {
  const observer = state.scrollerMutationObserver;
  if (!observer || !state.observedScrollers.delete(element)) {
    return;
  }
  // MutationObserver has no unobserve. Batch removals so a virtualizer removing
  // N viewports does one reconnection rather than N increasingly shorter ones.
  if (state.scrollerObserverRefreshScheduled) {
    return;
  }
  state.scrollerObserverRefreshScheduled = true;
  queueMicrotask(() => {
    if (state.scrollerMutationObserver !== observer) {
      return;
    }
    state.scrollerObserverRefreshScheduled = false;
    const records = observer.takeRecords();
    observer.disconnect();
    for (const scroller of state.observedScrollers) {
      observer.observe(scroller, MUTATION_OBSERVER_OPTIONS);
    }
    handleObservedMutations(records);
  });
}

function clearScrollerMutationObservers(): void {
  state.scrollerMutationObserver?.disconnect();
  state.scrollerMutationObserver = null;
  state.scrollerObserverRefreshScheduled = false;
  state.observedScrollers.clear();
}

/**
 * Observe the anchor and source ancestor chains for restyles that can change a
 * registered container's overflow or direction. Only registered elements ever
 * scroll; the chain is watched for cache invalidation, not for discovery.
 */
function observeChainMutations(...anchors: Element[]): void {
  const doc = ownerDocument(anchors[0]);
  const elements = new Set<Element>([doc.documentElement]);
  if (doc.body) {
    elements.add(doc.body);
  }
  for (const anchor of anchors) {
    for (let node: Element | null = anchor; node !== null; node = getComposedParentElement(node)) {
      elements.add(node);
    }
  }
  state.chainMutationObserver ??= new (ownerWindow(anchors[0]).MutationObserver)(
    handleObservedMutations,
  );
  const observer = state.chainMutationObserver;
  const records = observer.takeRecords();
  observer.disconnect();
  for (const element of elements) {
    // A previously visited container may have been restyled while outside
    // both observed chains. Shared ancestors keep their cached measurements.
    if (!state.observedChainElements.has(element)) {
      state.overflowCache.delete(element as HTMLElement);
      state.rtlCache.delete(element as HTMLElement);
    }
    // No subtree observation: preview positioning and unrelated descendants
    // must not generate mutation records on every active scroll frame.
    observer.observe(element, {
      attributes: true,
      attributeFilter: MUTATION_OBSERVER_OPTIONS.attributeFilter,
    });
  }
  state.observedChainElements = elements;
  handleObservedMutations(records);
}

function observeIdleMutations(): void {
  if (state.idleObserving || state.currentSource === null) {
    return;
  }
  const doc = ownerDocument(state.currentSource.element);
  const root = doc.documentElement;
  if (!root) {
    return;
  }
  // A parked viewport can become scrollable without an input event: a
  // stationary pointer may trigger delayed expansion that appends rows below the
  // fold. That produces no pointer move, scroll event, target change, or scroller
  // registration. This observer is the wake path for that case.
  //
  // One instance per drag, connected while parked and disconnected on wake: a
  // pointer crossing the middle of the page parks and wakes the loop on every
  // frame, and constructing a fresh document-wide observer for each park was
  // the most expensive thing such a frame did.
  state.idleMutationObserver ??= new (ownerWindow(root).MutationObserver)(handleObservedMutations);
  state.idleMutationObserver.observe(root, MUTATION_OBSERVER_OPTIONS);
  state.idleObserving = true;
}

/** Resume a parked loop when fresh input may have moved the pointer into an edge zone. */
function wakeScrollLoop(): void {
  if (!state.enabled || state.scrollLoopRaf !== null) {
    return;
  }
  pauseIdleMutationObserver();
  state.lastTimestamp = 0;
  state.scrollLoopRaf = requestScrollFrame();
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

function startScrollLoop(): void {
  clearIdleMutationObserver();
  state.enabled = true;
  for (const element of state.scrollers.keys()) {
    observeScrollerMutations(element);
  }
  if (state.scrollLoopRaf !== null) {
    return;
  }
  state.lastTimestamp = 0;
  state.engagementStart.clear();
  clearObservedChain();
  resetStyleCaches();
  state.scrollLoopRaf = requestScrollFrame();
}

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
  state.enabled = false;
  state.currentInput = null;
  state.currentReportedInput = null;
  state.currentSource = null;
  state.currentDropTargetElement = null;
  state.engagementStart.clear();
  // Scratch set from the last frame; it would otherwise pin those containers
  // until the next drag's first frame cleared it.
  state.engagedThisFrame.clear();
  clearScrollerMutationObservers();
  state.chainMutationObserver?.disconnect();
  state.chainMutationObserver = null;
  state.observedChainElements.clear();
  clearIdleMutationObserver();
  clearObservedChain();
  resetStyleCaches();
  if (scrollLoopRaf !== null && scrollWindow !== null) {
    WindowAnimationFrame.cancel(scrollLoopRaf, scrollWindow);
  }
}

/** Reset the observed ancestry and cached viewport order between drags. */
function clearObservedChain(): void {
  state.chainAnchor = null;
  state.chainAnchorParent = null;
  state.chainSourceParent = null;
  invalidateScrollerOrder();
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
  state.scrollMonitorRetainers = 0;
}

/**
 * The physical pointer, kept alongside the `modifiers`-constrained point the
 * lifecycle reports so {@link resolveProbePoint} can pick between them per
 * container. A modifier pins the reported point where the item may go, which need
 * not be anywhere near the container the user is pushing against — an axis lock
 * holds it on the row the drag started from. Falls back to the reported input for
 * a drag the synthetic sensor doesn't own.
 */
function resolveScrollInput(reported: DraggableInput): DraggableInput {
  return getRawActivePointerInput() ?? reported;
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
 * confined the drag to, while the candidate chain is anchored at the modified
 * point (`getActiveHitElement` hit-tests there) — testing raw edges against a
 * chain built at the modified point compares two different coordinate spaces,
 * and the container silently drops out. So fall back to the reported point when
 * the raw one has left the rect, and reject the candidate only when neither is
 * inside it.
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
  sortedElements: ReadonlyArray<HTMLElement>,
  raw: DraggableInput,
  reported: DraggableInput | null,
  readCandidate: (element: HTMLElement) => ScrollCandidate | null,
): boolean {
  if (reported === null || (reported.clientX === raw.clientX && reported.clientY === raw.clientY)) {
    return false;
  }
  for (const element of sortedElements) {
    const candidate = readCandidate(element);
    if (
      candidate !== null &&
      candidate.pageScroller === null &&
      isPointInRect(reported.clientX, reported.clientY, candidate.overflowRect)
    ) {
      return true;
    }
  }
  return false;
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

function expandScrollRect(rect: ScrollRect, margin: ReturnType<typeof normalizeOverflowMargin>) {
  return {
    top: rect.top - margin.top,
    right: rect.right + margin.right,
    bottom: rect.bottom + margin.bottom,
    left: rect.left - margin.left,
  };
}

type ScrollRect = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left' | 'width' | 'height'>;
interface ScrollCandidate {
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
  if (!state.enabled) {
    return;
  }
  setDragInput(location, source);
  wakeScrollLoop();
}

function setDragInput(location: DraggableLocationHistory, source: DraggableRootRecord): void {
  state.currentInput = resolveScrollInput(location.current.input);
  state.currentReportedInput = location.current.input;
  state.currentSource = source;
  state.currentDropTargetElement = getInnermostDropTargetElement(location);
}

/**
 * The innermost drop target under the pointer — the deepest place the drag can
 * land. The candidate walk prefers the hit element over it (see `chainAnchor`),
 * and falls back to this when no hit element is available. The stack is published
 * innermost-first, so this is simply its head.
 */
function getInnermostDropTargetElement(location: DraggableLocationHistory): Element | null {
  return location.current.targets[0]?.element ?? null;
}

function startScrollSession(source: DraggableRootRecord, location: DraggableLocationHistory): void {
  // A drag that ended abnormally with the loop *parked* leaves `enabled` set
  // and the last input/source referenced: the loop's own no-session
  // self-termination only runs when a frame fires. Clear that state before
  // this drag decides anything.
  stopScrollLoop();
  setDragInput(location, source);
  startScrollLoop();
}

// The engine-internal monitor that drives the scroll loop, registered from the
// first auto-scroller registration.
const SCROLL_MONITOR_PARAMS: RegisterMonitorParameters = {
  onMoveStart: ({ source }, { location }) => startScrollSession(source, location),
  onMove: refreshDragInput,
  onTargetChange: refreshDragInput,
  onMoveEnd: () => {
    stopScrollLoop();
  },
};

/**
 * Retain the engine scroll-monitor, which arms auto-scroll while at least one
 * explicit auto-scroller registration exists.
 *
 * Called by each explicit auto-scroller registration. Only registered elements
 * can scroll. The loop itself only runs between a drag's
 * start and end, parks whenever no container is engaged, and is removed with the
 * last registration.
 */
export function retainScrollMonitor(): () => void {
  state.scrollMonitorRetainers += 1;
  if (!state.scrollMonitorGetter) {
    const getMonitor = () => SCROLL_MONITOR_PARAMS;
    state.scrollMonitorGetter = getMonitor;
    monitorRegistry.add(getMonitor);
    // A scroller mounting mid-drag activates the monitor for the in-progress drag.
    engageMonitorIfDragging(getMonitor);
    const session = dragSessionStore.getSnapshot();
    if (session) {
      startScrollSession(session.source, session.location);
    }
  }
  const retainedMonitor = state.scrollMonitorGetter;
  return onceCleanup(() => {
    // Test teardown can reset the shared feature boundary before a mounted
    // consumer's cleanup runs. That stale cleanup must not release a monitor
    // installed by the following test.
    if (state.scrollMonitorGetter !== retainedMonitor) {
      return;
    }
    state.scrollMonitorRetainers -= 1;
    if (state.scrollMonitorRetainers === 0 && state.scrollMonitorGetter) {
      const getMonitor = state.scrollMonitorGetter;
      // React detaches an old render node before attaching its replacement in
      // the same commit. Defer the last release so that swap keeps the live drag
      // input and loop; a replacement registration cancels this retirement by
      // incrementing the retain count before the microtask runs.
      queueMicrotask(() => {
        if (state.scrollMonitorRetainers === 0 && state.scrollMonitorGetter === getMonitor) {
          state.scrollMonitorGetter = null;
          stopScrollLoop();
          removeMonitor(getMonitor);
        }
      });
    }
  });
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
  /**
   * Auto-scroll is armed for the current drag by the scroll monitor's
   * `onMoveStart`. Every other entry point (`wakeScrollLoop`, `refreshDragInput`)
   * reads this flag. Distinct from `scrollLoopRaf !== null`, which is
   * false while the loop is merely parked between edge engagements (see
   * `idleScrollLoop`).
   */
  enabled: boolean;
  scrollMonitorGetter: (() => RegisterMonitorParameters) | null;
  scrollMonitorRetainers: number;
  lastTimestamp: number;
  currentInput: DraggableInput | null;
  /**
   * The `modifiers`-constrained point the lifecycle reported, kept alongside the
   * physical one in {@link currentInput}. A clamping modifier separates the two,
   * and the candidate walk is anchored at *this* point (`getActiveHitElement`
   * hit-tests the modified position), so the edge tests need it to stay in the
   * same coordinate space as the chain they are testing (see {@link resolveProbePoint}).
   */
  currentReportedInput: DraggableInput | null;
  currentSource: DraggableRootRecord | null;
  /** The innermost drop target under the pointer; a fallback anchor for the candidate walk. */
  currentDropTargetElement: Element | null;
  /** When the pointer first entered each element's edge zone. */
  engagementStart: Map<HTMLElement, number>;
  /** The active hit/source element whose ancestors are observed for restyles. */
  chainAnchor: Element | null;
  /**
   * {@link chainAnchor}'s composed parent when the chain was walked. A live
   * reorder can move the anchor's *own node* into a different container without
   * remounting it (React with stable keys does `insertBefore`), which leaves the
   * anchor's identity unchanged while every scroller above it changes.
   */
  chainAnchorParent: Element | null;
  chainSourceParent: Element | null;
  /** Cached inner-first ordering of the registered viewports; `null` when stale. */
  sortedScrollers: HTMLElement[] | null;
  /** Scratch set of scrollers engaged in the current frame, reused across frames. */
  engagedThisFrame: Set<HTMLElement>;
  /** Watches registered scrollers in the active document during a pointer drag. */
  scrollerMutationObserver: MutationObserver | null;
  scrollerObserverRefreshScheduled: boolean;
  observedScrollers: Set<HTMLElement>;
  /** Watches styles on the active ancestor chains during active scrolling. */
  chainMutationObserver: MutationObserver | null;
  observedChainElements: Set<Element>;
  /** Watches for content/style changes only while the frame loop is parked. */
  idleMutationObserver: MutationObserver | null;
  /** Whether `idleMutationObserver` is currently connected (the loop is parked). */
  idleObserving: boolean;
  /** Per-drag per-axis overflow cache (see `readCached`). */
  overflowCache: WeakMap<HTMLElement, OverflowFlags>;
  /** Per-drag `isRtl` cache (see `readCached`). */
  rtlCache: WeakMap<HTMLElement, boolean>;
}

export interface RegisterViewportParameters<TSourcePayload = unknown, TDragData = unknown> {
  /**
   * How far outside the container a drag can continue auto-scrolling, in CSS pixels.
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
   * Changing it during a drag pauses or resumes scrolling.
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
