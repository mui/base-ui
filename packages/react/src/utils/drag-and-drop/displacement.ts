/**
 * Displacement tracking for elements a drag pushes aside.
 *
 * A reorder moves an element's layout position between two commits; CSS has no
 * memory of the old position, so this module owns the FLIP bookkeeping and
 * nothing else: it measures, and it publishes what it measured as two CSS
 * variables plus a pair of state attributes. The motion itself belongs to the
 * consumer's stylesheet:
 *
 * ```css
 * .Item[data-displacing][data-starting-style] {
 *   translate: var(--drag-displacement-x) var(--drag-displacement-y);
 * }
 * .Item[data-displacing]:not([data-starting-style]) {
 *   transition: translate 200ms ease;
 * }
 * ```
 *
 * The `:not` gate is load-bearing: while `data-starting-style` is present, the
 * after-change style carries no transition, so writing a fresh delta mid-flight
 * cancels the running transition and applies instantly (per the CSS transitions
 * spec), which is exactly what an interrupted reorder needs.
 *
 * Measurement reads `offsetLeft`/`offsetTop`: the layout position, blind to
 * every transform and every scroll position. The play itself moves elements
 * with `translate`, so reading layout is what keeps a sweep from mistaking the
 * running animation, the consumer's own transforms, or an auto-scroll step for
 * displacement. The trade: movement caused purely by an offset parent moving
 * is not displacement here.
 *
 * Displacement is measured only inside a window derived from the drag session
 * store: open while a drag is live, held one animation frame past its end so
 * the drop-commit and cancel-revert renders still animate. Nothing animates
 * outside the window, so unrelated layout changes (a resize, a filter) never
 * move anything.
 */

import { ownerWindow } from '@base-ui/utils/owner';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { dragSessionStore, dragSourceStore } from './dragSessionStore';
import type { DragCleanupFn } from '../../types/drag';

const DISPLACING_ATTR = 'data-displacing';
const STARTING_STYLE_ATTR = 'data-starting-style';
const VAR_X = '--drag-displacement-x';
const VAR_Y = '--drag-displacement-y';
const PREVIEW_ATTR = 'data-drag-preview';

/** Layout jitter below this many pixels is noise, not displacement. */
const EPSILON_PX = 0.5;

interface TrackedState {
  /** Layout baseline from the last sweep (or the window opening). */
  left: number;
  top: number;
  /**
   * The offset parent the baseline was measured against. Offsets from two
   * different parents aren't comparable, so a parent change reads as "start a
   * fresh baseline", never as movement.
   */
  parent: Element | null;
  /**
   * Whether `left`/`top` hold a usable baseline. `false` while the element is
   * hidden, disconnected, or not yet measured inside a window; becoming
   * measurable again adopts the current position instead of playing, so
   * nothing ever flies in from a stale or meaningless origin.
   */
  hasBaseline: boolean;
  /** The play generation; invalidates finish watchers a newer play supersedes. */
  token: number;
  /**
   * Set while the owning effect's teardown is pending; cleared when the same
   * element is adopted right back (see `trackDisplacedElement`).
   */
  untracking: boolean;
}

interface Measurement {
  left: number;
  top: number;
  parent: Element | null;
  /** `false` for a hidden element: a zero-sized box has no usable position. */
  valid: boolean;
}

// Module-level rather than a shared slot, deliberately: this registry serves the
// components of this bundle copy only, and the cross-copy state it reads (the
// drag session) is already shared through the store.
const tracked = new Map<HTMLElement, TrackedState>();
const resizeListeners = new Map<Window, DragCleanupFn>();
let storeUnsubscribe: DragCleanupFn | null = null;
let windowOpen = false;
let graceFrame: AnimationFrame | null = null;
/** Monotonic across all plays, so a remounted record can never reuse a token. */
let playCounter = 0;
// One sweep per commit: the first tracked element's layout effect sweeps the
// whole registry, so a memoized sibling that moved without re-rendering is
// still measured. Cleared in a microtask, after every effect of the commit ran.
let sweepLatched = false;
// A second sweep is only owed when a *second commit* lands in the same task
// (flushSync, a store commit chasing a React commit): its movement the first
// sweep could not have seen. Same-commit siblings also request while latched,
// so requests are keyed by element: each element requests once per commit, and
// only a repeat requester proves a second commit. The trailing sweep runs in
// the clearing microtask, still before paint.
let trailingSweepRequested = false;
const latchRequesters = new Set<HTMLElement>();

function measure(element: HTMLElement): Measurement {
  return {
    left: element.offsetLeft,
    top: element.offsetTop,
    parent: element.offsetParent,
    valid: element.offsetWidth > 0 || element.offsetHeight > 0,
  };
}

function baseline(element: HTMLElement, state: TrackedState): void {
  const measured = measure(element);
  if (measured.valid) {
    state.left = measured.left;
    state.top = measured.top;
    state.parent = measured.parent;
    state.hasBaseline = true;
  } else {
    state.hasBaseline = false;
  }
}

function baselineAll(): void {
  for (const [element, state] of tracked) {
    if (element.isConnected) {
      baseline(element, state);
    } else {
      state.hasBaseline = false;
    }
  }
}

/**
 * A resize reflows every offset without displacing anything, so the next sweep
 * would misread the shift as displacement; re-baseline instead. Scrolling
 * needs no counterpart: offsets don't move when content scrolls.
 */
function handleResize(): void {
  if (windowOpen) {
    baselineAll();
  }
}

function attachResizeListener(win: Window): void {
  if (!resizeListeners.has(win)) {
    resizeListeners.set(win, addEventListener(win, 'resize', handleResize, { passive: true }));
  }
}

function detachResizeListeners(): void {
  for (const off of resizeListeners.values()) {
    off();
  }
  resizeListeners.clear();
}

function openWindow(): void {
  windowOpen = true;
  // The drag-start frame is already measure-heavy (the preview clone); one read
  // per tracked element rides along so the first reorder diffs against the
  // pre-drag layout rather than against whenever the elements last rendered.
  baselineAll();
  for (const element of tracked.keys()) {
    attachResizeListener(ownerWindow(element));
  }
}

function closeWindow(): void {
  windowOpen = false;
  detachResizeListeners();
}

function handleSessionChange(): void {
  const live = dragSourceStore.getSnapshot() !== null;
  if (live) {
    graceFrame?.cancel();
    graceFrame = null;
    if (!windowOpen) {
      openWindow();
    }
    return;
  }
  if (!windowOpen) {
    return;
  }
  // Held open one frame: the drop-commit and cancel-revert renders land after
  // the store nulls but before this frame fires, so they still animate. A
  // commit deferred past that (a transition, an `await`) misses the window.
  // The frame is re-derived per request: a cached one could sit on a throttled
  // or closed popout window and never deliver the close.
  const first = tracked.keys().next().value as HTMLElement | undefined;
  graceFrame?.cancel();
  graceFrame = new AnimationFrame(first ? ownerWindow(first) : window);
  graceFrame.request(closeWindow);
}

function cleanupPlay(element: HTMLElement): void {
  element.removeAttribute(STARTING_STYLE_ATTR);
  element.removeAttribute(DISPLACING_ATTR);
  element.style.removeProperty(VAR_X);
  element.style.removeProperty(VAR_Y);
}

/**
 * Wait for whatever the removal of `data-starting-style` started (the
 * consumer's transition, or an animation keyed on the attribute), then remove
 * the play state; with no motion declared it comes off on the same frame.
 * Mirrors `useAnimationsFinished` (a hook, unusable from this module-level
 * registry): `getAnimations()` so multi-property transitions and `@keyframes`
 * both count, plus the same test-env kill switch. Looping animations never
 * finish and would pin the play state on forever, so they don't count.
 */
function watchFinish(element: HTMLElement, token: number): void {
  const disabled = (globalThis as { BASE_UI_ANIMATIONS_DISABLED?: boolean | undefined })
    .BASE_UI_ANIMATIONS_DISABLED;
  const animations = disabled
    ? []
    : (element.getAnimations?.() ?? []).filter(
        (animation) => animation.effect?.getTiming().iterations !== Infinity,
      );
  if (animations.length === 0) {
    cleanupPlay(element);
    return;
  }
  Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
    if (tracked.get(element)?.token === token) {
      cleanupPlay(element);
    }
  });
}

interface Play {
  element: HTMLElement;
  state: TrackedState;
  dx: number;
  dy: number;
  token: number;
}

/**
 * Run one FLIP pass over the whole registry: diff every tracked element against
 * its baseline and arm the play state on the ones that moved. Called from the
 * first tracked component's layout effect in a commit, after React applied every
 * DOM mutation of that commit and before paint.
 */
function sweep(): void {
  const session = dragSessionStore.getSnapshot();
  const plays: Play[] = [];

  // Pass 1 only reads; pass 2 only writes. Interleaving them would invalidate
  // style between iterations and force one layout pass per displaced element
  // instead of one per sweep.
  for (const [element, state] of tracked) {
    if (!element.isConnected) {
      state.hasBaseline = false;
      continue;
    }
    const measured = measure(element);
    if (!measured.valid) {
      // Hidden (a `display: none` source, a filtered row): a zero-sized box
      // reads at 0,0, and a baseline there would fly the element in from the
      // origin when it reappears.
      state.hasBaseline = false;
      continue;
    }
    const comparable = state.hasBaseline && state.parent === measured.parent;
    const dx = state.left - measured.left;
    const dy = state.top - measured.top;
    state.left = measured.left;
    state.top = measured.top;
    state.parent = measured.parent;
    state.hasBaseline = true;
    if (!comparable) {
      continue;
    }
    if (Math.abs(dx) < EPSILON_PX && Math.abs(dy) < EPSILON_PX) {
      continue;
    }
    // The dragged source moves because the drag moves it; animating it against
    // its own gesture would fight the preview. Once the session is over (the
    // grace frame), the source is displaced like any neighbour, which is what
    // animates a cancel putting it back.
    if (session !== null && session.source.element === element) {
      continue;
    }
    // A tracked element rendered inside a custom drag preview must not play:
    // the preview already follows the pointer.
    if (element.closest(`[${PREVIEW_ATTR}]`)) {
      continue;
    }
    playCounter += 1;
    plays.push({ element, state, dx, dy, token: playCounter });
  }

  if (plays.length === 0) {
    return;
  }
  // The release frame comes from each element's own window: a popout's rows
  // released through the opener's rAF would sit frozen at their starting style
  // whenever the opener is throttled.
  const perWindow = new Map<Window, Play[]>();
  for (const play of plays) {
    play.state.token = play.token;
    play.element.style.setProperty(VAR_X, `${play.dx}px`);
    play.element.style.setProperty(VAR_Y, `${play.dy}px`);
    play.element.setAttribute(DISPLACING_ATTR, '');
    play.element.setAttribute(STARTING_STYLE_ATTR, '');
    const win = ownerWindow(play.element);
    const group = perWindow.get(win);
    if (group) {
      group.push(play);
    } else {
      perWindow.set(win, [play]);
    }
  }
  // Force the starting state into the computed style before the removal frame.
  // The frame requested below can run in the *current* frame's rAF phase,
  // before this state was ever computed, and a transition only triggers against
  // a computed before-change style; without this read the play silently does
  // nothing. Style calculation is scoped to a document, so each window's batch
  // needs one read; flushing the opener cannot establish an iframe's start state.
  for (const group of perWindow.values()) {
    void group[0].element.offsetHeight;
  }
  // One frame later the starting style comes off and the consumer's transition
  // carries each element from the published delta back to its stylesheet rest
  // state. One frame per window serves every element it played.
  for (const [win, group] of perWindow) {
    AnimationFrame.request(() => {
      for (const play of group) {
        // A newer sweep can retarget the same element before this frame runs.
        // Its starting-style guard and variables belong to that newer token.
        if (tracked.get(play.element)?.token !== play.token) {
          continue;
        }
        play.element.removeAttribute(STARTING_STYLE_ATTR);
        watchFinish(play.element, play.token);
      }
    }, win);
  }
}

/**
 * Request the per-commit sweep. Every tracked component calls this from a
 * dependency-less layout effect; the first call in a commit does the work and
 * the latch absorbs the rest.
 */
export function scheduleDisplacementSweep(requester?: HTMLElement): void {
  if (!windowOpen) {
    return;
  }
  if (sweepLatched) {
    if (requester === undefined || latchRequesters.has(requester)) {
      trailingSweepRequested = true;
    } else {
      latchRequesters.add(requester);
    }
    return;
  }
  sweepLatched = true;
  if (requester !== undefined) {
    latchRequesters.add(requester);
  }
  queueMicrotask(() => {
    sweepLatched = false;
    latchRequesters.clear();
    if (trailingSweepRequested) {
      trailingSweepRequested = false;
      if (windowOpen) {
        sweep();
      }
    }
  });
  sweep();
}

/**
 * Track `element` for displacement while mounted. Returns the cleanup that
 * stops tracking. The session-store subscription is taken with the first
 * tracked element and released with the last, so an app that imports this but
 * renders no tracked draggable pays nothing per drag.
 */
export function trackDisplacedElement(element: HTMLElement): DragCleanupFn {
  // React cycles a moved keyed child's layout effects (teardown, then setup
  // again in the same commit) when it relocates the node, and a reorder is
  // exactly a relocation, so this cycle lands on the very commit that should
  // animate. Adopt the existing record instead of recreating it: the armed
  // play and the baseline survive, and the teardown below only takes effect
  // when no adoption follows it before the microtask runs (a real unmount).
  const adopted = tracked.get(element);
  const state: TrackedState = adopted ?? {
    left: 0,
    top: 0,
    parent: null,
    hasBaseline: false,
    token: 0,
    untracking: false,
  };
  state.untracking = false;
  if (!adopted) {
    tracked.set(element, state);
    if (windowOpen) {
      // Mounted mid-drag: baseline now, so its later moves animate.
      baseline(element, state);
      attachResizeListener(ownerWindow(element));
    }
  }
  if (storeUnsubscribe === null) {
    storeUnsubscribe = dragSourceStore.subscribe(handleSessionChange);
    // Subscribing does not replay the current snapshot, and the registry can
    // first become non-empty in the middle of a drag (a virtualized list
    // draining and refilling, a list mounting late): derive the window state
    // from the store once, so that drag still animates.
    handleSessionChange();
  }

  return () => {
    if (tracked.get(element) !== state) {
      return;
    }
    state.untracking = true;
    queueMicrotask(() => {
      if (!state.untracking || tracked.get(element) !== state) {
        return;
      }
      state.untracking = false;
      cleanupPlay(element);
      tracked.delete(element);
      if (tracked.size === 0) {
        storeUnsubscribe?.();
        storeUnsubscribe = null;
        graceFrame?.cancel();
        graceFrame = null;
        closeWindow();
      }
    });
  };
}

/** Restore every module-level slot; for the shared test teardown only. */
export function resetDisplacementForTests(): void {
  for (const element of tracked.keys()) {
    cleanupPlay(element);
  }
  tracked.clear();
  storeUnsubscribe?.();
  storeUnsubscribe = null;
  graceFrame?.cancel();
  graceFrame = null;
  closeWindow();
  sweepLatched = false;
  trailingSweepRequested = false;
  latchRequesters.clear();
}
