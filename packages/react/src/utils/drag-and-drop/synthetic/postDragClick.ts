/**
 * Swallows the compatibility `click` the browser fires after a pointer drag.
 *
 * `pointerup` is followed by `mouseup` and then `click`, and nothing about the
 * click says a drag produced it. Because the active phase redirects pointer
 * capture onto a body anchor, that click usually retargets to `<body>`, so the
 * damage lands on document-level handlers: an outside-press dismisser closes the
 * popover or menu that was open the moment any drag is released. Browsers also
 * differ on where the click surfaces — Safari and Firefox can put it back on the
 * source — so a drag can activate the very control it was picked up from.
 *
 * The overview docs promise the opposite ("anything short of that stays a plain
 * click or tap"), which reads as: a completed drag is not a click.
 *
 * One shot, and self-healing: the listener removes itself on the first click, on
 * the next `pointerdown`, or on a short timer if neither arrives (a
 * keyboard-cancelled drag, or a browser that suppressed the click itself).
 * Leaving it armed would eat a genuine click.
 */

import { ownerWindow } from '@base-ui/utils/owner';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { WindowTimeout } from '../core/windowTimeout';
import { getSharedSlot } from '../sharedState';
import type { DragCleanupFn } from '../../../types/drag';

/**
 * Backstop for the case where neither a compatibility click nor a further
 * gesture arrives. The click follows `pointerup` in the same task on every
 * current browser, so this only has to outlast that.
 */
const CLICK_WINDOW_MS = 300;

/**
 * Absolute cap while waiting for a still-held pointer to come up. The release
 * normally arrives long before this; the cap only covers a `pointerup` the page
 * never sees at all (an OS hand-off, a window torn down mid-gesture), so the
 * suppression can't stay armed indefinitely and swallow a later keyboard-driven
 * `click`, which has no `pointerdown` to disarm it.
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
 * Swallow the next `click` in `element`'s document. Call when a drag that
 * actually activated ends, whatever ended it.
 *
 * Pass the still-held `pointerId` when the gesture is torn down before its own
 * release — an Escape cancel leaves the button down, and the click only arrives
 * whenever the user eventually lets go. The backstop timer cannot start until
 * then: the user has just pressed a key mid-gesture, so they will almost
 * certainly hold longer than `CLICK_WINDOW_MS`, and a window that expired while
 * the button was still down would let the drag's own click through and activate
 * the very control the drag was picked up from.
 */
export function suppressNextClick(element: Element, heldPointerId?: number): void {
  // Re-arming replaces the previous window rather than stacking listeners.
  state.disarm?.();

  const win = ownerWindow(element);
  const timeout = new WindowTimeout(win);

  // Assigned by the listener registrations below; the handlers and the timer all
  // reach them through `disarm`, which only ever runs after that.
  let offClick: DragCleanupFn = () => {};
  let offPointerDown: DragCleanupFn = () => {};
  let offPointerUp: DragCleanupFn = () => {};

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

  // On the *window*, capturing. A consumer's outside-press dismisser is usually
  // installed on the document long before the drag starts, so a document-level
  // capture listener added here would run after it — too late. Window capture is
  // the first stop in the propagation path whatever the registration order, which
  // is the same sequencing the sensor relies on for `pointerdown`.
  offClick = addEventListener(
    win,
    'click',
    (event) => {
      // In the held-pointer mode the click being waited on is the held pointer's
      // own compatibility click, and the window stays armed for seconds — long
      // enough for a genuine interaction from *another* input to land (a mouse
      // press while the canceled touch still rests on the screen, or a keyboard
      // "click", which reports `pointerId` -1). A click carrying a different
      // pointerId is not the one this window exists to eat: let it through and
      // stay armed. A legacy `MouseEvent` click exposes no `pointerId`; swallow
      // it as before rather than guess.
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

  // A new press means the drag's own compatibility click is never coming: browsers
  // only synthesize one when the press and release share a target, so a drag
  // released somewhere else — the normal case on a canvas — produces none at all.
  // Any click from here on belongs to the new gesture, and swallowing it would
  // cost the user a real interaction for up to `CLICK_WINDOW_MS`.
  //
  // `pointerdown` specifically, not `mousedown`: on touch the compatibility
  // sequence is `mousedown`, `mouseup`, `click`, so disarming on `mousedown`
  // would let the very click this exists to suppress straight through.
  //
  // While the armed pointer is still held, a *different* pointer's press is a
  // second finger, not a new gesture: the held finger's eventual release can
  // still produce the compatibility click (it is the primary pointer), so the
  // window must stay armed through it.
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

  // The gesture outlives its own teardown: hold the window open until this
  // pointer comes up, and only then start the backstop the click has to beat.
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
  // A canceled pointer produces no compatibility click at all, so nothing is
  // left to suppress.
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
