/**
 * Pointer event helpers for synthetic-drag tests.
 *
 * `pointerdown` remembers its target, and later helpers dispatch on that element
 * as a browser would. The events bubble up to the document and window, where the
 * engine's pending and active phase listeners are. `setupDragEngineTests()`
 * clears the remembered target between tests.
 *
 * The helpers dispatch only pointer events. The engine's only touch listener is the
 * active-phase `touchmove` scroll guard, which tests dispatch themselves.
 *
 * Every dispatch is wrapped in `act` because tests mount a `Draggable.Provider`
 * that subscribes to the drag session store. A raw dispatch that starts or ends a
 * drag would re-render React outside `act`.
 */
import { act } from '@mui/internal-test-utils';
import { setEventTimeStamp } from './pointer';

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
export function dispatch(
  target: EventTarget,
  event: Event,
  options: SyntheticPointerOptions = {},
): void {
  if (options.timeStamp !== undefined) {
    setEventTimeStamp(event, options.timeStamp, 'syntheticPointer');
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

export function touchUp(
  x: number,
  y: number,
  pointerId = 1,
  options?: SyntheticPointerOptions,
): void {
  pointerUp('touch', x, y, pointerId, options);
}

export function touchCancel(pointerId = 1, options?: SyntheticPointerOptions): void {
  pointerCancel('touch', pointerId, options);
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
