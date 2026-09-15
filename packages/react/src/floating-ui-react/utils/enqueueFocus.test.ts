import { vi } from 'vitest';
import { enqueueFocus } from './enqueueFocus';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

function createButton() {
  const button = document.createElement('button');
  document.body.append(button);
  return button;
}

it('focuses the element on the next frame', () => {
  const button = createButton();

  enqueueFocus(button);
  expect(document.activeElement).not.toBe(button);

  vi.advanceTimersToNextFrame();
  expect(document.activeElement).toBe(button);
});

it('does not cancel focus queued for a different element', () => {
  const first = createButton();
  const second = createButton();
  const received: HTMLElement[] = [];
  first.addEventListener('focus', () => received.push(first));
  second.addEventListener('focus', () => received.push(second));

  enqueueFocus(first);
  enqueueFocus(second);
  vi.advanceTimersToNextFrame();

  expect(received).toEqual([first, second]);
  expect(document.activeElement).toBe(second);
});

it('keeps only the last queued focus for the same element', () => {
  const button = createButton();
  const staleShouldFocus = vi.fn(() => true);

  enqueueFocus(button, { shouldFocus: staleShouldFocus });
  enqueueFocus(button);
  vi.advanceTimersToNextFrame();

  expect(staleShouldFocus).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(button);
});

it('the returned function cancels only its own queued focus', () => {
  const first = createButton();
  const second = createButton();
  let firstFocused = false;
  first.addEventListener('focus', () => {
    firstFocused = true;
  });

  const cancelFirst = enqueueFocus(first);
  enqueueFocus(second);
  cancelFirst();
  vi.advanceTimersToNextFrame();

  expect(firstFocused).toBe(false);
  expect(document.activeElement).toBe(second);
});

it('a stale cancel function does not cancel a newer request for the element', () => {
  const button = createButton();
  const liveShouldFocus = vi.fn(() => true);
  const finalShouldFocus = vi.fn(() => true);

  const staleCancel = enqueueFocus(button);
  enqueueFocus(button, { shouldFocus: liveShouldFocus });
  staleCancel();
  enqueueFocus(button, { shouldFocus: finalShouldFocus });
  vi.advanceTimersToNextFrame();

  expect(liveShouldFocus).not.toHaveBeenCalled();
  expect(finalShouldFocus).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(button);
});

it('sync focus cancels the pending queued focus for the element', () => {
  const button = createButton();
  const staleShouldFocus = vi.fn(() => true);

  enqueueFocus(button, { shouldFocus: staleShouldFocus });
  enqueueFocus(button, { sync: true });
  expect(document.activeElement).toBe(button);

  vi.advanceTimersToNextFrame();
  expect(staleShouldFocus).not.toHaveBeenCalled();
});

it('a null element is a no-op and leaves queued focus for other elements alone', () => {
  const button = createButton();

  enqueueFocus(button);
  enqueueFocus(null);
  vi.advanceTimersToNextFrame();

  expect(document.activeElement).toBe(button);
});

it('skips focusing when shouldFocus returns false', () => {
  const button = createButton();

  enqueueFocus(button, { shouldFocus: () => false });
  vi.advanceTimersToNextFrame();

  expect(document.activeElement).not.toBe(button);
});
