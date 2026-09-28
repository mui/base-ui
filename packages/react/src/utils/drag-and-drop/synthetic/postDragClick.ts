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
import { WindowTimeout } from '../../windowTimeout';
import { getSharedSlot } from '../sharedState';
import type { DragCleanupFn } from '../types';

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

interface PostDragClickState {
  /** Disarms the currently armed suppression, or `null` when none is armed. */
  disarm: DragCleanupFn | null;
}

const state = getSharedSlot<PostDragClickState>('postDragClick', () => ({
  disarm: null,
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
      event.preventDefault();
      event.stopImmediatePropagation();
      disarm();
    },
    { capture: true },
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
    { capture: true },
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
    { capture: true },
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
    { capture: true },
  );
  offPointerUp = () => {
    offUp();
    offCancel();
  };
  timeout.start(HELD_WINDOW_MS, disarm);
}

/** Disarm without waiting for a click. Used by the engine's test reset. */
export function resetForTests(): void {
  state.disarm?.();
}
