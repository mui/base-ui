/**
 * Pointer event helpers for synthetic-drag tests.
 *
 * `pointerdown` remembers its target, and later helpers dispatch on that element
 * as a browser would. The events bubble up to the document and window, where the
 * engine's pending and active phase listeners are. `setupDragEngineTests()`
 * clears the remembered target between tests.
 *
 * `touchUp` and `touchCancel` also dispatch the `touchend`/`touchcancel` a real
 * browser fires alongside the pointer event. The other helpers dispatch only
 * pointer events. The engine's only touch listener is the active-phase `touchmove`
 * scroll guard, which tests dispatch themselves, and pen drags ignore the touch
 * events iPadOS generates.
 *
 * Every dispatch is wrapped in `act` because tests mount a `Draggable.Provider`
 * that subscribes to the drag session store. A raw dispatch that starts or ends a
 * drag would re-render React outside `act`.
 */
import { act } from '@mui/internal-test-utils';

type SyntheticPointerType = 'touch' | 'pen';

export interface SyntheticPointerOptions {
  /**
   * The event's `timeStamp`. The sensor reads it for the press-hold elapsed time
   * and to pair double-tap presses. Omitted, the event keeps the environment's
   * clock, which is the real one in a browser.
   */
  timeStamp?: number | undefined;
}

let touchDownTarget: EventTarget | null = null;

/**
 * Dispatch `event` on `target` inside `act` so store-driven re-renders flush.
 * `timeStamp` is read-only and not part of the event init, so it is defined on
 * the event, as `firePointer` does.
 */
function dispatch(target: EventTarget, event: Event, options: SyntheticPointerOptions = {}): void {
  const { timeStamp } = options;
  if (timeStamp !== undefined) {
    if (!(timeStamp > 0)) {
      throw new Error(`syntheticPointer: timeStamp must be greater than 0, received ${timeStamp}.`);
    }
    Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  }
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
  options?: SyntheticPointerOptions,
): void {
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
  dispatch(target, ev, options);
}

function pointerMove(
  pointerType: SyntheticPointerType,
  x: number,
  y: number,
  pointerId: number,
  options?: SyntheticPointerOptions,
): void {
  const ev = new PointerEvent('pointermove', {
    pointerType,
    pointerId,
    clientX: x,
    clientY: y,
    // A move during an active drag reports the held primary button, as a real
    // browser does. The engine treats a `buttons === 0` move as a release.
    buttons: 1,
    bubbles: true,
    cancelable: true,
  });
  dispatch(getTouchDownTarget(), ev, options);
}

function pointerUp(
  pointerType: SyntheticPointerType,
  x: number,
  y: number,
  pointerId: number,
  options?: SyntheticPointerOptions,
): void {
  const pe = new PointerEvent('pointerup', {
    pointerType,
    pointerId,
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
  });
  dispatch(getTouchDownTarget(), pe, options);
}

function pointerCancel(
  pointerType: SyntheticPointerType,
  pointerId: number,
  options?: SyntheticPointerOptions,
): void {
  const pe = new PointerEvent('pointercancel', {
    pointerType,
    pointerId,
    bubbles: true,
    cancelable: true,
  });
  dispatch(getTouchDownTarget(), pe, options);
}

export function touchDown(
  target: EventTarget,
  x: number,
  y: number,
  pointerId = 1,
  options?: SyntheticPointerOptions,
): void {
  pointerDown('touch', target, x, y, pointerId, options);
}

export function touchMove(
  x: number,
  y: number,
  pointerId = 1,
  options?: SyntheticPointerOptions,
): void {
  pointerMove('touch', x, y, pointerId, options);
}

function makeTouch(x: number, y: number, identifier = 1): Touch {
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
  // In jsdom and WebKit, return a plain object that duck-types as Touch.
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
    // In jsdom and WebKit, build a bare Event with the touch lists attached.
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

// Browsers fire both `pointerup` and `touchend` when a finger lifts. The engine
// ends gestures from pointer events only and has no `touchend` listener, so this
// `touchend` only reproduces the real event order.
export function touchUp(
  x: number,
  y: number,
  pointerId = 1,
  options?: SyntheticPointerOptions,
): void {
  pointerUp('touch', x, y, pointerId, options);
  dispatchTouchEvent('touchend', x, y);
}

export function touchCancel(pointerId = 1, options?: SyntheticPointerOptions): void {
  pointerCancel('touch', pointerId, options);
  dispatchTouchEvent('touchcancel', 0, 0);
}

export function penDown(
  target: EventTarget,
  x: number,
  y: number,
  pointerId = 1,
  options?: SyntheticPointerOptions,
): void {
  pointerDown('pen', target, x, y, pointerId, options);
}

export function penMove(
  x: number,
  y: number,
  pointerId = 1,
  options?: SyntheticPointerOptions,
): void {
  pointerMove('pen', x, y, pointerId, options);
}

export function penUp(
  x: number,
  y: number,
  pointerId = 1,
  options?: SyntheticPointerOptions,
): void {
  pointerUp('pen', x, y, pointerId, options);
}

export function penCancel(pointerId = 1, options?: SyntheticPointerOptions): void {
  pointerCancel('pen', pointerId, options);
}
