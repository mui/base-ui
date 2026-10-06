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
  DraggableKind,
  DraggableLocationHistory,
} from '../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../draggable/root/DraggableRoot';
import type {
  AcceptedDragData,
  AcceptedDragPayload,
  DragCleanupFn,
  MoveEventDetails,
  DropTargetChangeEventDetails,
} from './types';
import type {
  DragParametersWithInferredAccept,
  RegisterViewportParameters,
} from './registrationTypes';
import { matchesAccept } from './dragKind';
import { addMonitor, removeMonitor } from './monitor';
import type { MonitorParameters } from './monitor';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import {
  onceCleanup,
  safeCallConsumer,
  elementFromPointIgnoring,
  getComposedParentElement,
  getOrCreate,
  getOverflowFlags,
  getViewportRect,
  isPointInRect,
  isRtlElement,
  remapInput,
} from './utils';
import type { OverflowFlags } from './utils';
import { getRawActivePointerInput, notifyExternalScroll } from './activePointer';
import { getDropTargetShadowRootsByHost } from './dropTarget';
import { dragSessionStore } from './dragSessionStore';
import { getActivePreviewHandle, PREVIEW_ELEMENT_ATTRIBUTE } from './activePreview';
import { getMaxScrollOffset } from '../scrollEdges';
import type {
  DraggableViewportDragScrollDirection,
  DraggableViewportDragScrollEventDetails,
  DraggableViewportMaxSpeedContext,
  DraggableViewportOverflowMargin,
} from '../../draggable/viewport/DraggableViewport';

const EDGE_THRESHOLD = 0.25;
const MAX_EDGE_SIZE = 180;
const DEFAULT_MAX_SPEED = 900;
const MUTATION_OBSERVER_OPTIONS: MutationObserverInit = {
  attributes: true,
  childList: true,
  subtree: true,
};
// Ancestors are observed without `subtree`, so preview positioning and unrelated
// descendants don't produce records on every scroll frame. `childList` still
// catches a container, or one of its ancestors, being reparented, which rebuilds
// the chain.
const CHAIN_OBSERVER_OPTIONS: MutationObserverInit = {
  attributes: true,
  childList: true,
};
// The element the engine positions, in both preview modes. The public
// `data-drag-preview` is on the consumer's element inside a custom preview instead.
const PREVIEW_SELECTOR = `[${PREVIEW_ELEMENT_ATTRIBUTE}]`;
const ELEMENT_NODE = 1;
// Speed ramps from 0 to `maxSpeed` over this many milliseconds, so a pointer
// crossing a container's edge on its way elsewhere doesn't jerk it. The ramp
// restarts each time the pointer re-enters the zone (see `engagementStart`).
// The auto-scroll docs mention it because a high `maxSpeed` starts slow for this
// long and can look broken.
const RAMP_UP_DURATION = 400;
// Caps the elapsed time a frame scrolls for, so a late frame (after a long
// consumer `onMove`, a GC pause, or a throttled tab) can't produce one oversized
// `scrollBy`.
const MAX_FRAME_DELTA_MS = 64;

/**
 * Returns a scroller's latest parameters. `scrollLoop` calls it every frame, so it
 * sees the current callbacks.
 */
type ScrollerGetter = () => ViewportParameters<any, any>;

const state = getSharedSlot<AutoScrollerState>('registerViewport', () => ({
  scrollers: new Map<HTMLElement, ScrollerGetter[]>(),
  scrollFrame: null,
  scrollMonitorGetter: null,
  lastTimestamp: 0,
  currentInput: null,
  currentReportedInput: null,
  currentSource: null,
  engagementStart: new Map<HTMLElement, number>(),
  overflowEligible: new Set<HTMLElement>(),
  sortedScrollers: null,
  viewportClosedRoots: new Map<Element, ShadowRoot>(),
  chainMutationObserver: null,
  observedChainElements: new Set<Element>(),
  idleMutationObserver: null,
  overflowCache: new WeakMap<HTMLElement, OverflowFlags>(),
  flowCache: new WeakMap<HTMLElement, ScrollFlow>(),
}));

const holds = createGetterStackRegistry<HTMLElement, ScrollerGetter>({
  entries: state.scrollers,
});

// The internal monitor that drives the scroll loop. The first viewport
// registration installs it.
const SCROLL_MONITOR_PARAMS: MonitorParameters = {
  onMoveStart: (eventDetails) => startScrollSession(eventDetails.source, eventDetails.location),
  onMove: refreshDragInput,
  onTargetChange: refreshDragInput,
  onMoveEnd: stopScrollLoop,
};

/**
 * Registers a scroll-container getter for `element`. Getters are ref-counted per
 * node, like the draggable and drop-target registries, so when two merged refs
 * share an element, the first to unmount can't remove the other's getter. The
 * last pushed getter is the active one.
 *
 * The first registration installs the scroll monitor and the last one removes
 * it. The loop only runs between a drag's start and end, and parks whenever no
 * container is engaged.
 *
 * It lives here rather than in `registrations.ts`, so `Draggable.Target` and
 * `useMonitor` don't load the auto-scroller. The type argument is the `accept`
 * value, like in every other API that takes `accept`.
 */
export function registerViewport<
  TAccept extends DraggableAccept<unknown> = DraggableKind<unknown, unknown>,
>(
  element: HTMLElement,
  getParameters: () => DragParametersWithInferredAccept<
    RegisterViewportParameters<AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>>,
    TAccept
  >,
): DragCleanupFn {
  const release = holds.hold(element, getParameters);
  invalidateScrollerOrder();
  // A registration during a drag wakes the loop. A container that appears under
  // a stationary pointer, such as a panel opening at the viewport edge, sends no
  // input, so a parked loop would stay parked until the pointer moved. The woken
  // frame's input is current, because the loop only parks after a frame that
  // read the latest input, and any newer input would have woken it.
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
    // React detaches an old node before attaching its replacement in the same
    // commit. Retiring the monitor in a microtask lets that swap keep the drag
    // input and the loop, because the replacement registers before the check.
    // The identity check is for test teardown, which can reset the monitor
    // before a mounted consumer's cleanup runs. That stale cleanup must not
    // retire the next test's monitor.
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
 * Drops the computed-style caches and wakes the loop, for a restyle that can
 * change whether a registered container scrolls or which side is its inline end.
 * The next frame pays a style resolve per container to re-read both, so
 * `handleObservedMutations` only calls this when a cached answer may be wrong.
 */
function refreshAutoScroll(): void {
  resetStyleCaches();
  wakeScrollLoop();
}

function isPreviewMutation(record: MutationRecord): boolean {
  const target = record.target;
  return target.nodeType === ELEMENT_NODE && closest(target as Element, PREVIEW_SELECTOR) !== null;
}

/**
 * Whether a batch of `childList` records added or removed an observed chain element.
 * The set lookups come first because they cost constant time, while the preview
 * check walks the record target's ancestors.
 */
function movesChainElement(records: MutationRecord[]): boolean {
  for (const record of records) {
    if (record.type !== 'childList') {
      continue;
    }
    for (const nodes of [record.addedNodes, record.removedNodes]) {
      for (const node of nodes) {
        if (state.observedChainElements.has(node as Element) && !isPreviewMutation(record)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Picks the cheapest correct response to a batch of observed mutations.
 *
 * The registered containers are observed as subtrees, and so is the whole
 * document while the loop is parked. Most records during a drag don't affect
 * scroll containers, for example a consumer's `onMove` re-render restyling a
 * drop indicator, or a virtualizer swapping rows during an auto-scroll. Calling
 * `refreshAutoScroll` for each would drop the style caches on nearly every
 * commit of a reorder drag.
 *
 * - Preview writes by the engine change neither a container's overflow nor its
 *   scroll extent, so they are ignored.
 * - Moving a registered container, or one of its ancestors, can change the
 *   nesting order and the resolved styles. The order is rebuilt and the caches
 *   are dropped.
 * - Other content changes (`childList`) and restyles outside the observed
 *   chains, such as rows appended below the fold, can give a container
 *   something to scroll. They can't change which elements scroll or in which
 *   direction, so the loop wakes and the next frame re-reads the scroll extents.
 * - An attribute change on a registered container or one of its
 *   ancestors can flip an overflow or a direction through a descendant
 *   selector. The caches are dropped.
 *
 * A restyle that reaches a container only through `:has()` or a sibling
 * combinator is missed until the next refresh. That case is rare enough to keep
 * the loop quiet.
 */
function handleObservedMutations(records: MutationRecord[]): void {
  if (state.currentSource === null) {
    return;
  }
  // Only a moved chain element resets the depth order. Ordinary content growth
  // keeps it and both style caches.
  if (movesChainElement(records)) {
    invalidateScrollerOrder();
    refreshAutoScroll();
    return;
  }
  // A preview inside a registered viewport writes its position on every frame, so
  // most batches hold a preview record. The preview check walks the record
  // target's ancestors, so it runs after the constant-time chain lookup, and only
  // until one record has shown that the batch wakes the loop.
  let wake = false;
  for (const record of records) {
    // An attribute record always targets an element.
    if (record.type === 'attributes' && state.observedChainElements.has(record.target as Element)) {
      if (!isPreviewMutation(record)) {
        refreshAutoScroll();
        return;
      }
      continue;
    }
    wake ||= !isPreviewMutation(record);
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
 * Tests one axis against its edge zones. Returns the signed engagement depth in
 * `[-1, 1]`, negative at the top or left edge, or `0` when the pointer is outside
 * both zones or the container can't scroll further that way.
 *
 * `canScroll` is a callback so a frame outside the edge zones never calls it. On
 * the horizontal axis it resolves the container's direction, which costs a
 * `getComputedStyle`. Each zone is at most a quarter of `size`, so the two never
 * overlap and the test order doesn't matter.
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
 * Calls a consumer callback and returns `fallback` if it throws. A throwing
 * scroller loses this frame instead of aborting the shared loop for every other
 * scroller.
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
 * Falls back to the default unless the speed is a finite number of at least 0. A
 * negative speed would scroll backwards and `NaN` would freeze the container,
 * with no error to diagnose either.
 */
function resolveMaxSpeed(
  registration: ViewportParameters,
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
  const body = isPageScroller ? ownerDocument(el).body : null;
  const flow = getOrCreate(state.flowCache, body ?? el, readScrollFlow);
  const reversed = !isPageScroller && flow.reversedAxis === axis;
  const negativeOrigin = flow.negativeOrigin[axis] !== reversed;
  const offset = axis === 'x' ? el.scrollLeft : el.scrollTop;
  const size = axis === 'x' ? el.clientWidth : el.clientHeight;
  const scrollSize = axis === 'x' ? el.scrollWidth : el.scrollHeight;

  // RTL and reversed flex flow can put the origin at the bottom or right.
  // Offsets then run from -max to 0 rather than from 0 to max.
  if (negativeOrigin) {
    return sign < 0
      ? Math.ceil(-offset) < getMaxScrollOffset(scrollSize, size)
      : Math.floor(-offset) > 0;
  }
  return sign < 0 ? offset > 0 : Math.ceil(offset) + size < scrollSize;
}

/**
 * Whether `<body>`'s overflow propagates to the viewport. Per CSS Overflow, it
 * does only while `<html>`'s computed overflow is `visible` on both axes. Once
 * `<html>` sets an overflow, `<body>`'s overflow applies to `<body>` itself.
 * `useScrollLock`'s `getViewportScroller` uses the same check.
 */
function bodyPropagatesToViewport(doc: Document): boolean {
  const root = readOverflowFlags(doc.documentElement);
  return !root.x && !root.y && !root.blockedX && !root.blockedY;
}

/**
 * Returns the element whose scroll properties move the viewport when `element`
 * is the page root, or `null` for a regular overflow container. That element is
 * `scrollingElement`, which is `documentElement` in standards mode and `body` in
 * quirks mode. jsdom doesn't implement `scrollingElement`, so it falls back to
 * `documentElement`.
 *
 * A `body` registration also maps to the page scroller while `<html>` keeps its
 * overflow `visible`. `body`'s overflow then propagates to the viewport, and
 * `body.scrollBy` moves nothing even when `body`'s computed overflow looks
 * scrollable. Without this mapping, a scroller on `body` would silently do
 * nothing. Once `<html>` sets its own overflow, `body` is a regular element. It
 * scrolls itself if styled as an overflow container, and is rejected like any
 * non-scrolling element otherwise.
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
    // `readPageOverflowFlags` treats `hidden` or `clip` on `body` as a scroll
    // lock on that axis.
    return scrollingElement;
  }
  return null;
}

/**
 * Cached flow properties used to determine the scroll origin.
 *
 * A regular overflow container uses its own `direction`. The page scroller
 * doesn't. HTML propagates `direction` from `<body>` to the viewport, like
 * `background`, so a `<body dir="rtl">` page scrolls RTL (`scrollLeft <= 0`)
 * while `getComputedStyle(documentElement).direction` is still `ltr`. Reading
 * `<html>` would leave the left edge dead and the right edge pushing against the
 * start.
 */
interface ScrollFlow {
  negativeOrigin: AxisFlags;
  reversedAxis: Axis | null;
}

function readScrollFlow(element: HTMLElement): ScrollFlow {
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

const BOTH_AXES: AxisFlags = { x: true, y: true };

// Overflow and direction come from `getComputedStyle`, which costs a style
// resolve per read, so they are cached per drag. Starting or stopping a drag
// resets the caches, and so does an observed restyle (see `refreshAutoScroll`).
function readOverflowFlags(element: HTMLElement): OverflowFlags {
  return getOrCreate(state.overflowCache, element, getOverflowFlags);
}

/**
 * Which axes the viewport scrolls on. The viewport scrolls by default even
 * though `<html>` is not an overflow element. So instead of asking which axes
 * overflow, like {@link readOverflowFlags}, this asks which axes are blocked.
 * `<body>` counts only while its overflow propagates to the viewport (see
 * {@link bodyPropagatesToViewport}), which keeps a scroll lock on `body` in
 * effect during a drag.
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
 * those in `doc` (see `observeChainMutations`) from the same walk. Also indexes
 * the closed shadow roots holding a viewport, which the composed walks can't
 * reach through their hosts (see `getComposedParentElement`).
 */
function sortAndObserveScrollers(doc: Document): HTMLElement[] {
  const closedRoots = new Map<Element, ShadowRoot>();
  for (const el of state.scrollers.keys()) {
    for (let root = el.getRootNode(); isShadowRoot(root); root = root.host.getRootNode()) {
      if (root.mode === 'closed') {
        closedRoots.set(root.host, root);
      }
    }
  }
  state.viewportClosedRoots = closedRoots;
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
    // Walk composed ancestors, crossing shadow boundaries, so a scroller inside
    // a shadow tree sorts deeper than its light-DOM ancestors.
    for (
      let node: Element | null = el;
      node !== null;
      node = getComposedParentElement(node, closedRoots)
    ) {
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
 * Runs one loop frame and clears the frame slot if the frame throws.
 *
 * `wakeScrollLoop` returns early while `scrollFrame !== null`. Without the
 * `catch`, a throw from a consumer `onDragScroll` or a drop-target getter would
 * leave the slot set and stop auto-scroll for the rest of the drag.
 *
 * The slot stays set while the frame runs and is cleared on the way out, when
 * the loop parks. A wake from a consumer callback mid-frame then does nothing,
 * and the frame reads the change on its way out (see the end of `runScrollFrame`).
 * Otherwise the wake would schedule a frame before this one had decided whether
 * to park.
 */
function scrollLoop(timestamp: number): void {
  try {
    runScrollFrame(timestamp);
  } catch (error) {
    state.scrollFrame = null;
    throw error;
  }
}

function runScrollFrame(timestamp: number): void {
  // Read once per frame. The loop below runs consumer callbacks (`onDragScroll`,
  // drop-target getters during a re-resolution), and any of them can end the
  // drag and null these fields mid-frame.
  const currentInput = state.currentInput;
  const currentReportedInput = state.currentReportedInput;
  const currentSource = state.currentSource;

  // A teardown that skips the terminal `onMoveEnd` (the test `reset()`, or an engine
  // error after the end was already latched) never runs `stopScrollLoop`, so the
  // loop stops itself once no drag session is published. The input and source
  // checks are only defensive, since `stopScrollLoop` nulls them along with the frame.
  if (currentInput === null || currentSource === null || dragSessionStore.getSnapshot() === null) {
    stopScrollLoop();
    return;
  }

  const rawDeltaMs = state.lastTimestamp > 0 ? timestamp - state.lastTimestamp : 16;
  const deltaMs = Math.min(rawDeltaMs, MAX_FRAME_DELTA_MS);
  state.lastTimestamp = timestamp;

  // Scrollers can live in another document, such as an iframe. The drag input's
  // client coordinates only mean something in the source's document, so testing
  // them against another frame's rect could scroll the wrong container.
  const sourceDocument = ownerDocument(currentSource.element);
  // Nested viewports get first use of an axis.
  if (state.sortedScrollers === null) {
    state.sortedScrollers = sortAndObserveScrollers(sourceDocument);
  }
  const sortedElements = state.sortedScrollers;
  // Elements engaged this frame, mapped to when their engagement began. It
  // replaces `engagementStart` at the end of the frame, so an element that skips
  // a frame restarts its ramp.
  const engaged = new Map<HTMLElement, number>();

  // Read every candidate before scrolling any, so `overflowEligible` updates even
  // when an inner viewport consumes both axes. Otherwise an outer viewport could
  // keep margin scrolling after the pointer left its margin, or miss an entry
  // while the inner one scrolled.
  const candidates: ScrollCandidate[] = [];
  for (const element of sortedElements) {
    const getParameters = holds.getActive(element);
    if (ownerDocument(element) !== sourceDocument || getParameters === undefined) {
      continue;
    }
    const registration = safeCall<ViewportParameters | null>(
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
    // `getViewportRect` excludes scrollbars, so these edge zones match the edges
    // `restrictToWindowEdges` uses.
    const rect = pageScroller
      ? getViewportRect(ownerWindow(element))
      : element.getBoundingClientRect();
    let overflowRect: ScrollCandidate['overflowRect'] = rect;
    // The page ignores `overflowMargin` and needs no entry history, because its
    // probe is the pointer clamped into the viewport (see below).
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
    candidates.push({
      element,
      registration,
      getParameters,
      pageScroller,
      rect,
      overflowRect,
      probe: null,
    });
  }
  const preferReported = reportedPointHasCandidate(candidates, currentInput, currentReportedInput);
  for (const candidate of candidates) {
    const { rect } = candidate;
    // The page scroller clamps a pointer outside the viewport back into it.
    // Element margins don't affect that.
    candidate.probe = candidate.pageScroller
      ? {
          ...currentInput,
          clientX: clamp(currentInput.clientX, rect.left, rect.right),
          clientY: clamp(currentInput.clientY, rect.top, rect.bottom),
        }
      : resolveProbePoint(
          currentInput,
          currentReportedInput,
          candidate.overflowRect,
          preferReported,
        );
  }
  const consumed: AxisFlags = { x: false, y: false };
  const overflowCandidates: ScrollCandidate[] = [];

  // Probes inside a container's rect claim axes first. Candidates whose probe is
  // only inside the margin wait for the second pass, which keeps inner-first
  // order and can only use the axes left unclaimed.
  for (const pass of [dropOccludedCandidates(candidates, sourceDocument), overflowCandidates]) {
    const overflowPass = pass === overflowCandidates;
    for (const candidate of pass) {
      // Candidates are inner-first, so once both axes are consumed no outer
      // scroller can engage. Skip their callbacks.
      if (consumed.x && consumed.y) {
        break;
      }
      const { element, rect, registration, pageScroller } = candidate;
      // A preceding callback can unregister a viewport read above.
      if (holds.getActive(element) !== candidate.getParameters) {
        continue;
      }
      const scrollTarget = pageScroller ?? element;
      const isPageScroller = pageScroller !== null;
      const candidateProbe = candidate.probe;
      if (candidateProbe === null) {
        continue;
      }
      if (!overflowPass && !isPointInRect(candidateProbe.clientX, candidateProbe.clientY, rect)) {
        overflowCandidates.push(candidate);
        continue;
      }
      // A reported probe stands in for a raw pointer outside the container, as
      // when `restrictToElement` holds the preview inside it. That point stops
      // short of the far edge by the preview's size, which can keep it out of the
      // edge zone exactly when the user pushes past the edge. On an axis the raw
      // pointer left, the edge test uses the raw pointer, which engages at full
      // depth toward it.
      let probe = candidateProbe;
      if (!isPageScroller && probe !== currentInput) {
        const { clientX, clientY } = currentInput;
        probe = remapInput(probe, {
          x: clientX < rect.left || clientX > rect.right ? clientX : probe.clientX,
          y: clientY < rect.top || clientY > rect.bottom ? clientY : probe.clientY,
        });
      }
      // Clamp into the rect so a probe beyond an edge engages at depth 1 without
      // moving the edge zones. The callbacks still receive the unclamped probe.
      const relative = {
        x: clamp(probe.clientX, rect.left, rect.right) - rect.left,
        y: clamp(probe.clientY, rect.top, rect.bottom) - rect.top,
      };
      const size = { x: rect.width, y: rect.height };

      // An `onDragScroll` handler can move either axis regardless of the native
      // overflow or extent. Those checks only limit the default scroll.
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

      // `maxSpeed` and `onDragScroll` get `probe` as `input`, not the raw pointer.
      // The engine tested this container's edge zones against `probe`, so a
      // consumer repeating the test with `input` and `element` gets the same
      // answer. The raw pointer can be outside a container the engine is
      // scrolling.
      const feedback = { input: probe, source: currentSource, element };

      const depth = { x: 0, y: 0 };
      for (const axis of AXES) {
        if (overflow[axis] && !consumed[axis]) {
          // `hasHandler` short-circuits the limit check, which costs a
          // `getComputedStyle` on the horizontal axis. A container with a
          // handler never needs it.
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

      // Resolved only once an axis engages, so a `maxSpeed` function isn't
      // called on frames where this element is idle.
      const maxSpeed = resolveMaxSpeed(registration, element, feedback);
      if (state.currentSource !== currentSource) {
        return;
      }
      // A container at zero speed never moves, so it doesn't engage. Engaging
      // would take its axes from outer containers and keep the loop running for
      // a scroll that never happens.
      if (maxSpeed === 0) {
        continue;
      }

      const engagementStart = state.engagementStart.get(element) ?? timestamp;
      engaged.set(element, engagementStart);
      const rampFactor = Math.min((timestamp - engagementStart) / RAMP_UP_DURATION, 1);
      const frameSpeed = (maxSpeed / 1000) * deltaMs * rampFactor;

      if (onDragScroll === undefined) {
        // Scroll every engaged axis. An axis only engages when it has room to
        // move. `behavior: 'instant'` stops a CSS `scroll-behavior: smooth` from
        // turning each frame's delta into its own smooth animation.
        scrollTarget.scrollBy({
          left: depth.x * frameSpeed,
          top: depth.y * frameSpeed,
          behavior: 'instant',
        });
        // Consume an axis when it engages, not when its delta is nonzero. The
        // ramp makes `frameSpeed` 0 on the first engaged frame, and an outer
        // scroller would otherwise scroll that axis for one frame.
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
        const eventDetails = createAutoScrollEventDetails(
          currentSource,
          axis === 'x' ? delta : 0,
          axis === 'y' ? delta : 0,
          axis === 'x' ? 'horizontal' : 'vertical',
          probe,
          element,
        );
        const succeeded = safeCall(
          'onDragScroll',
          element,
          () => {
            onDragScroll(eventDetails);
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
          scrollTarget.scrollBy({ left: eventDetails.x, top: eventDetails.y, behavior: 'instant' });
        }
        // `cancel()` and `consume()` mean different things. `cancel()` says the
        // handler took over the axis, for example a custom surface moving
        // itself. It keeps the element engaged and its ramp running. Without
        // that, a surface with no native overflow would drop out every frame and
        // only ever get a delta of 0. `consume()` withholds the axis from outer
        // viewports. A handler at its own bound skips it so an ancestor can
        // scroll instead.
        handled ||= eventDetails.isCanceled || eventDetails.isConsumed || shouldScroll;
        consumed[axis] ||= eventDetails.isConsumed || shouldScroll;
      }

      if (!handled) {
        // Nothing moved, so this element must not keep the loop awake.
        // Otherwise a surface at its own bound would run a frame forever under a
        // stationary pointer. Dropping it also resets its ramp, so a callback
        // that throws every frame can't build up speed and apply it all at once
        // when it recovers.
        engaged.delete(element);
      }
    }
  }

  state.engagementStart = engaged;
  if (engaged.size > 0) {
    // `scroll` events are not composed, so a scroll inside a shadow root never
    // reaches the sensor's document listener. Mark the frame dirty directly.
    notifyExternalScroll();
  } else if (state.sortedScrollers !== null) {
    // Nothing is edge-scrolling, so the next frame would compute the same
    // result. Park the loop until new input or an observed mutation wakes it
    // (see `wakeScrollLoop`). A pointer resting mid-page then costs no frames
    // and no geometry reads.
    idleScrollLoop(sourceDocument);
    return;
  }
  // Reached with nothing engaged only when a callback registered or released a
  // viewport this frame. The frame slot was still set, so that wake was dropped.
  // Schedule the next frame to pick up the change.
  requestScrollFrame(currentSource);
}

// Schedule in the source window so popout drags are not throttled with their opener.
function requestScrollFrame(source: DraggableRootRecord): void {
  state.scrollFrame ??= new WindowAnimationFrame(ownerWindow(source.element));
  state.scrollFrame.request(scrollLoop);
}

/**
 * Suspends the loop until the next drag input, and keeps the drag state
 * `wakeScrollLoop` needs to resume.
 *
 * A parked viewport can need scrolling without any input. Content changing
 * elsewhere on the page can move its edge zone under a stationary pointer, and
 * `chainMutationObserver` only covers the viewports' subtrees and ancestor
 * chains. So the whole document is observed while parked.
 *
 * The observer is created once per drag, connected on park and disconnected on
 * wake. A pointer crossing the middle of the page parks and wakes the loop every
 * frame, and creating a document-wide observer on each park would dominate the
 * cost of those frames.
 */
function idleScrollLoop(doc: Document): void {
  state.scrollFrame = null;
  const root = doc.documentElement;
  state.idleMutationObserver ??= new (ownerWindow(root).MutationObserver)(handleObservedMutations);
  state.idleMutationObserver.observe(root, MUTATION_OBSERVER_OPTIONS);
}

/**
 * Observes the registered containers, their composed ancestors, and `<html>` and
 * `<body>`, which the page scroller reads. A restyle there can change a cached
 * overflow or direction, and a move can change the ancestor chain. The style
 * caches only hold these elements, so the pointer position doesn't matter.
 *
 * Container subtrees are observed too, for content changes that can give a
 * container something to scroll. Each container is observed directly, which also
 * covers one inside a closed shadow root.
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
      state.flowCache.delete(element as HTMLElement);
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
  if (state.currentSource === null || state.scrollFrame !== null) {
    return;
  }
  state.idleMutationObserver?.disconnect();
  state.lastTimestamp = 0;
  requestScrollFrame(state.currentSource);
}

/**
 * Wakes a parked loop so the next frame reads the current parameters at the
 * current pointer position. React registrations call this after a parameter
 * change, because the loop may have parked while the element was disabled or
 * declined to scroll. The getter is read every frame, so no cache needs
 * clearing for the change to apply.
 * @internal
 */
export { wakeScrollLoop as wakeAutoScroll };

/** The style caches are `WeakMap`s, which have no `clear()`, so they are replaced. */
function resetStyleCaches(): void {
  state.overflowCache = new WeakMap();
  state.flowCache = new WeakMap();
}

function stopScrollLoop(): void {
  const scrollFrame = state.scrollFrame;
  // Reset the state before touching a window that may belong to a closed iframe
  // or popout. Firefox can throw on a dead Window proxy. The callback can't run
  // once its realm is gone, so cancelling is best effort, but the state must
  // always be reset.
  state.scrollFrame = null;
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
  state.viewportClosedRoots.clear();
  resetStyleCaches();
  scrollFrame?.cancel();
}

/**
 * Stops the loop between tests. `reset()` clears the active monitors without
 * sending `onMoveEnd`, so the scroll monitor never runs `stopScrollLoop`. An
 * engaged loop would keep calling `scrollBy` during the next test, and
 * `currentSource` would keep the previous test's detached DOM alive.
 */
export function resetForTests(): void {
  // The registry is left alone. Its entries belong to cleanups the consumer
  // still holds, and dropping them would unregister scrollers that a running
  // test still uses.
  stopScrollLoop();
  if (state.scrollMonitorGetter) {
    removeMonitor(state.scrollMonitorGetter);
    state.scrollMonitorGetter = null;
  }
}

/**
 * Returns the point to test `rect`'s edge zones against, or `null` when neither
 * point is inside `rect`.
 *
 * Each frame has two positions, the physical pointer and the point the
 * lifecycle reports after `modifiers`. The physical one is preferred. An axis
 * lock pins the reported point to the row the drag started on, so a container
 * the user pushes against would never see its edge zone entered. A clamping
 * modifier such as `restrictToElement` has the reverse problem. The physical
 * pointer leaves the container the drag is confined to, and that container
 * would drop out. So the reported point is the fallback when the raw one is
 * outside `rect`.
 *
 * When `preferReported` is set, some registered container holds the reported
 * point, and a candidate holding only the raw one is rejected. Take a drag
 * clamped into list A. The pointer pushing past A's edge lands in list B, which
 * would otherwise take the axis from A, the only container the item can still
 * drop into.
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
 * Whether the reported point differs from the physical pointer and falls inside
 * a candidate's rect or overflow margin. `resolveProbePoint` then prefers the
 * reported point. An unmodified drag has identical points and returns early.
 * The page scroller is skipped because its probe is always the raw pointer
 * clamped into the viewport.
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

function isProbeInRect(candidate: ScrollCandidate): boolean {
  const { probe, rect } = candidate;
  return probe !== null && isPointInRect(probe.clientX, probe.clientY, rect);
}

/**
 * Removes the viewports whose rect holds their probe while something else is
 * under it. The inner-first order only knows the DOM nesting, so a viewport in a
 * drawer portaled to `<body>` would lose the axis to a deeper app-shell viewport
 * behind it, and a viewport clipped by an ancestor would scroll where it isn't
 * visible.
 *
 * A candidate stays when it contains the element hit-tested at its probe. An
 * unregistered overlay can cover even a sole candidate. The page scroller and
 * candidates probed only through their margin are left to their existing passes.
 */
function dropOccludedCandidates(
  candidates: ScrollCandidate[],
  doc: Document,
): ReadonlyArray<ScrollCandidate> {
  if (
    !candidates.some((candidate) => candidate.pageScroller === null && isProbeInRect(candidate))
  ) {
    return candidates;
  }
  const closedRoots = getClosedShadowRoots();
  const preview = getActivePreviewHandle()?.getPreviewElement()?.element ?? null;
  // The composed ancestors of the element under each probe. Probes are the raw or
  // the reported input, so there are at most two.
  const hitChains = new Map<DraggableInput, Set<Element>>();
  const hovered = new Set<ScrollCandidate>();
  for (const candidate of candidates) {
    const probe = candidate.probe;
    if (probe === null || candidate.pageScroller !== null || !isProbeInRect(candidate)) {
      continue;
    }
    const hitChain = getOrCreate(hitChains, probe, () => {
      const chain = new Set<Element>();
      let node = elementFromPointIgnoring(doc, probe.clientX, probe.clientY, preview, closedRoots);
      for (; node !== null; node = getComposedParentElement(node, closedRoots)) {
        chain.add(node);
      }
      return chain;
    });
    if (hitChain.has(candidate.element)) {
      hovered.add(candidate);
    }
  }
  // Preserve the geometric fallback when the environment cannot hit-test.
  if (Array.from(hitChains.values()).every((chain) => chain.size === 0)) {
    return candidates;
  }
  return candidates.filter(
    (candidate) =>
      candidate.pageScroller !== null || hovered.has(candidate) || !isProbeInRect(candidate),
  );
}

/**
 * The closed shadow roots the hit-test descends into and the composed walks
 * cross: those holding a drop target and those holding a viewport.
 */
function getClosedShadowRoots(): ReadonlyMap<Element, ShadowRoot> {
  const targetRoots = getDropTargetShadowRootsByHost();
  const viewportRoots = state.viewportClosedRoots;
  if (viewportRoots.size === 0) {
    return targetRoots;
  }
  if (targetRoots.size === 0) {
    return viewportRoots;
  }
  return new Map([...targetRoots, ...viewportRoots]);
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
  registration: ViewportParameters;
  pageScroller: HTMLElement | null;
  rect: ScrollRect;
  overflowRect: Pick<ScrollRect, 'top' | 'right' | 'bottom' | 'left'>;
  /** The point the edge zones are tested against (see `resolveProbePoint`). */
  probe: DraggableInput | null;
}

// Stores fresh drag input and wakes the loop. Shared by `onMove` and
// `onTargetChange`.
function refreshDragInput(eventDetails: MoveEventDetails | DropTargetChangeEventDetails): void {
  if (state.currentSource === null) {
    return;
  }
  setDragInput(eventDetails.location, eventDetails.source);
  wakeScrollLoop();
}

function setDragInput(location: DraggableLocationHistory, source: DraggableRootRecord): void {
  // During a pointer drag, the physical pointer before `modifiers`. The edge
  // tests choose between it and the reported point (see `resolveProbePoint`).
  state.currentInput = getRawActivePointerInput() ?? location.current.input;
  state.currentReportedInput = location.current.input;
  state.currentSource = source;
}

function startScrollSession(source: DraggableRootRecord, location: DraggableLocationHistory): void {
  // A drag that ended abnormally while the loop was parked still references its
  // input and source, because the loop only stops itself when a frame runs.
  // Clear that state before this drag starts.
  stopScrollLoop();
  setDragInput(location, source);
  wakeScrollLoop();
}

function createAutoScrollEventDetails(
  source: DraggableRootRecord,
  x: number,
  y: number,
  direction: DraggableViewportDragScrollDirection,
  input: DraggableInput,
  element: HTMLElement,
): DraggableViewportDragScrollEventDetails {
  const details: DraggableViewportDragScrollEventDetails = createChangeEventDetails(
    REASONS.none,
    undefined,
    undefined,
    {
      source,
      x,
      y,
      direction,
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
  /**
   * The loop's frame in the source window. Set from a wake until the loop parks
   * or stops, including while the frame runs (see `scrollLoop`).
   */
  scrollFrame: WindowAnimationFrame | null;
  scrollMonitorGetter: (() => MonitorParameters) | null;
  lastTimestamp: number;
  /** The physical pointer; see {@link resolveProbePoint}. */
  currentInput: DraggableInput | null;
  /** The `modifiers`-constrained point the lifecycle reported; see {@link resolveProbePoint}. */
  currentReportedInput: DraggableInput | null;
  /**
   * Set from the scroll monitor's `onMoveStart` until `stopScrollLoop`. Unlike
   * `scrollFrame`, it stays set while the loop is parked (see `idleScrollLoop`).
   */
  currentSource: DraggableRootRecord | null;
  /** When the pointer first entered each element's edge zone. */
  engagementStart: Map<HTMLElement, number>;
  /**
   * Viewports the drag entered and hasn't left beyond their margin since. Only
   * these scroll from `overflowMargin`.
   */
  overflowEligible: Set<HTMLElement>;
  /**
   * Cached inner-first ordering of the registered viewports, or `null` when stale.
   * Rebuilding it also rebuilds the observed chains (see `sortAndObserveScrollers`).
   */
  sortedScrollers: HTMLElement[] | null;
  /** Closed shadow roots holding a viewport, by host. Rebuilt with `sortedScrollers`. */
  viewportClosedRoots: Map<Element, ShadowRoot>;
  /**
   * Watches the registered viewports' subtrees and their ancestor chains in the
   * source document during a drag.
   */
  chainMutationObserver: MutationObserver | null;
  /** The elements `chainMutationObserver` watches (see `observeChainMutations`). */
  observedChainElements: Set<Element>;
  /** Watches for content/style changes only while the frame loop is parked. */
  idleMutationObserver: MutationObserver | null;
  /** Per-drag per-axis overflow cache (see `readOverflowFlags`). */
  overflowCache: WeakMap<HTMLElement, OverflowFlags>;
  /** Per-drag scroll flow cache (see `readScrollFlow`). */
  flowCache: WeakMap<HTMLElement, ScrollFlow>;
}

export interface ViewportParameters<TSourcePayload = unknown, TDragData = unknown> {
  /**
   * How far outside the container a drag can continue auto-scrolling, in CSS pixels.
   * The drag must enter the container first, and enter it again after moving beyond
   * the margin or while the container is disabled.
   * A number applies to every edge. An object sets each physical edge separately.
   * Omitted, negative, and non-finite edge values are treated as `0`.
   * Beyond an edge, scrolling runs as if at the very edge, without restarting the speed ramp.
   * Viewports containing the drag position take priority over outside margins.
   * Does not change drop targets, layout, or page scrolling.
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
   * scrolling on the same axis. Don't call it at a bound the element can't move
   * past, so an ancestor can scroll instead.
   */
  onDragScroll?:
    | ((eventDetails: DraggableViewportDragScrollEventDetails<TSourcePayload, TDragData>) => void)
    | undefined;
}
