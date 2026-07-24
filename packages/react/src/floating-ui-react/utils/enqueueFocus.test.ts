import { vi } from 'vitest';
import { enqueueFocus } from './enqueueFocus';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

function createButton() {
  const button = document.createElement('button');
  document.body.append(button);
  return button;
}

function createAnimationFrameMock(win: Window) {
  let nextFrameId = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  const requestAnimationFrame = vi
    .spyOn(win, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      nextFrameId += 1;
      callbacks.set(nextFrameId, callback);
      return nextFrameId;
    });
  const cancelAnimationFrame = vi
    .spyOn(win, 'cancelAnimationFrame')
    .mockImplementation((id) => callbacks.delete(id));

  return {
    requestAnimationFrame,
    cancelAnimationFrame,
    flush() {
      const pending = Array.from(callbacks.values());
      callbacks.clear();
      pending.forEach((callback) => callback(performance.now()));
    },
  };
}

it('focuses the element on the next frame', () => {
  const button = createButton();

  enqueueFocus(button);
  expect(document.activeElement).not.toBe(button);

  vi.advanceTimersToNextFrame();
  expect(document.activeElement).toBe(button);
});

it('commits only the latest primary intent in a document', () => {
  const first = createButton();
  const second = createButton();
  const onFirstFocus = vi.fn();
  const onSecondFocus = vi.fn();
  first.addEventListener('focus', onFirstFocus);
  second.addEventListener('focus', onSecondFocus);

  enqueueFocus(first);
  enqueueFocus(second);
  vi.advanceTimersToNextFrame();

  expect(onFirstFocus).not.toHaveBeenCalled();
  expect(onSecondFocus).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(second);
});

it('does not run a fallback when the primary intent takes focus', () => {
  const fallback = createButton();
  const primary = createButton();
  const onFallbackFocus = vi.fn();
  fallback.addEventListener('focus', onFallbackFocus);

  enqueueFocus(primary);
  // Initial focus is often queued after list navigation in a microtask. Its
  // later enqueue must not replace the already-known primary destination.
  enqueueFocus(fallback, { intent: 'fallback' });
  vi.advanceTimersToNextFrame();

  expect(onFallbackFocus).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(primary);
});

it('runs the fallback when the primary intent is no longer valid', () => {
  const fallback = createButton();
  const primary = createButton();

  enqueueFocus(fallback, { intent: 'fallback' });
  enqueueFocus(primary, { shouldFocus: () => false });
  vi.advanceTimersToNextFrame();

  expect(document.activeElement).toBe(fallback);
});

it('runs the fallback when the primary focus call does not take focus', () => {
  const fallback = createButton();
  const primary = createButton();
  vi.spyOn(primary, 'focus').mockImplementation(() => {});

  enqueueFocus(fallback, { intent: 'fallback' });
  enqueueFocus(primary);
  vi.advanceTimersToNextFrame();

  expect(document.activeElement).toBe(fallback);
});

it('preserves the queued fallback when synchronous primary focus does not take focus', () => {
  const fallback = createButton();
  const primary = createButton();
  vi.spyOn(primary, 'focus').mockImplementation(() => {});

  enqueueFocus(fallback, { intent: 'fallback' });
  enqueueFocus(primary, { sync: true });

  expect(document.activeElement).not.toBe(fallback);
  vi.advanceTimersToNextFrame();
  expect(document.activeElement).toBe(fallback);
});

it('recognizes successful primary focus inside a closed shadow root', () => {
  const fallback = createButton();
  const onFallbackFocus = vi.fn();
  fallback.addEventListener('focus', onFallbackFocus);
  const host = document.createElement('div');
  document.body.append(host);
  const shadowRoot = host.attachShadow({ mode: 'closed' });
  const primary = document.createElement('button');
  shadowRoot.append(primary);

  enqueueFocus(primary);
  enqueueFocus(fallback, { intent: 'fallback' });
  vi.advanceTimersToNextFrame();

  expect(host.shadowRoot).toBe(null);
  expect(shadowRoot.activeElement).toBe(primary);
  expect(onFallbackFocus).not.toHaveBeenCalled();
});

it('refocuses an active element when its document reports that it is blurred', () => {
  const button = createButton();
  button.focus();
  const focus = vi.spyOn(button, 'focus');
  vi.spyOn(document, 'hasFocus').mockReturnValue(false);

  enqueueFocus(button);
  vi.advanceTimersToNextFrame();

  expect(focus).toHaveBeenCalledOnce();
});

it('does not move focus from a descendant to its fallback container', () => {
  const container = document.createElement('div');
  container.tabIndex = -1;
  const child = document.createElement('button');
  container.append(child);
  document.body.append(container);
  child.focus();
  const focus = vi.spyOn(container, 'focus');

  enqueueFocus(container, { intent: 'fallback' });
  vi.advanceTimersToNextFrame();

  expect(focus).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(child);
});

it('cancels only the request associated with the returned function', () => {
  const fallback = createButton();
  const primary = createButton();

  enqueueFocus(fallback, { intent: 'fallback' });
  const cancelPrimary = enqueueFocus(primary);
  cancelPrimary();
  vi.advanceTimersToNextFrame();

  expect(document.activeElement).toBe(fallback);
});

it('does not let a stale cancel function cancel a newer request', () => {
  const stale = createButton();
  const current = createButton();

  const staleCancel = enqueueFocus(stale);
  enqueueFocus(current);
  staleCancel();
  vi.advanceTimersToNextFrame();

  expect(document.activeElement).toBe(current);
});

it('cancels all pending intents before focusing synchronously', () => {
  const fallback = createButton();
  const pendingPrimary = createButton();
  const syncTarget = createButton();
  const pendingShouldFocus = vi.fn(() => true);

  enqueueFocus(fallback, { intent: 'fallback' });
  enqueueFocus(pendingPrimary, { shouldFocus: pendingShouldFocus });
  enqueueFocus(syncTarget, { sync: true });

  expect(document.activeElement).toBe(syncTarget);
  vi.advanceTimersToNextFrame();
  expect(pendingShouldFocus).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(syncTarget);
});

it('uses a single animation frame for intents in the same document', () => {
  const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame');

  enqueueFocus(createButton(), { intent: 'fallback' });
  enqueueFocus(createButton());

  expect(requestAnimationFrameSpy).toHaveBeenCalledOnce();
  vi.advanceTimersToNextFrame();
});

it('schedules focus queues in their owning windows', () => {
  const iframe = document.createElement('iframe');
  document.body.append(iframe);
  const frameWindow = iframe.contentWindow as Window;
  const frameDocument = iframe.contentDocument as Document;
  const frameAnimation = createAnimationFrameMock(frameWindow);
  const mainRequestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame');
  const currentDocumentButton = createButton();
  const frameButton = frameDocument.createElement('button');
  frameDocument.body.append(frameButton);
  const frameFocus = vi.spyOn(frameButton, 'focus');

  enqueueFocus(currentDocumentButton);
  enqueueFocus(frameButton);

  expect(mainRequestAnimationFrame).toHaveBeenCalledOnce();
  expect(frameAnimation.requestAnimationFrame).toHaveBeenCalledOnce();

  vi.advanceTimersToNextFrame();
  expect(document.activeElement).toBe(currentDocumentButton);
  expect(frameFocus).not.toHaveBeenCalled();

  frameAnimation.flush();
  expect(frameFocus).toHaveBeenCalledOnce();
});

it('cancels focus using the target document window', () => {
  const iframe = document.createElement('iframe');
  document.body.append(iframe);
  const frameWindow = iframe.contentWindow as Window;
  const frameDocument = iframe.contentDocument as Document;
  const frameAnimation = createAnimationFrameMock(frameWindow);
  const frameButton = frameDocument.createElement('button');
  frameDocument.body.append(frameButton);

  const cancel = enqueueFocus(frameButton);
  cancel();

  expect(frameAnimation.cancelAnimationFrame).toHaveBeenCalledWith(1);
});

it('treats a null element as a no-op', () => {
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
