import { createEvent, fireEvent } from '@mui/internal-test-utils';

export function enterWithMouse(element: HTMLElement, init?: MouseEventInit) {
  fireEvent.pointerEnter(element, { pointerType: 'mouse', ...init });
  fireEvent.mouseEnter(element, init);
  fireEvent.mouseMove(element, init);
}

export function moveMouse(from: HTMLElement, to: HTMLElement) {
  fireEvent.pointerLeave(from, {
    pointerType: 'mouse',
    relatedTarget: to,
  });
  fireEvent.mouseLeave(from, { relatedTarget: to });
  fireEvent.pointerEnter(to, {
    pointerType: 'mouse',
    relatedTarget: from,
  });
  fireEvent.mouseEnter(to, { relatedTarget: from });
  fireEvent.mouseMove(to);
}

// `timeStamp` is required: omitting it would leave the event stamped off the runner's real clock,
// which is the exact dependency these helpers exist to remove, and would do so silently.
type PointerInit = PointerEventInit & { timeStamp: number };

/**
 * Stamp `event` with `timeStamp`. `helper` names the caller in the error.
 */
export function setEventTimeStamp(event: Event, timeStamp: number, helper: string): void {
  if (!(timeStamp > 0)) {
    // React's synthetic event reads `event.timeStamp || Date.now()`, so a falsy stamp reaches
    // handlers as wall-clock time. `getValidTimeStamp` in `useSwipeDismiss` also rejects anything
    // <= 0, so a zero stamp can never express "time zero" — it only reintroduces the real-clock
    // dependency this helper exists to remove.
    throw new Error(`${helper}: timeStamp must be greater than 0, received ${timeStamp}.`);
  }

  // `timeStamp` is read-only and not part of `PointerEventInit`, so passing it through `fireEvent`
  // drops it silently: jsdom then stamps the event off the (faked) clock, while real browsers stamp
  // it off the real monotonic clock. Velocity-sensitive logic would otherwise read whatever
  // wall-clock gap the runner happened to leave between calls, which differs from run to run.
  Object.defineProperty(event, 'timeStamp', { value: timeStamp });
}

function firePointerEvent(
  type: 'pointerDown' | 'pointerMove' | 'pointerUp',
  element: Element,
  init: PointerInit,
) {
  const { timeStamp, ...eventInit } = init;
  const event = createEvent[type](element, eventInit);
  setEventTimeStamp(event, timeStamp, 'firePointer');
  return fireEvent(element, event);
}

/**
 * Fires pointer events that honor the `timeStamp` given to them, so that tests asserting on
 * gesture velocity describe a fixed timeline instead of inheriting the runner's real timing.
 */
export const firePointer = {
  down: (element: Element, init: PointerInit) => firePointerEvent('pointerDown', element, init),
  move: (element: Element, init: PointerInit) => firePointerEvent('pointerMove', element, init),
  up: (element: Element, init: PointerInit) => firePointerEvent('pointerUp', element, init),
};

/**
 * Presses an element the way a touch screen does before the click: a touch `pointerdown`
 * followed by the compatibility `mousedown`.
 */
export function pressWithTouch(element: HTMLElement) {
  fireEvent.pointerDown(element, { pointerType: 'touch' });
  fireEvent.mouseDown(element);
}
