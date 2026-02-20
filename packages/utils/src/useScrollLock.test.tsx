import * as React from 'react';
import { act, createRenderer } from '@mui/internal-test-utils';
import { afterEach, expect, it, vi } from 'vitest';

const { render } = createRenderer();

async function importUseScrollLockIOS() {
  vi.resetModules();
  vi.doMock('./detectBrowser', async () => {
    const actual = await vi.importActual<typeof import('./detectBrowser')>('./detectBrowser');
    return { ...actual, isIOS: true };
  });

  return import('./useScrollLock');
}

function createTouchEvent(type: string) {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
  }) as unknown as TouchEvent;

  Object.defineProperties(event, {
    touches: { value: [{}], enumerable: true },
    changedTouches: { value: [{}], enumerable: true },
  });

  return event;
}

it('locks overflow and sets up iOS touch handlers', async () => {
  vi.useFakeTimers();

  const { useScrollLock } = await importUseScrollLockIOS();

  function TestComponent({ enabled }: { enabled: boolean }) {
    useScrollLock(enabled, document.body);
    return null;
  }

  document.documentElement.style.overflow = 'visible';
  document.body.style.overflow = 'auto';

  const addListenerSpy = vi.spyOn(document, 'addEventListener');
  const removeListenerSpy = vi.spyOn(document, 'removeEventListener');

  const view = render(<TestComponent enabled />);

  act(() => {
    vi.runAllTimers();
  });

  expect(document.body.style.overflow).toBe('hidden');
  expect(addListenerSpy.mock.calls.some(([type]) => type === 'touchstart')).toBe(true);
  expect(addListenerSpy.mock.calls.some(([type]) => type === 'touchmove')).toBe(true);

  view.setProps({ enabled: false });

  act(() => {
    vi.runAllTimers();
  });

  expect(document.body.style.overflow).toBe('auto');
  expect(removeListenerSpy.mock.calls.some(([type]) => type === 'touchstart')).toBe(true);
  expect(removeListenerSpy.mock.calls.some(([type]) => type === 'touchmove')).toBe(true);
});

it('allows touchmove on range inputs on iOS', async () => {
  vi.useFakeTimers();

  const { useScrollLock } = await importUseScrollLockIOS();

  function TestComponent({ enabled }: { enabled: boolean }) {
    useScrollLock(enabled, document.body);
    return (
      <React.Fragment>
        <div data-testid="target" />
        <input data-testid="range" type="range" />
      </React.Fragment>
    );
  }

  const view = render(<TestComponent enabled />);

  act(() => {
    vi.runAllTimers();
  });

  const target = document.querySelector('[data-testid="target"]')!;
  const range = document.querySelector('[data-testid="range"]')!;

  const targetMove = createTouchEvent('touchmove');
  target.dispatchEvent(createTouchEvent('touchstart'));
  target.dispatchEvent(targetMove);
  expect(targetMove.defaultPrevented).toBe(true);

  const rangeMove = createTouchEvent('touchmove');
  range.dispatchEvent(createTouchEvent('touchstart'));
  range.dispatchEvent(rangeMove);
  expect(rangeMove.defaultPrevented).toBe(false);

  view.setProps({ enabled: false });

  act(() => {
    vi.runAllTimers();
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
