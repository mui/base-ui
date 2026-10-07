/**
 * Pointer event helpers for synthetic-drag tests. Later events dispatch on the `pointerdown`
 * target, as in a browser, and bubble to the engine's document and window listeners. Every
 * dispatch runs in `act`, since starting or ending a drag re-renders `Draggable.Provider`.
 * Only pointer events are dispatched; `touchmove` scroll-guard tests dispatch their own.
 */
import { act } from '@mui/internal-test-utils';
import { setEventTimeStamp } from './pointer';

type SyntheticPointerType = 'touch' | 'pen';

export interface SyntheticPointerOptions {
  /**
   * The event's `timeStamp`, which the sensor reads for press-hold timing and
   * double-tap pairing. When omitted, the event uses the environment's clock, which
   * is the real one in a browser.
   */
  timeStamp?: number | undefined;
}

let touchDownTarget: EventTarget | null = null;

/**
 * Dispatch `event` on `target` inside `act` so store-driven re-renders flush.
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
    // A real browser reports the held button. The engine treats `buttons === 0` as a release.
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
