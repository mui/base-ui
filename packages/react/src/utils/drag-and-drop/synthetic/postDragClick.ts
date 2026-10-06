/**
 * Swallows the compatibility `click` the browser fires after a pointer drag.
 *
 * `pointerup` is followed by `mouseup` and then `click`, and the click carries
 * no sign that a drag produced it. The active phase redirects pointer capture
 * onto a body anchor, so the click usually retargets to `<body>` and reaches
 * document-level handlers. An outside-press handler then closes any open popover
 * or menu when a drag is released. Safari and Firefox can instead fire the click
 * on the source, so a drag can activate the control it was picked up from.
 *
 * The activation docs say "Releasing before the threshold keeps the normal click
 * or tap", which implies that a completed drag is not a click.
 *
 * The suppression runs once. The listener removes itself on the first click, on
 * the next `pointerdown`, or on a short timer if neither arrives (for example,
 * when the browser suppressed the click itself). Leaving it armed would eat a
 * genuine click.
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
const CAPTURE: AddEventListenerOptions = { capture: true };

/**
 * Backstop for when neither a compatibility click nor a new press arrives.
 * Current browsers fire the click in the same task as `pointerup`, so this only
 * has to outlast that task.
 */
const CLICK_WINDOW_MS = 300;

/**
 * Upper bound on waiting for a still-held pointer to come up. It only matters
 * when the page never sees the `pointerup`, such as after an OS hand-off or a
 * window torn down mid-gesture. Without it, the suppression could stay armed and
 * swallow a later keyboard `click`, which has no `pointerdown` to disarm it.
 */
const HELD_WINDOW_MS = 5000;

/**
 * Backstop for the rest of a double-click after a double-click drop. Only a
 * click with `detail` 2 or more is swallowed, and browsers report that only
 * within the OS double-click time, so `detail` decides and this only removes the
 * listeners when no second click comes.
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
 * Swallow the next `click` in `element`'s window. Call it whenever an activated
 * drag ends, whatever ended it.
 *
 * Pass `heldPointerId` when the gesture ends before its pointer is released. An
 * Escape cancel leaves the button down, and the click only arrives when the user
 * lets go. The backstop timer waits for that release, because a user who just
 * pressed a key mid-gesture will likely hold longer than `CLICK_WINDOW_MS`. If
 * the window expired first, the drag's own click would get through and activate
 * the control the drag started on.
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

  // Listen on the window in the capture phase. An outside-press handler is
  // usually registered on the document before the drag starts, so a document
  // capture listener added now would run after it. Window capture runs first
  // regardless of registration order, which the sensor also relies on for
  // `pointerdown`.
  offClick = addEventListener(
    win,
    'click',
    (event) => {
      // Keyboard and programmatic activation (a `.click()` in an end handler)
      // aren't the drag's compatibility click. Keep waiting for that one.
      if (event.detail === 0) {
        return;
      }
      // In held-pointer mode, the window can stay armed for seconds, long enough
      // for a real click from another input. Examples are a mouse press while the
      // canceled touch still rests on the screen, or a keyboard click, which
      // reports `pointerId` -1. Let a click with a different `pointerId` through
      // and stay armed. A legacy `MouseEvent` click has no `pointerId`, so it is
      // swallowed.
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

  // A new press means the drag's compatibility click isn't coming. Browsers only
  // fire one when the press and release share a target, so a drag released
  // elsewhere, the usual case on a canvas, produces none. Any later click belongs
  // to the new gesture and must not be swallowed.
  //
  // Disarm on `pointerdown`, not `mousedown`. On touch, the compatibility
  // sequence is `mousedown`, `mouseup`, `click`, so disarming on `mousedown`
  // would let the drag's click through.
  //
  // While the armed pointer is still held, a press from a different pointer is a
  // second finger, not a new gesture. The held finger is the primary pointer and
  // its release can still produce the click, so stay armed.
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
  // A canceled pointer produces no compatibility click, so there is nothing to
  // suppress.
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
 * pickup: the next `click` with `detail` 2 or more, and the `dblclick`. The
 * `dblclick` would otherwise pick up the item under the pointer again, which is
 * often the one just dropped. A click with `detail` 1 starts a new sequence and
 * disarms the suppression, as does the `dblclick` or the backstop timer.
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

  // Window capture runs before any document listener, as in `suppressNextClick`.
  // The sensor's own `dblclick` listener on the window was added earlier and runs
  // first, so it checks `consumeDoubleClickFollowUp`.
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
