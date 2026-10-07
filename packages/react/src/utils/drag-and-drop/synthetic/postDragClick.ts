/**
 * Swallows the compatibility `click` the browser fires after a pointer drag, which carries
 * no sign that a drag produced it. It usually lands on `<body>` (capture is on the body
 * anchor), where an outside-press handler would close an open popover; Safari and Firefox
 * can fire it on the source instead. It disarms on the first click, the next
 * `pointerdown`, or a short timer, since staying armed would eat a genuine click.
 */

import { ownerWindow } from '@base-ui/utils/owner';
import { NOOP } from '@base-ui/utils/empty';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { getTarget } from '@base-ui/utils/shadowDom';
import { WindowTimeout } from '../../windowTimeout';
import { getSharedSlot } from '../sharedState';
import type { DragCleanupFn } from '../types';

/** Shared listener options, so every capture listener doesn't allocate its own. */
export const CAPTURE: AddEventListenerOptions = { capture: true };

/**
 * Backstop for when neither a compatibility click nor a new press arrives.
 * Current browsers fire the click in the same task as `pointerup`, so this only
 * has to outlast that task.
 */
const CLICK_WINDOW_MS = 300;

/**
 * Upper bound on waiting for a held pointer to come up, for when the page never
 * sees the `pointerup` (an OS hand-off). Otherwise the suppression could stay
 * armed and swallow a later tap's `click`: another pointer's press doesn't disarm
 * it, and a legacy `MouseEvent` click has no `pointerId` to let it through.
 */
const HELD_WINDOW_MS = 5000;

/**
 * Backstop for the rest of a double-click after a double-click drop. `detail`
 * decides what is swallowed, since browsers only report 2 within the OS
 * double-click time. This only removes the listeners when no second click comes.
 */
const DOUBLE_CLICK_WINDOW_MS = 1000;

interface PostDragClickState {
  /** Disarms the currently armed suppression, or `null` when none is armed. */
  disarm: DragCleanupFn | null;
  /** The armed double-click follow-up suppression and its window, or `null` when none is armed. */
  doubleClickFollowUp: { win: Window; disarm: DragCleanupFn } | null;
}

const state = getSharedSlot<PostDragClickState>('postDragClick', () => ({
  disarm: null,
  doubleClickFollowUp: null,
}));

/**
 * Swallow the next `click` in `element`'s window. Call it whenever an activated drag ends.
 * Pass `heldPointerId` when the pointer is still down (an Escape cancel), so the backstop
 * timer starts on release and a hold longer than `CLICK_WINDOW_MS` can't let the click
 * through.
 */
export function suppressNextClick(element: Element, heldPointerId?: number): void {
  // Re-arming replaces the previous window rather than stacking listeners.
  state.disarm?.();

  const win = ownerWindow(element);
  const timeout = new WindowTimeout(win);

  // Assigned by the registrations below. The handlers and the timer only reach
  // them through `disarm`, which runs after that.
  let offClick: DragCleanupFn = NOOP;
  let offPointerDown: DragCleanupFn = NOOP;
  let offPointerUp: DragCleanupFn = NOOP;

  const disarm = () => {
    if (state.disarm !== disarm) {
      return;
    }
    state.disarm = null;
    timeout.clear();
    offClick();
    offPointerDown();
    offPointerUp();
  };

  // Window capture runs before the outside-press handler, which is usually
  // registered on the document before the drag, so a document listener added now
  // would run after it.
  offClick = addEventListener(
    win,
    'click',
    (event) => {
      // Keyboard and programmatic activation (a `.click()` in an end handler)
      // aren't the drag's compatibility click. Keep waiting for that one.
      if (event.detail === 0) {
        return;
      }
      // A held window can stay armed for seconds, so let a click from another
      // pointer through (a mouse click while the canceled touch rests on the
      // screen). A legacy `MouseEvent` click has no `pointerId` and is swallowed.
      const clickPointerId = (event as PointerEvent).pointerId;
      if (
        heldPointerId !== undefined &&
        typeof clickPointerId === 'number' &&
        clickPointerId !== heldPointerId
      ) {
        return;
      }
      swallowEvent(event);
      disarm();
    },
    CAPTURE,
  );

  // A new press means the drag's click isn't coming (one released away from its
  // press target produces none), so later clicks belong to the new gesture. Use
  // `pointerdown`, not `mousedown`, which touch fires just before the drag's own
  // `click`. While the armed pointer is held, another pointer's press is a second
  // finger, and the held one can still produce the click.
  let heldStillDown = heldPointerId !== undefined;
  offPointerDown = addEventListener(
    win,
    'pointerdown',
    (event) => {
      if (heldStillDown && event.pointerId !== heldPointerId) {
        return;
      }
      disarm();
    },
    CAPTURE,
  );

  state.disarm = disarm;

  if (heldPointerId === undefined) {
    timeout.start(CLICK_WINDOW_MS, disarm);
    return;
  }

  // The pointer is still down after teardown. Keep the window open until it comes
  // up, and only then start the backstop timer.
  const offUp = addEventListener(
    win,
    'pointerup',
    (event) => {
      if (event.pointerId === heldPointerId) {
        heldStillDown = false;
        offPointerUp();
        timeout.start(CLICK_WINDOW_MS, disarm);
      }
    },
    CAPTURE,
  );
  // A canceled pointer produces no click.
  const offCancel = addEventListener(
    win,
    'pointercancel',
    (event) => {
      if (event.pointerId === heldPointerId) {
        disarm();
      }
    },
    CAPTURE,
  );
  offPointerUp = mergeCleanups(offUp, offCancel);
  timeout.start(HELD_WINDOW_MS, disarm);
}

/**
 * Swallow the rest of a double-click whose first click dropped a double-click
 * pickup: the next `click` with `detail` 2 or more, and the `dblclick`, which
 * would pick up the item under the pointer again, often the one just dropped.
 * The `dblclick`, a `detail` 1 click or the backstop timer disarms it.
 */
export function suppressDoubleClickFollowUp(element: Element): void {
  state.doubleClickFollowUp?.disarm();

  const win = ownerWindow(element);
  const timeout = new WindowTimeout(win);
  const cleanups: DragCleanupFn[] = [];

  const followUp = {
    win,
    disarm() {
      if (state.doubleClickFollowUp !== followUp) {
        return;
      }
      state.doubleClickFollowUp = null;
      timeout.clear();
      for (const off of cleanups) {
        off();
      }
    },
  };

  // Window capture, as in `suppressNextClick`. The sensor's window `dblclick`
  // listener was added earlier and runs first, so it checks
  // `consumeDoubleClickFollowUp` itself.
  cleanups.push(
    addEventListener(
      win,
      'click',
      (event) => {
        // A keyboard or programmatic click (`detail` 0) isn't part of the sequence.
        if (event.detail === 0) {
          return;
        }
        if (event.detail >= 2) {
          swallowEvent(event);
        } else {
          followUp.disarm();
        }
      },
      CAPTURE,
    ),
    addEventListener(win, 'dblclick', consumeDoubleClickFollowUp, CAPTURE),
  );

  state.doubleClickFollowUp = followUp;
  timeout.start(DOUBLE_CLICK_WINDOW_MS, followUp.disarm);
}

/**
 * Swallow `event` if it is the `dblclick` of a double-click that dropped (see
 * {@link suppressDoubleClickFollowUp}), and report whether it was.
 */
export function consumeDoubleClickFollowUp(event: Event): boolean {
  const followUp = state.doubleClickFollowUp;
  if (!followUp || ownerWindow(getTarget(event)) !== followUp.win) {
    return false;
  }
  swallowEvent(event);
  followUp.disarm();
  return true;
}

/**
 * Cancel the event's default action and keep every later listener, on any node,
 * from seeing it.
 */
export function swallowEvent(event: Event): void {
  event.preventDefault();
  event.stopImmediatePropagation();
}

/** Disarm without waiting for a click. Used by the engine's test reset. */
export function resetForTests(): void {
  state.disarm?.();
  state.doubleClickFollowUp?.disarm();
}
