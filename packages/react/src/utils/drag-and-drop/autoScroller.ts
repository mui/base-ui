import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { warn } from '@base-ui/utils/warn';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import type {
  DragAccept,
  DragSource,
  DragInput,
  DragEventMap,
  DragLocationHistory,
} from '../../types/drag';
import { matchesAccept } from './dragKind';
import {
  monitorRegistry,
  engageMonitorIfDragging,
  type RegisterMonitorParameters,
} from './monitor';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import {
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
} from './synthetic/syntheticSensor';
import { dragSessionStore } from './dragSessionStore';
import { getMaxScrollOffset } from '../scrollEdges';

const EDGE_THRESHOLD = 0.25;
const MAX_EDGE_SIZE = 180;
const DEFAULT_MAX_SPEED = 900;
// Ramp the speed in over the first engaged frames rather than starting at
// `maxSpeed`: a pointer that merely clips a container's edge on its way past
// would otherwise lurch it, and the ramp restarts whenever the pointer leaves and
// re-enters the zone (see `engagementStart`). Documented on the auto-scroll page,
// because a high `maxSpeed` reads as a crawl for this long and looks broken.
const RAMP_UP_DURATION = 400;
// Cap the per-frame delta so a stalled/paused rAF (long consumer `onDrag`, GC
// pause, throttled tab) can't produce one oversized `scrollBy` on resume.
const MAX_FRAME_DELTA_MS = 64;

/** A getter for a scroller's latest parameters, so `scrollLoop` reads the freshest callbacks each frame. */
type ScrollerGetter<TSourceData = any> = () => RegisterAutoScrollerParameters<TSourceData>;

/**
 * What an inferred container scrolls with: no `accept` filter, both axes, the
 * default speed. A container the engine found itself was never configured, so
 * there is nothing else it could use — and every knob in
 * {@link RegisterAutoScrollerParameters} exists to *change* one of these answers,
 * which is what registering the element explicitly does.
 */
export const EMPTY_AUTO_SCROLLER_PARAMETERS: RegisterAutoScrollerParameters = {};

const state = getSharedSlot<AutoScrollerState>('registerAutoScroller', () => ({
  scrollers: new Map<HTMLElement, ScrollerGetter[]>(),
  scrollLoopRaf: null,
  scrollWindow: null,
  enabled: false,
  scrollMonitorGetter: null,
  lastTimestamp: 0,
  currentInput: null,
  currentReportedInput: null,
  currentSource: null,
  currentDropTargetElement: null,
  engagementStart: new Map<HTMLElement, number>(),
  inferredScrollers: new Set<HTMLElement>(),
  chainAnchor: null,
  chainAnchorParent: null,
  chainSourceParent: null,
  sortedScrollers: null,
  engagedThisFrame: new Set<HTMLElement>(),
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
  invalidateScrollerOrder();
  // Registering mid-drag has to buy a frame: the loop parks itself whenever
  // nothing is engaged, and a container revealed under an already-stationary
  // pointer (a panel opening at the viewport edge) produces no input of its own
  // to wake it with — so without this it would sit still until the user moved.
  // The input the woken frame reads is not stale: the loop only parks after a
  // frame that saw the latest input, and any input since would have woken it.
  // A keyboard drag is filtered out by `enabled` inside `wakeScrollLoop`.
  wakeScrollLoop();
  return () => {
    release();
    invalidateScrollerOrder();
  };
}

/**
 * Re-evaluate live auto-scroll parameters for the current pointer position.
 * React registrations call this after a parameter change because the loop may
 * have parked while the element was disabled or dynamically declined scrolling.
 * @internal
 */
export function refreshAutoScroll(): void {
  if (!state.enabled) {
    return;
  }
  // A same-node class/style change can alter whether it scrolls and which side
  // is its inline end without changing the inferred ancestor chain. Force the
  // next frame to re-read both computed-style facts and rebuild that chain.
  state.overflowCache = new WeakMap();
  state.rtlCache = new WeakMap();
  state.chainAnchor = null;
  invalidateScrollerOrder();
  wakeScrollLoop();
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
  callbackName: 'canScroll' | 'allowedAxis' | 'maxSpeed' | 'getParameters' | 'applyScroll',
  element: Element,
  call: () => T,
  fallback: T,
): T {
  return safeCallConsumer('auto-scroller', callbackName, element, call, fallback);
}

/**
 * A speed that isn't a non-negative finite number falls back to the default: a
 * negative one would scroll the container backwards and a `NaN` would freeze it,
 * neither with anything to diagnose.
 */
function resolveMaxSpeed(
  registration: RegisterAutoScrollerParameters,
  element: HTMLElement,
  feedback: DragAutoScrollFrameContext,
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

/**
 * Which axes an `applyScroll` return value claims to have moved.
 *
 * `null`, `false` and `'none'` all mean "I moved nothing", so the answer a
 * bounded surface reaches for — `return camera.atBound ? false : undefined` —
 * releases the axes to the outer container instead of claiming them. Anything
 * else unrecognized still reads as both, so a callback that incidentally returns
 * something (a `setState` result, a truthy flag) isn't a trap.
 */
function normalizeMovedAxis(
  applied: DragAutoScrollAxis | 'none' | false | null | void,
): DragAutoScrollAxis | null {
  if (applied === null || applied === false || applied === 'none') {
    return null;
  }
  return applied === 'vertical' || applied === 'horizontal' ? applied : 'all';
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
// Distance already scrolled away from the (right-hand) home edge in RTL, always
// ≥ 0 (RTL `scrollLeft` is ≤ 0). Only the RTL branches need this; the LTR
// branches read `el.scrollLeft` directly.
function getScrollFromStart(el: Element): number {
  return -el.scrollLeft;
}

// `Math.ceil`/`Math.floor` guard against Chrome 115+ fractional scroll units.
function canScrollLeft(el: Element, rtl: boolean): boolean {
  // Leftward in RTL means scrolling back toward the (right-hand) home edge;
  // in LTR it means scrolling away from the (left-hand) home edge.
  return rtl
    ? Math.ceil(getScrollFromStart(el)) < getMaxScrollOffset(el.scrollWidth, el.clientWidth)
    : el.scrollLeft > 0;
}

function canScrollRight(el: Element, rtl: boolean): boolean {
  return rtl
    ? Math.floor(getScrollFromStart(el)) > 0
    : Math.ceil(el.scrollLeft) + el.clientWidth < el.scrollWidth;
}

/**
 * Resolve a registration on the document's root to the element whose scroll
 * properties move the viewport (`scrollingElement`: `documentElement` in
 * standards mode, `body` in quirks mode), or `null` for a regular overflow
 * container. A default-styled `body` also maps to the page scroller in
 * standards mode — it is not an overflow container of its own, so a scroller
 * registered on it would otherwise be silently inert; a `body` the page styles
 * as a real overflow container (`overflow: auto`) keeps scrolling itself.
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
  if (element === doc.body) {
    // A `body` the page styles as a real overflow container scrolls itself;
    // otherwise it stands in for the viewport. A `body` set to `hidden`/`clip`
    // is not an overflow container either, so it maps to the page scroller —
    // where `readPageOverflowFlags` then reads that same value as "the page has
    // been stopped on this axis".
    const bodyOverflow = readOverflowFlags(element);
    if (!bodyOverflow.x && !bodyOverflow.y) {
      return scrollingElement;
    }
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
function directionSourceFor(scrollTarget: HTMLElement): HTMLElement {
  const doc = ownerDocument(scrollTarget);
  const isPageScroller =
    scrollTarget === (doc.scrollingElement ?? doc.documentElement) ||
    scrollTarget === doc.documentElement;
  if (!isPageScroller) {
    return scrollTarget;
  }
  // Only when `body` carries a direction of its own: an unstyled `body` inherits
  // the root's, so reading either gives the same answer.
  const body = doc.body as HTMLElement | null;
  return body ?? scrollTarget;
}

function resolveRtl(scrollTarget: HTMLElement): boolean {
  return readCached(state.rtlCache, directionSourceFor(scrollTarget), isRtlElement);
}

// The viewport in client coordinates. `getViewportSize` is the engine's single
// viewport definition (scrollbar-excluding, with the detached-document/jsdom
// fallback), so the edge zones here agree with the keyboard cursor clamp and
// `restrictToWindowEdges` on where the edge is.
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
 * page been stopped on. `<html>` and `<body>` are both consulted because the
 * viewport's overflow propagates from whichever of them sets it, which is what
 * keeps a scroll lock holding during a drag.
 */
function readPageOverflowFlags(element: HTMLElement): OverflowFlags {
  const doc = ownerDocument(element);
  const root = readOverflowFlags(doc.documentElement);
  const body = doc.body === null ? null : readOverflowFlags(doc.body);
  return {
    x: !root.blockedX && !body?.blockedX,
    y: !root.blockedY && !body?.blockedY,
    blockedX: false,
    blockedY: false,
  };
}

/**
 * The scroll containers around `anchor`, innermost first: every composed
 * ancestor (piercing shadow boundaries, like the depth sort) whose computed
 * overflow makes it one, plus the document root — which `resolvePageScroller`
 * turns into the page scroller, so the viewport is simply where the walk ends
 * rather than a case of its own.
 *
 * Inference decides only which containers are *candidates*. Whether one engages
 * is still the loop's business: an `overflow: auto` wrapper the pointer is
 * nowhere near, or one with nothing left to scroll, is rejected on the same rect
 * and scroll-extent tests an explicitly registered container faces, so the false
 * positives this walk collects eliminate themselves.
 */
function collectInferredScrollers(...anchors: (Element | null)[]): Set<HTMLElement> {
  const scrollers = new Set<HTMLElement>();
  const firstAnchor = anchors.find((anchor) => anchor != null);
  if (firstAnchor == null) {
    return scrollers;
  }
  const root = ownerDocument(firstAnchor).documentElement;

  for (const anchor of anchors) {
    // A drop-target record types its element as `Element`, though every
    // registration path takes an `HTMLElement`; the reads below are the same for
    // anything the walk crosses either way (an `SVGElement` ancestor has no
    // scroll extent, so it never engages).
    let node = anchor as HTMLElement | null;
    while (node) {
      if (node !== root) {
        const overflow = readOverflowFlags(node);
        if (overflow.x || overflow.y) {
          scrollers.add(node);
        }
      }
      node = getComposedParentElement(node) as HTMLElement | null;
    }
  }

  // Added unconditionally rather than when a walk reaches it, because a
  // *detached* anchor — a virtualizer recycling the row under the pointer, a
  // live reorder — has no path to the root at all, and letting the walk decide
  // would leave the set empty and stop even the page from scrolling. Whether it
  // *may* scroll is still the loop's business (see `readPageOverflowFlags`), and
  // default `<html>` styling is not an overflow element yet the viewport still
  // scrolls, so the walk could never qualify it on overflow either.
  scrollers.add(root);
  return scrollers;
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
 * `scrollLoopRaf !== null`, so a throw out of the body — a consumer `canScroll`,
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
  // callbacks (`canScroll`, the drop-target getters behind a re-resolution), any
  // of which can re-entrantly end the drag and null these — and every read after
  // that point would then dereference `null`.
  const currentInput = state.currentInput;
  const currentReportedInput = state.currentReportedInput;
  const currentSource = state.currentSource;

  // A drag can end abnormally — a consumer callback throwing tears down the
  // lifecycle via `clearActiveMonitors()` without ever dispatching `onDragEnd` to
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

  // Where the candidate walk starts.
  //
  // Over a drop target: the element the frame hit-tested under the pointer, not
  // the target itself. A scroll container nested *within* a target is not an
  // ancestor of it — a kanban column is the drop target and its list is the
  // scroller — so walking from the target would skip the one container the
  // pointer is in. The hit element is inside both, so its walk reaches both.
  //
  // Over no drop target: still the hit element. Drop targets resolve by walking
  // up to the nearest `[data-drop-target]`, so the stack is empty for every
  // pointer position over container padding or the gap between two rows — and
  // falling straight through to the source there would stop the scroll in those
  // gaps, mid-gesture, for no reason the user can see. The source is the last
  // resort only.
  //
  // The source's own chain is unioned in regardless, which is what keeps
  // scroll-to-reveal working: the containers that have to move to bring an
  // off-screen target into view are the ones around the dragged element, and
  // over empty space nothing else would collect them.
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
  if (
    chainAnchor !== state.chainAnchor ||
    chainAnchorParent !== state.chainAnchorParent ||
    sourceParent !== state.chainSourceParent
  ) {
    state.chainAnchor = chainAnchor;
    state.chainAnchorParent = chainAnchorParent;
    state.chainSourceParent = sourceParent;
    // Drop the per-drag overflow cache before the fresh walk: entering a target
    // can restyle a container from `overflow: hidden` to scrollable (a collapsed
    // section auto-expanding from `onDragEnter`), and a stale entry would keep it
    // out of the chain for the rest of the drag. A chain change is the only
    // moment such a restyle matters, and it is rare enough that the re-resolve
    // costs nothing per frame.
    state.overflowCache = new WeakMap();
    state.inferredScrollers = collectInferredScrollers(chainAnchor, currentSource.element);
    invalidateScrollerOrder();
  }

  // Cache the inner-first ordering across frames; it only depends on DOM
  // nesting, invalidated when the registry or the inferred chain changes.
  // Recomputing it (a walk to the document root per scroller) every frame is
  // wasted work.
  //
  // Always sorted, never taken on faith from insertion order: the set is a union
  // of two walks (the pointer's chain and the source's) plus the document root
  // plus any explicit registration, and only a single walk's own run is
  // inner-first. An explicit registration can sit anywhere in the tree —
  // including on an element with no scrollable overflow, which is the
  // `applyScroll` case inference can never reach — so the depth sort is what
  // actually establishes the order the loop relies on to let an inner container
  // consume an axis before its ancestors.
  if (state.sortedScrollers === null) {
    const candidates = new Set(state.inferredScrollers);
    for (const element of state.scrollers.keys()) {
      candidates.add(element);
    }
    state.sortedScrollers = sortByDepthDesc([...candidates]);
  }
  const sortedElements = state.sortedScrollers;
  const engagedThisFrame = state.engagedThisFrame;
  engagedThisFrame.clear();
  // Scrollers can be registered from another document (e.g. an iframe), but the
  // drag input's client coordinates are only meaningful in the source's
  // document — edge-testing a foreign scroller's frame-local rect against them
  // could scroll the wrong document's container on a coincidental overlap.
  const sourceDocument = ownerDocument(currentSource.element);

  for (const element of sortedElements) {
    // Inner-first ordering: once both axes are consumed no remaining (outer)
    // scroller can engage, so skip their rect reads and consumer callbacks.
    if (verticalConsumed && horizontalConsumed) {
      break;
    }
    if (ownerDocument(element) !== sourceDocument) {
      continue;
    }
    // A registration on the document's root scrolls the page itself;
    // `scrollTarget` is the element whose scroll properties drive it.
    const pageScroller = resolvePageScroller(element);
    const scrollTarget = pageScroller ?? element;

    // Geometry first, before anything consumer-supplied runs: on a dense board
    // most registered scrollers are nowhere near the pointer, and rejecting them
    // on a single rect read keeps the per-frame cost off the consumer callbacks
    // entirely. The page scroller's bounding rect spans the whole document (its
    // top goes negative once the page is scrolled), so its edge zones are
    // measured against the layout viewport instead.
    const rect = pageScroller ? getViewportRect(element) : element.getBoundingClientRect();
    const probe = resolveProbePoint(currentInput, currentReportedInput, rect);
    if (probe === null) {
      continue;
    }
    const relativeX = probe.clientX - rect.left;
    const relativeY = probe.clientY - rect.top;

    // Read the freshest parameters each frame so `canScroll`/`allowedAxis` can
    // change dynamically during a drag; the last-registered getter wins. An
    // element the walk found and the consumer also registered is therefore
    // configured by the registration — explicit parameters beat the inferred
    // defaults for the same element, which is what makes `disabled` an opt-out
    // of inference rather than a contradiction of it.
    const getParameters = holds.getActive(element);
    // No registration and not inferred means the entry went away mid-loop: a
    // consumer callback earlier in this frame unregistered a scroller that
    // appears later in the cached order.
    if (getParameters === undefined && !state.inferredScrollers.has(element)) {
      continue;
    }
    const registration =
      getParameters === undefined
        ? EMPTY_AUTO_SCROLLER_PARAMETERS
        : safeCall<RegisterAutoScrollerParameters | null>(
            'getParameters',
            element,
            getParameters,
            null,
          );
    // `== null`: the `safeCall` fallback is `null`, but a consumer getter that
    // returns nothing hands back `undefined` — which would otherwise reach the
    // property reads below.
    if (registration == null) {
      continue;
    }
    // An explicit opt-out, checked before the overflow gate below so it also
    // silences the "registered on a non-scrolling element" warning: an element
    // the consumer disabled is not one they need advice about.
    if (registration.disabled) {
      continue;
    }
    // Cheap kind filter first, like a drop target's `accept`: a drag this
    // scroller doesn't react to must neither consume its axes nor run its
    // per-frame callbacks.
    if (!matchesAccept(registration.accept, currentSource)) {
      continue;
    }

    // A delegating element is only an edge-detection viewport, so neither gate
    // that describes a scroll container applies: not the overflow style below,
    // nor the scroll extent the limit checks read.
    const applyScroll = registration.applyScroll;
    const delegated = applyScroll !== undefined;

    // Which axes this element may scroll at all. The page asks the inverted
    // question (scrollable unless something stopped it), and a delegating
    // surface answers for itself.
    let overflow: OverflowFlags;
    if (delegated) {
      overflow = BOTH_AXES;
    } else if (pageScroller) {
      overflow = readPageOverflowFlags(element);
    } else {
      overflow = readOverflowFlags(element);
    }
    if (!overflow.x && !overflow.y) {
      if (process.env.NODE_ENV !== 'production') {
        if (getParameters !== undefined && !pageScroller) {
          warn(
            'Base UI: an auto-scroll container was registered on an element that does not scroll, ' +
              'so its parameters (including `disabled`) have no effect. ' +
              'Register the element whose own `overflow` clips the scrollable content, ' +
              'or pass `applyScroll` if the surface moves its content some other way. ' +
              'See https://base-ui.com/react/components/drag-auto-scroll.',
          );
        }
      }
      continue;
    }

    // `probe`, not the raw pointer: this is the point the engine just decided this
    // container's edge zones from, so a consumer re-deriving the same test
    // (`canScroll: ({ input, element }) => isPointInRect(input…, element…)`)
    // reaches the same answer. Reporting the raw pointer would tell a consumer the
    // drag is outside a container the engine is busy scrolling.
    const feedback = { input: probe, source: currentSource, element };

    if (
      registration.canScroll &&
      !safeCall('canScroll', element, () => registration.canScroll!(feedback), false)
    ) {
      continue;
    }

    // A throwing `allowedAxis` falls back to `null`, skipping the scroller this frame.
    const allowedAxisParam = registration.allowedAxis;
    const allowedAxis =
      typeof allowedAxisParam === 'function'
        ? safeCall('allowedAxis', element, () => allowedAxisParam(feedback), null)
        : (allowedAxisParam ?? 'all');
    if (allowedAxis === null) {
      continue;
    }

    let scrollX = 0;
    let scrollY = 0;

    if (overflow.y && !verticalConsumed && (allowedAxis === 'all' || allowedAxis === 'vertical')) {
      scrollY = getEdgeScrollDepth(
        relativeY,
        rect.height,
        () => delegated || canScrollUp(scrollTarget),
        () => delegated || canScrollDown(scrollTarget),
      );
    }

    if (
      overflow.x &&
      !horizontalConsumed &&
      (allowedAxis === 'all' || allowedAxis === 'horizontal')
    ) {
      // The RTL resolution stays behind the `delegated` short-circuit: it only
      // picks which limit check runs, so delegating must not pay its
      // `getComputedStyle`.
      scrollX = getEdgeScrollDepth(
        relativeX,
        rect.width,
        () => delegated || canScrollLeft(scrollTarget, resolveRtl(scrollTarget)),
        () => delegated || canScrollRight(scrollTarget, resolveRtl(scrollTarget)),
      );
    }

    if (scrollX !== 0 || scrollY !== 0) {
      // Resolved here rather than beside `allowedAxis`, so a callback form costs
      // nothing on the frames this element doesn't engage.
      const maxSpeed = resolveMaxSpeed(registration, element, feedback);
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
      // ones it had room on; a delegating consumer reports its own bounds back.
      let movedAxis: DragAutoScrollAxis | null = 'all';
      if (applyScroll === undefined) {
        // `behavior: 'instant'` so a CSS `scroll-behavior: smooth` on the container
        // can't turn each per-frame delta into a competing smooth animation.
        scrollTarget.scrollBy({ left: finalScrollX, top: finalScrollY, behavior: 'instant' });
      } else {
        // A throw falls back to `null`, the same answer as "I moved on neither
        // axis": the surface demonstrably didn't move, so an outer container
        // should get the axes.
        const applied = safeCall<DragAutoScrollAxis | 'none' | false | null | void>(
          'applyScroll',
          element,
          () => applyScroll({ ...feedback, x: finalScrollX, y: finalScrollY }),
          null,
        );
        movedAxis = normalizeMovedAxis(applied);
      }

      // Consume the axis on engagement intent, not on the applied delta: on the
      // first engaged frame `frameSpeed` is 0 (ramp-up), so keying off
      // `finalScroll*` would leave the axis unconsumed and let an outer scroller
      // also scroll it for that frame.
      if (scrollY !== 0 && (movedAxis === 'all' || movedAxis === 'vertical')) {
        verticalConsumed = true;
      }
      if (scrollX !== 0 && (movedAxis === 'all' || movedAxis === 'horizontal')) {
        horizontalConsumed = true;
      }

      if (movedAxis === null) {
        // Nothing moved, so this element must not hold the loop awake: a surface
        // parked at its own bound would otherwise burn a frame forever under a
        // stationary pointer. Dropping it also lets the end-of-frame sweep reset
        // its ramp, so a callback that throws every frame can't accumulate speed
        // and then apply it all at once when it recovers.
        engagedThisFrame.delete(element);
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
  return AnimationFrame.request(scrollLoop, state.scrollWindow);
}

/**
 * Suspend the loop until the next drag input, without dropping the drag state
 * `wakeScrollLoop` needs to resume. The frame clock resets so the first frame
 * after the pause isn't billed for the whole idle interval.
 */
function idleScrollLoop(): void {
  state.scrollLoopRaf = null;
  state.lastTimestamp = 0;
}

/** Resume a parked loop when fresh input may have moved the pointer into an edge zone. */
function wakeScrollLoop(): void {
  if (!state.enabled || state.scrollLoopRaf !== null) {
    return;
  }
  state.lastTimestamp = 0;
  state.scrollLoopRaf = requestScrollFrame();
}

function startScrollLoop(): void {
  state.enabled = true;
  if (state.scrollLoopRaf !== null) {
    return;
  }
  state.lastTimestamp = 0;
  state.engagementStart.clear();
  clearInferredScrollers();
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
  clearInferredScrollers();
  resetStyleCaches();
  if (scrollLoopRaf !== null && scrollWindow !== null) {
    AnimationFrame.cancel(scrollLoopRaf, scrollWindow);
  }
}

/**
 * Drop the inferred chain and the anchor it was walked from, so the next frame
 * rebuilds both, and re-sort the union without the chain's entries.
 */
function clearInferredScrollers(): void {
  state.inferredScrollers.clear();
  state.chainAnchor = null;
  state.chainAnchorParent = null;
  state.chainSourceParent = null;
  invalidateScrollerOrder();
}

/**
 * Tear the loop down between tests. `reset()` clears the active monitors without
 * dispatching `onDragEnd`, so the scroll monitor never runs `stopScrollLoop` and
 * a still-engaged loop would keep calling `scrollBy` into the next test's
 * document — while `currentSource` pinned the previous test's detached DOM.
 */
export function resetForTests(): void {
  // The registry is deliberately left alone: those entries are owned by the
  // cleanups the consumer still holds, and dropping them here would unregister a
  // scroller out from under a live test.
  stopScrollLoop();
}

/**
 * The physical pointer, kept alongside the `modifiers`-constrained point the
 * lifecycle reports so {@link resolveProbePoint} can pick between them per
 * container. A modifier pins the reported point where the item may go, which need
 * not be anywhere near the container the user is pushing against — an axis lock
 * holds it on the row the drag started from. Falls back to the reported input for
 * a drag the synthetic sensor doesn't own.
 */
function resolveScrollInput(reported: DragInput): DragInput {
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
 */
function resolveProbePoint(
  raw: DragInput,
  reported: DragInput | null,
  rect: { left: number; top: number; right: number; bottom: number },
): DragInput | null {
  if (isPointInRect(raw.clientX, raw.clientY, rect)) {
    return raw;
  }
  if (reported !== null && isPointInRect(reported.clientX, reported.clientY, rect)) {
    return reported;
  }
  return null;
}

// Re-seed the loop from any fresh drag input; shared by `onDrag` and
// `onDropTargetChange`, which need identical handling.
function refreshDragInput({
  location,
  source,
}: DragEventMap['onDrag'] | DragEventMap['onDropTargetChange']): void {
  if (!state.enabled) {
    return;
  }
  state.currentInput = resolveScrollInput(location.current.input);
  state.currentReportedInput = location.current.input;
  state.currentSource = source;
  state.currentDropTargetElement = getInnermostDropTargetElement(location);
  wakeScrollLoop();
}

/**
 * The innermost drop target under the pointer — the deepest place the drag can
 * land. The candidate walk prefers the hit element over it (see `chainAnchor`),
 * and falls back to this when no hit element is available. The stack is published
 * innermost-first, so this is simply its head.
 */
function getInnermostDropTargetElement(location: DragLocationHistory): Element | null {
  return location.current.dropTargets[0]?.element ?? null;
}

// The engine-internal monitor that drives the scroll loop, registered from the
// first draggable (see `ensureScrollMonitor`).
const SCROLL_MONITOR_PARAMS: RegisterMonitorParameters = {
  onDragStart: ({ location, source }) => {
    // A drag that ended abnormally with the loop *parked* leaves `enabled` set
    // and the last input/source referenced: the loop's own no-session
    // self-termination only runs when a frame fires. Clear that state before
    // this drag decides anything — otherwise a keyboard drag skips the guard
    // below yet inherits `enabled`, and its `onDrag` events wake the loop.
    stopScrollLoop();
    // Keyboard drags scroll via `scrollIntoView` (one step per key); the
    // edge-based loop would fight that — the virtual cursor parks in the edge
    // zone and the loop runs away — so skip auto-scroll for keyboard mode.
    if (dragSessionStore.getSnapshot()?.mode === 'keyboard') {
      return;
    }
    state.currentInput = resolveScrollInput(location.current.input);
    state.currentReportedInput = location.current.input;
    state.currentSource = source;
    state.currentDropTargetElement = getInnermostDropTargetElement(location);
    startScrollLoop();
  },
  onDrag: refreshDragInput,
  onDropTargetChange: refreshDragInput,
  onDragEnd: () => {
    stopScrollLoop();
  },
};

/**
 * Register the engine scroll-monitor (idempotent), which arms auto-scroll for
 * every drag that follows.
 *
 * Called when a draggable registers, not only when a scroller does: the
 * containers are inferred from the DOM, so "nothing registered" no longer means
 * "nothing to scroll" and there is no registry whose emptiness could retire the
 * monitor. It stays for the page's lifetime, which costs one entry in the
 * monitor registry — the loop itself only runs between a drag's start and its
 * end, and parks itself whenever no container is engaged.
 */
export function ensureScrollMonitor(): void {
  if (state.scrollMonitorGetter) {
    return;
  }
  const getMonitor = () => SCROLL_MONITOR_PARAMS;
  state.scrollMonitorGetter = getMonitor;
  monitorRegistry.add(getMonitor);
  // A scroller mounting mid-drag activates the monitor for the in-progress drag.
  engageMonitorIfDragging(getMonitor);
}

/** Which axis (or axes) an auto-scroll container may scroll on. */
export type DragAutoScrollAxis = 'vertical' | 'horizontal' | 'all';

/** Live drag context passed to the per-frame callbacks. */
export interface DragAutoScrollFrameContext<TSourceData = unknown> {
  /**
   * The position this container's edge zones were measured from, which is the
   * physical pointer whenever it is inside the container. A `modifiers` clamp can
   * hold the reported drag point inside a container the physical pointer has
   * already left — and the reverse — so the engine probes both and reports
   * whichever one it used here.
   */
  input: DragInput;
  source: DragSource<TSourceData>;
  element: HTMLElement;
}

/** The frame's scroll delta, passed to `applyScroll` with the live drag context. */
export interface DragAutoScrollApplyContext<
  TSourceData = unknown,
> extends DragAutoScrollFrameContext<TSourceData> {
  /**
   * How far to move horizontally this frame, in CSS pixels, with `scrollBy`
   * semantics: a positive value moves the view right, so the content slides left
   * under the pointer. Already ramped and scaled by the frame's elapsed time.
   * `0` when the horizontal axis isn't engaged this frame.
   */
  x: number;
  /** How far to move vertically this frame, in CSS pixels. A positive value moves the view down. */
  y: number;
}

/**
 * Applies one frame's scroll delta in place of the engine.
 *
 * Return which axes moved, so a container further out takes over the ones this
 * surface is at the bound of. Return `false`, `'none'` or `null` when the
 * surface moved on neither. Returning nothing claims every axis the frame
 * engaged.
 */
export type DragAutoScrollApply<TSourceData = unknown> = (
  parameters: DragAutoScrollApplyContext<TSourceData>,
) => DragAutoScrollAxis | 'none' | false | null | void;

interface AutoScrollerState {
  /** Each scroll container maps to the stack of getters held against it (merged refs). */
  scrollers: Map<HTMLElement, ScrollerGetter[]>;
  scrollLoopRaf: number | null;
  scrollWindow: Window | null;
  /**
   * Auto-scroll is armed for the current drag — set by the scroll monitor's
   * `onDragStart`, and so the one place keyboard drags are filtered out: every
   * other entry point (`wakeScrollLoop`, `refreshDragInput`) reads this rather
   * than re-testing the mode. Distinct from `scrollLoopRaf !== null`, which is
   * false while the loop is merely parked between edge engagements (see
   * `idleScrollLoop`).
   */
  enabled: boolean;
  scrollMonitorGetter: (() => RegisterMonitorParameters) | null;
  lastTimestamp: number;
  currentInput: DragInput | null;
  /**
   * The `modifiers`-constrained point the lifecycle reported, kept alongside the
   * physical one in {@link currentInput}. A clamping modifier separates the two,
   * and the candidate walk is anchored at *this* point (`getActiveHitElement`
   * hit-tests the modified position), so the edge tests need it to stay in the
   * same coordinate space as the chain they are testing (see {@link resolveProbePoint}).
   */
  currentReportedInput: DragInput | null;
  currentSource: DragSource | null;
  /** The innermost drop target under the pointer; a fallback anchor for the candidate walk. */
  currentDropTargetElement: Element | null;
  /** When the pointer first entered each element's edge zone. */
  engagementStart: Map<HTMLElement, number>;
  /**
   * The scroll containers the ancestor walk found for the current drag. They
   * scroll with the default parameters unless the consumer also registered them,
   * and an element that is only here (never registered) is skipped once the walk
   * moves on.
   */
  inferredScrollers: Set<HTMLElement>;
  /** The element {@link inferredScrollers} was walked from; `null` when there is no chain. */
  chainAnchor: Element | null;
  /**
   * {@link chainAnchor}'s composed parent when the chain was walked. A live
   * reorder can move the anchor's *own node* into a different container without
   * remounting it (React with stable keys does `insertBefore`), which leaves the
   * anchor's identity unchanged while every scroller above it changes.
   */
  chainAnchorParent: Element | null;
  chainSourceParent: Element | null;
  /** Cached inner-first ordering of the inferred chain and the registry; `null` when stale. */
  sortedScrollers: HTMLElement[] | null;
  /** Scratch set of scrollers engaged in the current frame, reused across frames. */
  engagedThisFrame: Set<HTMLElement>;
  /** Per-drag per-axis overflow cache (see `readCached`). */
  overflowCache: WeakMap<HTMLElement, OverflowFlags>;
  /** Per-drag `isRtl` cache (see `readCached`). */
  rtlCache: WeakMap<HTMLElement, boolean>;
}

export interface RegisterAutoScrollerParameters<TSourceData = unknown> {
  /**
   * The kinds of drag source this scroller reacts to: one kind, or an array of them.
   * Omit it to scroll for every drag.
   *
   * A drag whose kind isn't accepted never engages this element at all, not even as
   * the scroll container it may otherwise be, so this is also how a container opts out
   * of scrolling for some drags but not others. The payload the per-frame callbacks see
   * is typed from it.
   */
  accept?: DragAccept<TSourceData> | undefined;
  /**
   * Whether the element should never auto-scroll, including as the scroll container
   * the engine would otherwise find on its own. The axes it declines pass to the
   * container further out.
   *
   * Read every frame, and the registration is kept — so toggling it mid-drag
   * suspends and resumes scrolling without the container having to re-join the drag.
   *
   * For a decision that depends on the drag, use `canScroll` instead.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Return `false` to disable scrolling on this element for the current drag.
   * Evaluated every frame, so scrolling can be suspended dynamically.
   */
  canScroll?: ((parameters: DragAutoScrollFrameContext<TSourceData>) => boolean) | undefined;
  /**
   * Which axis to scroll on. Accepts a static value or a callback evaluated every frame.
   * @default 'all'
   */
  allowedAxis?:
    | DragAutoScrollAxis
    | ((parameters: DragAutoScrollFrameContext<TSourceData>) => DragAutoScrollAxis)
    | undefined;
  /**
   * How fast the container moves at the deepest point of an edge zone, in CSS
   * pixels per second. Accepts a static value or a callback evaluated every
   * frame the container is engaged.
   *
   * The default suits a container a few hundred pixels across: raise it for one
   * holding much more content, lower it for a short list. A speed of `0` stops
   * this container scrolling and lets the one outside it take over, the same as
   * a `canScroll` returning `false`.
   * @default 900
   */
  maxSpeed?: number | ((parameters: DragAutoScrollFrameContext<TSourceData>) => number) | undefined;
  /**
   * Applies the frame's scroll delta yourself, for a surface the engine can't
   * scroll, such as a canvas moved by a CSS `transform`. The element then needs no
   * scrollable overflow, and its scroll extent is never read.
   *
   * Move the surface synchronously, before returning: the engine re-resolves the
   * drop target under the pointer on the frame after this call.
   */
  applyScroll?: DragAutoScrollApply<TSourceData> | undefined;
}
