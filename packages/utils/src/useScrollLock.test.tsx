import * as React from 'react';
import { act, createRenderer, screen } from '@mui/internal-test-utils';
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

function createTouch(target: EventTarget, point: { clientX: number; clientY: number }) {
  if (typeof Touch === 'function') {
    return new Touch({
      identifier: 1,
      target,
      ...point,
    });
  }

  return {
    identifier: 1,
    target,
    ...point,
  };
}

function createTouchEvent(
  type: string,
  target: EventTarget,
  point: { clientX: number; clientY: number },
) {
  const touch = createTouch(target, point);
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
  }) as TouchEvent;

  Object.defineProperties(event, {
    touches: { value: [touch], configurable: true },
    changedTouches: { value: [touch], configurable: true },
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

  const addListenerSpy = vi.spyOn(document, 'addEventListener');
  const removeListenerSpy = vi.spyOn(document, 'removeEventListener');

  const view = render(<TestComponent enabled />);

  act(() => {
    vi.runAllTimers();
  });

  expect(document.body.style.overflowY).toBe('hidden');
  expect(addListenerSpy.mock.calls.some(([type]) => type === 'touchstart')).toBe(true);
  expect(addListenerSpy.mock.calls.some(([type]) => type === 'touchmove')).toBe(true);

  view.setProps({ enabled: false });

  act(() => {
    vi.runAllTimers();
  });

  expect(document.body.style.overflowY).toBe('');
  expect(removeListenerSpy.mock.calls.some(([type]) => type === 'touchstart')).toBe(true);
  expect(removeListenerSpy.mock.calls.some(([type]) => type === 'touchmove')).toBe(true);
});

it('prevents touchmove when there is no scroll container on iOS', async () => {
  vi.useFakeTimers();

  const { useScrollLock } = await importUseScrollLockIOS();

  function TestComponent() {
    useScrollLock(true, document.body);
    return <div data-testid="target">Content</div>;
  }

  render(<TestComponent />);

  act(() => {
    vi.runAllTimers();
  });

  const target = screen.getByTestId('target');
  target.dispatchEvent(createTouchEvent('touchstart', target, { clientX: 0, clientY: 0 }));
  const touchMove = createTouchEvent('touchmove', target, { clientX: 0, clientY: 10 });
  target.dispatchEvent(touchMove);

  expect(touchMove.defaultPrevented).toBe(true);
});

it('allows touchmove inside a scrollable container on iOS', async () => {
  vi.useFakeTimers();

  const { useScrollLock } = await importUseScrollLockIOS();

  function TestComponent() {
    useScrollLock(true, document.body);
    return (
      <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
        <div style={{ height: 120 }}>Scrollable content</div>
      </div>
    );
  }

  render(<TestComponent />);

  act(() => {
    vi.runAllTimers();
  });

  const scroll = screen.getByTestId('scroll');
  Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
  Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
  scroll.scrollTop = 10;

  scroll.dispatchEvent(createTouchEvent('touchstart', scroll, { clientX: 0, clientY: 0 }));
  const touchMove = createTouchEvent('touchmove', scroll, { clientX: 0, clientY: 10 });
  scroll.dispatchEvent(touchMove);

  expect(touchMove.defaultPrevented).toBe(false);
});

it('prevents touchmove at scroll top when dragging past the boundary on iOS', async () => {
  vi.useFakeTimers();

  const { useScrollLock } = await importUseScrollLockIOS();

  function TestComponent() {
    useScrollLock(true, document.body);
    return (
      <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
        <div style={{ height: 120 }}>Scrollable content</div>
      </div>
    );
  }

  render(<TestComponent />);

  act(() => {
    vi.runAllTimers();
  });

  const scroll = screen.getByTestId('scroll');
  Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
  Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
  scroll.scrollTop = 0;

  scroll.dispatchEvent(createTouchEvent('touchstart', scroll, { clientX: 0, clientY: 0 }));
  const touchMove = createTouchEvent('touchmove', scroll, { clientX: 0, clientY: 10 });
  scroll.dispatchEvent(touchMove);

  expect(touchMove.defaultPrevented).toBe(true);
});

it('prevents touchmove at scroll bottom when dragging past the boundary on iOS', async () => {
  vi.useFakeTimers();

  const { useScrollLock } = await importUseScrollLockIOS();

  function TestComponent() {
    useScrollLock(true, document.body);
    return (
      <div data-testid="scroll" style={{ overflowY: 'auto', maxHeight: 40 }}>
        <div style={{ height: 120 }}>Scrollable content</div>
      </div>
    );
  }

  render(<TestComponent />);

  act(() => {
    vi.runAllTimers();
  });

  const scroll = screen.getByTestId('scroll');
  Object.defineProperty(scroll, 'scrollHeight', { value: 120, configurable: true });
  Object.defineProperty(scroll, 'clientHeight', { value: 40, configurable: true });
  scroll.scrollTop = 80;

  scroll.dispatchEvent(createTouchEvent('touchstart', scroll, { clientX: 0, clientY: 20 }));
  const touchMove = createTouchEvent('touchmove', scroll, { clientX: 0, clientY: 10 });
  scroll.dispatchEvent(touchMove);

  expect(touchMove.defaultPrevented).toBe(true);
});

it('allows touchmove on range inputs on iOS', async () => {
  vi.useFakeTimers();

  const { useScrollLock } = await importUseScrollLockIOS();

  function TestComponent() {
    useScrollLock(true, document.body);
    return <input type="range" data-testid="range" />;
  }

  render(<TestComponent />);

  act(() => {
    vi.runAllTimers();
  });

  const range = screen.getByTestId('range');
  range.dispatchEvent(createTouchEvent('touchstart', range, { clientX: 0, clientY: 0 }));
  const touchMove = createTouchEvent('touchmove', range, { clientX: 20, clientY: 0 });
  range.dispatchEvent(touchMove);

  expect(touchMove.defaultPrevented).toBe(false);
});

it('allows touchmove when adjusting input selection handles on iOS', async () => {
  vi.useFakeTimers();

  const { useScrollLock } = await importUseScrollLockIOS();

  function TestComponent() {
    useScrollLock(true, document.body);
    return <input data-testid="input" defaultValue="Selectable text" />;
  }

  render(<TestComponent />);

  act(() => {
    vi.runAllTimers();
  });

  const input = screen.getByTestId('input') as HTMLInputElement;
  input.focus();
  input.setSelectionRange(0, 5);

  input.dispatchEvent(createTouchEvent('touchstart', input, { clientX: 0, clientY: 0 }));
  const touchMove = createTouchEvent('touchmove', input, { clientX: 0, clientY: 10 });
  input.dispatchEvent(touchMove);

  expect(touchMove.defaultPrevented).toBe(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.doUnmock('./detectBrowser');
  vi.restoreAllMocks();
});
