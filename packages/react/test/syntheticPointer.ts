/**
 * Pointer event helpers for synthetic-drag tests.
 *
 * `pointerdown` latches its target and later helpers dispatch on that same
 * element to mimic browser routing: the events bubble up to the document and
 * window, where the engine's pending- and active-phase listeners live.
 * Call `resetTouchTarget()` between tests to clear the latched target.
 *
 * Touch helpers dispatch both pointer events and the corresponding touch
 * events a real browser fires alongside them (the engine's only touch listener
 * is the active-phase `touchmove` scroll guard). Pen helpers dispatch
 * pointer events only — pen drags ignore the iPadOS-synthesised touch stream.
 *
 * Every dispatch is wrapped in `act` because tests mount a `Draggable.PreviewProvider`
 * that subscribes to the drag session store: a raw dispatch that starts or ends a
 * drag would re-render React outside `act`.
 */
import { act } from '@mui/internal-test-utils';

type SyntheticPointerType = 'touch' | 'pen';

let touchDownTarget: EventTarget | null = null;

/** Dispatch `event` on `target` inside `act` so store-driven re-renders flush. */
function dispatch(target: EventTarget, event: Event): void {
  act(() => {
    target.dispatchEvent(event);
  });
}

export function resetTouchTarget(): void {
  touchDownTarget = null;
}

export function getTouchDownTarget(): EventTarget {
  return touchDownTarget ?? window;
}

function pointerDown(
  pointerType: SyntheticPointerType,
  target: EventTarget,
  x: number,
  y: number,
  pointerId: number,
): PointerEvent {
  touchDownTarget = target;
  const ev = new PointerEvent('pointerdown', {
    pointerType,
    pointerId,
    clientX: x,
    clientY: y,
    button: 0,
    buttons: 1,
    bubbles: true,
    cancelable: true,
  });
  dispatch(target, ev);
  return ev;
}

function pointerMove(
  pointerType: SyntheticPointerType,
  x: number,
  y: number,
  pointerId: number,
): PointerEvent {
  const ev = new PointerEvent('pointermove', {
    pointerType,
    pointerId,
    clientX: x,
    clientY: y,
    // A move during an active drag reports the held primary button, as a real
    // browser does; the engine treats a `buttons === 0` move as a release.
    buttons: 1,
    bubbles: true,
    cancelable: true,
  });
  dispatch(getTouchDownTarget(), ev);
  return ev;
}

function pointerUp(
  pointerType: SyntheticPointerType,
  x: number,
  y: number,
  pointerId: number,
): void {
  const pe = new PointerEvent('pointerup', {
    pointerType,
    pointerId,
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
  });
  dispatch(getTouchDownTarget(), pe);
}

function pointerCancel(pointerType: SyntheticPointerType, pointerId: number): void {
  const pe = new PointerEvent('pointercancel', {
    pointerType,
    pointerId,
    bubbles: true,
    cancelable: true,
  });
  dispatch(getTouchDownTarget(), pe);
}

export function touchDown(target: EventTarget, x: number, y: number, pointerId = 1): PointerEvent {
  return pointerDown('touch', target, x, y, pointerId);
}

export function touchMove(x: number, y: number, pointerId = 1): PointerEvent {
  return pointerMove('touch', x, y, pointerId);
}

export function makeTouch(x: number, y: number, identifier = 1): Touch {
  const base: Record<string, unknown> = {
    identifier,
    target: window,
    clientX: x,
    clientY: y,
    pageX: x,
    pageY: y,
    screenX: x,
    screenY: y,
    radiusX: 1,
    radiusY: 1,
    rotationAngle: 0,
    force: 1,
  };
  if (typeof Touch === 'function') {
    try {
      return new Touch(base as unknown as TouchInit);
    } catch {
      // WebKit exposes `Touch` as a function but does not make its constructor
      // available to page script. Fall through to the same structural value
      // used by jsdom.
    }
  }
  // jsdom/WebKit fallback: a plain object that duck-types as Touch.
  return base as unknown as Touch;
}

export function dispatchTouchEvent(type: string, x: number, y: number): void {
  const touch = makeTouch(x, y);
  const init: TouchEventInit = {
    touches: type === 'touchend' || type === 'touchcancel' ? [] : [touch],
    targetTouches: type === 'touchend' || type === 'touchcancel' ? [] : [touch],
    changedTouches: [touch],
    bubbles: true,
    cancelable: true,
  };
  let ev: Event | undefined;
  if (typeof TouchEvent === 'function') {
    try {
      ev = new TouchEvent(type, init);
    } catch {
      // WebKit also rejects a structural Touch in the TouchEvent constructor.
      // Fall through to an Event carrying the same observable touch lists.
    }
  }
  if (!ev) {
    // jsdom/WebKit fallback: synthesise a bare Event with touch arrays attached.
    const plain = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(plain, {
      touches: { value: init.touches },
      targetTouches: { value: init.targetTouches },
      changedTouches: { value: init.changedTouches },
    });
    ev = plain;
  }
  dispatch(getTouchDownTarget(), ev);
}

// Real browsers fire both `pointerup` and `touchend` on finger-lift. The engine
// terminates gestures from the pointer stream alone (it has no `touchend`
// listener), so the `touchend` here just mirrors real event ordering.
export function touchUp(x: number, y: number, pointerId = 1): void {
  pointerUp('touch', x, y, pointerId);
  dispatchTouchEvent('touchend', x, y);
}

export function touchCancel(pointerId = 1): void {
  pointerCancel('touch', pointerId);
  dispatchTouchEvent('touchcancel', 0, 0);
}

export function penDown(target: EventTarget, x: number, y: number, pointerId = 1): PointerEvent {
  return pointerDown('pen', target, x, y, pointerId);
}

export function penMove(x: number, y: number, pointerId = 1): PointerEvent {
  return pointerMove('pen', x, y, pointerId);
}

export function penUp(x: number, y: number, pointerId = 1): void {
  pointerUp('pen', x, y, pointerId);
}

export function penCancel(pointerId = 1): void {
  pointerCancel('pen', pointerId);
}
