import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
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
  PREVIEW_ELEMENT_ATTRIBUTE,
  onceCleanup,
  safeCallConsumer,
  elementFromPointIgnoring,
  getComposedParentElement,
  getOrCreate,
} from './utils';
import { getClosedShadowRootsByHost } from './dropTarget';
import { getActiveSession } from './core/dragSession';
import type { DragSession } from './core/dragSession';
import {
  AXES,
  PAGE_SCROLLER,
  canScrollToward,
  forgetStyles,
  getEdgeScrollDepth,
  isProbeInRect,
  resetStyleCaches,
  resolveProbes,
  resolveScrollTarget,
  scrollTargetBy,
} from './autoScrollTargets';
import type { AxisFlags, ScrollTarget } from './autoScrollTargets';
import type {
  DraggableViewportDragScrollDirection,
  DraggableViewportDragScrollEventDetails,
  DraggableViewportMaxSpeedContext,
  DraggableViewportOverflowMargin,
} from '../../draggable/viewport/DraggableViewport';

const DEFAULT_MAX_SPEED = 900;
const MUTATION_OBSERVER_OPTIONS: MutationObserverInit = {
  attributes: true,
  childList: true,
  subtree: true,
};
// Ancestors skip `subtree`, so preview writes and unrelated descendants don't
// produce records every frame. `childList` still catches a chain element moving.
const CHAIN_OBSERVER_OPTIONS: MutationObserverInit = {
  attributes: true,
  childList: true,
};
// The element the engine positions, in both preview modes. The public
// `data-drag-preview` is on the consumer's element inside a custom preview instead.
const PREVIEW_SELECTOR = `[${PREVIEW_ELEMENT_ATTRIBUTE}]`;
const ELEMENT_NODE = 1;
// Speed ramps from 0 to `maxSpeed` over this many milliseconds, so a pointer
// crossing an edge on its way elsewhere doesn't jerk the container. The ramp
// restarts on each zone re-entry (see `engagementStart`). The auto-scroll docs
// state this duration.
const RAMP_UP_DURATION = 400;
// Caps the elapsed time a frame scrolls for, so a late frame, such as in a
// throttled tab, can't produce one oversized `scrollBy`.
const MAX_FRAME_DELTA_MS = 64;

/** Returns a scroller's parameters. Called every frame, so it sees the latest callbacks. */
type ScrollerGetter = () => ViewportParameters<any, any>;

const state = getSharedSlot<AutoScrollerState>('registerViewport', () => ({
  scrollers: new Map<HTMLElement, ScrollerGetter[]>(),
  scrollFrame: null,
  scrollMonitorGetter: null,
  lastTimestamp: 0,
  currentInput: null,
  currentReportedInput: null,
  session: null,
  releaseSession: null,
  engagementStart: new Map<HTMLElement, number>(),
  overflowEligible: new Set<HTMLElement>(),
  sortedScrollers: null,
  viewportClosedRoots: new Map<Element, ShadowRoot>(),
  chainMutationObserver: null,
  observedChainElements: new Set<Element>(),
  idleMutationObserver: null,
}));

const holds = createGetterStackRegistry<HTMLElement, ScrollerGetter>({
  entries: state.scrollers,
});

// The internal monitor that drives the scroll loop (see `registerViewport`).
const SCROLL_MONITOR_PARAMS: MonitorParameters = {
  onMoveStart: (eventDetails) => {
    const session = getActiveSession();
    if (session !== null) {
      startScrollSession(session, eventDetails.location);
    }
  },
  onMove: refreshDragInput,
  onTargetChange: refreshDragInput,
  onMoveEnd: stopScrollLoop,
};

/**
 * Registers a scroll-container getter for `element` (see `createGetterStackRegistry`).
 * The first registration installs the scroll monitor and the last removes it. It lives
 * here, apart from the target and monitor registrations, so `Draggable.Target` and
 * `useMonitor` don't load the auto-scroller.
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
  // A container appearing under a stationary pointer sends no input, so a parked
  // loop would stay parked. The woken frame's input is current: the loop only parks
  // after reading the latest input, and newer input would have woken it.
  wakeScrollLoop();
  if (state.scrollMonitorGetter === null) {
    const getMonitor = () => SCROLL_MONITOR_PARAMS;
    state.scrollMonitorGetter = getMonitor;
    // A scroller mounting mid-drag joins the drag in progress. A session still
    // starting gets the monitor's `onMoveStart` instead.
    addMonitor(getMonitor);
    const session = getActiveSession();
    if (session !== null && session.phase !== 'starting') {
      startScrollSession(session, session.getLocation());
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
    // commit. Retiring in a microtask lets the replacement register first, so the
    // swap keeps the drag input and the loop. The identity check stops a cleanup
    // that outlived a test reset from retiring the next test's monitor.
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
 * Drops the style caches and wakes the loop, after a restyle that can change a
 * container's overflow or scroll origin. The next frame re-resolves styles for
 * every container, so call it only when a cached answer may be wrong.
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
 * The constant-time set lookup runs before the preview check, which walks ancestors.
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
 * Picks the cheapest correct response to a batch of mutations. Most records, such as an
 * `onMove` restyling a drop indicator, don't affect scroll containers, and dropping the
 * style caches for each would re-resolve styles on nearly every commit.
 *
 * - Engine preview writes are ignored.
 * - A moved container or ancestor rebuilds the order and drops the caches.
 * - An attribute change on either drops the caches, since a descendant selector can restyle it.
 * - Anything else, such as rows appended below the fold, only wakes the loop.
 *
 * A restyle reaching a container only through `:has()` or a sibling combinator is missed
 * until the next refresh.
 */
function handleObservedMutations(records: MutationRecord[]): void {
  if (state.session === null) {
    return;
  }
  if (movesChainElement(records)) {
    invalidateScrollerOrder();
    refreshAutoScroll();
    return;
  }
  // Most batches hold a preview record, so the ancestor walk in `isPreviewMutation`
  // stops once a record has woken the loop.
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
 * The next frame rebuilds the inner-first order and re-observes the chains (see
 * `sortAndObserveScrollers`).
 */
function invalidateScrollerOrder(): void {
  state.sortedScrollers = null;
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
 * Falls back to the default unless the speed is finite and non-negative. A
 * negative speed would scroll backwards and `NaN` would freeze the container,
 * both silently.
 */
function resolveMaxSpeed(
  registration: ViewportParameters,
  element: HTMLElement,
  input: DraggableInput,
  source: DraggableRootRecord,
): number {
  const { maxSpeed } = registration;
  if (maxSpeed === undefined) {
    return DEFAULT_MAX_SPEED;
  }
  const resolved =
    typeof maxSpeed === 'function'
      ? safeCall('maxSpeed', element, () => maxSpeed({ input, source, element }), DEFAULT_MAX_SPEED)
      : maxSpeed;
  return Number.isFinite(resolved) && resolved >= 0 ? resolved : DEFAULT_MAX_SPEED;
}

const BOTH_AXES: AxisFlags = { x: true, y: true };

/**
 * Orders the registered viewports inner-first and, from the same walk, observes
 * the ancestor chains of those in `doc` (see `observeChainMutations`). Also
 * indexes the closed shadow roots holding a viewport, which the composed walks
 * can't reach through their hosts.
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
    // The composed walk sorts a scroller inside a shadow tree deeper than its
    // light-DOM ancestors.
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
 * Runs one loop frame. `scrollFrame` stays set while it runs, so a wake from a
 * consumer callback is a no-op instead of scheduling a frame before this one
 * decides whether to park (see the end of `runScrollFrame`). The `catch` clears
 * the slot, because `wakeScrollLoop` returns early while it is set, and a throw
 * would otherwise stop auto-scroll for the rest of the drag.
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
  // Read once, because consumer callbacks below can end the drag and null these
  // fields mid-frame.
  const currentInput = state.currentInput;
  const currentReportedInput = state.currentReportedInput;
  const session = state.session;

  // Defensive. Every session end runs `stopScrollLoop`, which nulls these along
  // with the frame (see `startScrollSession`).
  if (currentInput === null || session === null) {
    stopScrollLoop();
    return;
  }
  const currentSource = session.source;

  const rawDeltaMs = state.lastTimestamp > 0 ? timestamp - state.lastTimestamp : 16;
  const deltaMs = Math.min(rawDeltaMs, MAX_FRAME_DELTA_MS);
  state.lastTimestamp = timestamp;

  // The input's client coordinates only mean something in the source's document,
  // so scrollers in another document, such as an iframe, are skipped.
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

  // Read every target before scrolling any, so `overflowEligible` updates even
  // when an inner viewport consumes both axes. Otherwise an outer viewport could
  // keep margin scrolling after the pointer left, or miss an entry.
  const targets: ScrollTarget[] = [];
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
    if (state.session !== session) {
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
    targets.push(
      resolveScrollTarget(
        element,
        getParameters,
        registration,
        currentInput,
        currentReportedInput,
        state.overflowEligible,
      ),
    );
  }
  resolveProbes(targets, currentInput, currentReportedInput);
  const consumed: AxisFlags = { x: false, y: false };
  const overflowTargets: ScrollTarget[] = [];

  // Probes inside a container's rect claim axes first. Targets whose probe is
  // only inside the margin wait for the second pass, which keeps inner-first
  // order and can only use the axes left unclaimed.
  for (const pass of [dropOccludedTargets(targets, sourceDocument), overflowTargets]) {
    const overflowPass = pass === overflowTargets;
    for (const target of pass) {
      // Targets are inner-first, so once both axes are consumed no outer
      // scroller can engage. Skip their callbacks.
      if (consumed.x && consumed.y) {
        break;
      }
      const { element, registration, input } = target;
      // A preceding callback can unregister a viewport read above.
      if (holds.getActive(element) !== target.getParameters || input === null) {
        continue;
      }
      if (!overflowPass && !isProbeInRect(target)) {
        overflowTargets.push(target);
        continue;
      }

      // An `onDragScroll` handler can move either axis regardless of the native
      // overflow or extent. Those checks only limit the default scroll.
      const onDragScroll = registration.onDragScroll;
      const nativeOverflow = target.adapter.getOverflow(element);
      const hasHandler = onDragScroll !== undefined;
      const overflow = hasHandler ? BOTH_AXES : nativeOverflow;
      if (!overflow.x && !overflow.y) {
        if (process.env.NODE_ENV !== 'production') {
          if (target.adapter !== PAGE_SCROLLER) {
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

      const depth = { x: 0, y: 0 };
      for (const axis of AXES) {
        if (overflow[axis] && !consumed[axis]) {
          depth[axis] = getEdgeScrollDepth(target, input, axis, hasHandler);
        }
      }
      if (depth.x === 0 && depth.y === 0) {
        continue;
      }

      // Resolved only once an axis engages, so a `maxSpeed` function isn't
      // called on frames where this element is idle. It and `onDragScroll` get
      // the point the edges were tested against, not the raw pointer, so a
      // consumer repeating the edge test with `input` and `element` agrees.
      const maxSpeed = resolveMaxSpeed(registration, element, input, currentSource);
      if (state.session !== session) {
        return;
      }
      // A container at zero speed doesn't engage, or it would take its axes from
      // outer containers and keep the loop running for a scroll that never happens.
      if (maxSpeed === 0) {
        continue;
      }

      const engagementStart = state.engagementStart.get(element) ?? timestamp;
      engaged.set(element, engagementStart);
      const rampFactor = Math.min((timestamp - engagementStart) / RAMP_UP_DURATION, 1);
      const frameSpeed = (maxSpeed / 1000) * deltaMs * rampFactor;

      if (onDragScroll === undefined) {
        scrollTargetBy(target, depth.x * frameSpeed, depth.y * frameSpeed);
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
          input,
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
        if (state.session !== session) {
          return;
        }
        // A failed callback must not move this viewport or block an ancestor.
        if (!succeeded) {
          continue;
        }
        const shouldScroll =
          !eventDetails.isCanceled &&
          nativeOverflow[axis] &&
          canScrollToward(target, axis, depth[axis]);
        if (shouldScroll) {
          scrollTargetBy(target, eventDetails.x, eventDetails.y);
        }
        // `cancel()` means the handler took over the axis, such as a surface
        // moving itself. It keeps the element engaged and its ramp running, or a
        // surface with no native overflow would drop out every frame and only get
        // a delta of 0. `consume()` withholds the axis from outer viewports.
        handled ||= eventDetails.isCanceled || eventDetails.isConsumed || shouldScroll;
        consumed[axis] ||= eventDetails.isConsumed || shouldScroll;
      }

      if (!handled) {
        // Nothing moved, so this element must not keep the loop awake, or a
        // surface at its bound would run frames forever under a stationary
        // pointer. This also resets its ramp, so a callback that throws every
        // frame can't build up speed and apply it all at once when it recovers.
        engaged.delete(element);
      }
    }
  }

  state.engagementStart = engaged;
  if (engaged.size > 0) {
    // `scroll` events are not composed, so a scroll inside a shadow root never
    // reaches the sensor's document listener. Mark the frame dirty directly.
    session.notifyScroll();
  } else if (state.sortedScrollers !== null) {
    // Nothing is edge-scrolling, so the next frame would compute the same
    // result. Park until new input or an observed mutation wakes the loop.
    idleScrollLoop(sourceDocument);
    return;
  }
  // Reached with nothing engaged only when a callback registered or released a
  // viewport this frame, whose wake was dropped because the slot was still set.
  requestScrollFrame(currentSource);
}

// Schedule in the source window so popout drags are not throttled with their opener.
function requestScrollFrame(source: DraggableRootRecord): void {
  state.scrollFrame ??= new WindowAnimationFrame(ownerWindow(source.element));
  state.scrollFrame.request(scrollLoop);
}

/**
 * Parks the loop until `wakeScrollLoop`. Content outside the viewports' subtrees and
 * ancestors can still move an edge zone under a stationary pointer, so the whole document
 * is observed while parked. The observer lives for the drag, since a pointer crossing
 * mid-page parks and wakes the loop every frame.
 */
function idleScrollLoop(doc: Document): void {
  state.scrollFrame = null;
  const root = doc.documentElement;
  state.idleMutationObserver ??= new (ownerWindow(root).MutationObserver)(handleObservedMutations);
  state.idleMutationObserver.observe(root, MUTATION_OBSERVER_OPTIONS);
}

/**
 * Observes the registered containers, their composed ancestors, and `<html>` and `<body>`,
 * where a restyle can change a cached overflow or direction and a move can change the chain.
 * Container subtrees are observed too, for content that changes scroll extents. Observing
 * each container directly also reaches one inside a closed shadow root.
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
      forgetStyles(element as HTMLElement);
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
  if (state.session === null || state.scrollFrame !== null) {
    return;
  }
  state.idleMutationObserver?.disconnect();
  state.lastTimestamp = 0;
  requestScrollFrame(state.session.source);
}

/**
 * Called by React registrations and `manager.refresh` after a parameter change,
 * because the loop may have parked while the element was disabled or declined to
 * scroll. The getter is read every frame, so no cache needs clearing.
 * @internal
 */
export { wakeScrollLoop as wakeAutoScroll };

function stopScrollLoop(): void {
  const scrollFrame = state.scrollFrame;
  // Reset the state before cancelling, which touches a window that may belong to
  // a closed iframe or popout. Firefox can throw on a dead Window proxy, and the
  // callback can't run once its realm is gone anyway.
  state.scrollFrame = null;
  state.currentInput = null;
  state.currentReportedInput = null;
  state.session = null;
  const releaseSession = state.releaseSession;
  state.releaseSession = null;
  releaseSession?.();
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
 * Stops the loop and retires the scroll monitor between tests, so a test that
 * failed mid-drag can't leave either behind for the next one.
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
 * Drops viewports whose probe is in their rect but hit-tests to an element outside them.
 * The inner-first order only knows DOM nesting, so a drawer portaled to `<body>` would
 * lose the axis to a deeper viewport behind it. A sole target is tested too, since an
 * unregistered overlay can cover it. The page and margin-only targets are kept.
 */
function dropOccludedTargets(targets: ScrollTarget[], doc: Document): ReadonlyArray<ScrollTarget> {
  if (!targets.some(needsHitTest)) {
    return targets;
  }
  const closedRoots = getClosedShadowRoots();
  const preview = state.session?.preview?.getPreviewElement()?.element ?? null;
  // The composed ancestors of the element under each probe. There are at most two
  // probes, the raw and the reported input.
  const hitChains = new Map<DraggableInput, Set<Element>>();
  const hovered = new Set<ScrollTarget>();
  for (const target of targets) {
    const probe = target.probe;
    if (probe === null || !needsHitTest(target)) {
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
    if (hitChain.has(target.element)) {
      hovered.add(target);
    }
  }
  // Preserve the geometric fallback when the environment cannot hit-test.
  if (Array.from(hitChains.values()).every((chain) => chain.size === 0)) {
    return targets;
  }
  return targets.filter((target) => hovered.has(target) || !needsHitTest(target));
}

/** The page is always under the pointer, since its probe is clamped into the viewport. */
function needsHitTest(target: ScrollTarget): boolean {
  return target.adapter !== PAGE_SCROLLER && isProbeInRect(target);
}

/**
 * The closed shadow roots the hit-test descends into and the composed walks
 * cross: those holding a drop target and those holding a viewport.
 */
function getClosedShadowRoots(): ReadonlyMap<Element, ShadowRoot> {
  const targetRoots = getClosedShadowRootsByHost();
  const viewportRoots = state.viewportClosedRoots;
  if (viewportRoots.size === 0) {
    return targetRoots;
  }
  if (targetRoots.size === 0) {
    return viewportRoots;
  }
  return new Map([...targetRoots, ...viewportRoots]);
}

function refreshDragInput(eventDetails: MoveEventDetails | DropTargetChangeEventDetails): void {
  const session = state.session;
  if (session === null) {
    return;
  }
  setDragInput(session, eventDetails.location);
  wakeScrollLoop();
}

function setDragInput(session: DragSession, location: DraggableLocationHistory): void {
  const reported = location.current.input;
  // During a pointer drag, the physical pointer before `modifiers` (see `resolveProbes`).
  state.currentInput = session.getRawInput() ?? reported;
  state.currentReportedInput = reported;
}

function startScrollSession(session: DragSession, location: DraggableLocationHistory): void {
  stopScrollLoop();
  state.session = session;
  const win = ownerWindow(session.source.element);
  state.releaseSession = mergeCleanups(
    // Stop with the session, including an end without `onMoveEnd`, such as a test
    // reset or an engine error after the end was latched.
    session.onEnd(stopScrollLoop),
    // Neither changes the DOM: a resize can restyle a viewport through a media query,
    // and a loaded image or iframe can grow a scroll extent under a still pointer.
    addEventListener(win, 'resize', refreshAutoScroll),
    addEventListener(win.document, 'load', wakeScrollLoop, { capture: true }),
  );
  setDragInput(session, location);
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
  /** The physical pointer; see `resolveProbes`. */
  currentInput: DraggableInput | null;
  /** The `modifiers`-constrained point the lifecycle reported; see `resolveProbes`. */
  currentReportedInput: DraggableInput | null;
  /**
   * The drag the loop scrolls for, from the scroll monitor's `onMoveStart` until
   * `stopScrollLoop`. Unlike `scrollFrame`, it stays set while the loop is parked
   * (see `idleScrollLoop`).
   */
  session: DragSession | null;
  /** Unsubscribes `stopScrollLoop` from the end of `session` and its window listeners. */
  releaseSession: DragCleanupFn | null;
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
  /** Watches the viewports' subtrees and ancestor chains during a drag. */
  chainMutationObserver: MutationObserver | null;
  /** The elements `chainMutationObserver` watches (see `observeChainMutations`). */
  observedChainElements: Set<Element>;
  /** Watches the whole document while the loop is parked (see `idleScrollLoop`). */
  idleMutationObserver: MutationObserver | null;
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
