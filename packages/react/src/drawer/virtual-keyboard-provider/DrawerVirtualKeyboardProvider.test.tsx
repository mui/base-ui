import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { useDrawerVirtualKeyboardContext } from './DrawerVirtualKeyboardContext';

describe('<Drawer.VirtualKeyboardProvider />', () => {
  beforeAll(function beforeHook() {
    // PointerEvent not fully implemented in jsdom, causing fireEvent.pointer* to ignore options.
    // https://github.com/jsdom/jsdom/issues/2527
    (window as any).PointerEvent = window.MouseEvent;
  });

  const { render } = createRenderer();

  function createTouch(target: EventTarget, point: { clientX: number; clientY: number }) {
    if (typeof Touch === 'function') {
      return new Touch({
        identifier: 1,
        target,
        ...point,
      });
    }

    return point;
  }

  function createNativeTouchEnd(target: EventTarget, point: { clientX: number; clientY: number }) {
    const touchEnd = new Event('touchend', { bubbles: true, cancelable: true });
    Object.defineProperty(touchEnd, 'changedTouches', {
      value: [createTouch(target, point)],
      configurable: true,
    });
    Object.defineProperty(touchEnd, 'touches', {
      value: [],
      configurable: true,
    });
    return touchEnd;
  }

  function createNativeTouchCancel(
    target: EventTarget,
    point: { clientX: number; clientY: number },
  ) {
    const touchCancel = new Event('touchcancel', { bubbles: true, cancelable: true });
    Object.defineProperty(touchCancel, 'changedTouches', {
      value: [createTouch(target, point)],
      configurable: true,
    });
    Object.defineProperty(touchCancel, 'touches', {
      value: [],
      configurable: true,
    });
    return touchCancel;
  }

  function DirectVirtualKeyboardTouchTarget() {
    const virtualKeyboard = useDrawerVirtualKeyboardContext();

    return (
      <input
        data-testid="input"
        type="text"
        onTouchStart={virtualKeyboard?.onTouchStart}
        onTouchEnd={virtualKeyboard?.onTouchEnd}
      />
    );
  }

  function mockVisualViewport(height: number) {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'visualViewport');
    const listeners = new Map<string, Set<EventListener>>();

    const visualViewport: Pick<VisualViewport, 'addEventListener' | 'removeEventListener'> & {
      height: number;
      scale: number;
      offsetTop: number;
    } = {
      height,
      offsetTop: 0,
      scale: 1,
      addEventListener(type: string, listener: EventListener) {
        if (!listeners.has(type)) {
          listeners.set(type, new Set());
        }

        listeners.get(type)?.add(listener);
      },
      removeEventListener(type: string, listener: EventListener) {
        listeners.get(type)?.delete(listener);
      },
    };

    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: visualViewport as VisualViewport,
    });

    function emit(type: string) {
      listeners.get(type)?.forEach((listener) => listener(new Event(type)));
    }

    return {
      restore() {
        if (originalDescriptor) {
          Object.defineProperty(window, 'visualViewport', originalDescriptor);
        } else {
          Object.defineProperty(window, 'visualViewport', {
            configurable: true,
            value: undefined,
          });
        }
      },
      resize(nextHeight: number) {
        visualViewport.height = nextHeight;
        emit('resize');
      },
      setScale(nextScale: number) {
        visualViewport.scale = nextScale;
        emit('resize');
      },
      scroll(nextOffsetTop: number, nextHeight?: number) {
        visualViewport.offsetTop = nextOffsetTop;
        if (nextHeight !== undefined) {
          visualViewport.height = nextHeight;
        }
        emit('scroll');
      },
    };
  }

  function mockWindowInnerHeight(innerHeight: number) {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight');

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: innerHeight,
    });

    return () => {
      if (originalDescriptor) {
        Object.defineProperty(window, 'innerHeight', originalDescriptor);
      }
    };
  }

  async function flushAnimationFrames(count: number) {
    for (let i = 0; i < count; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    }
  }

  it.skipIf(isJSDOM)(
    'adds scroll slack and centers the focused input while the visual viewport is reduced',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <Drawer.Content
                      data-testid="scroll"
                      style={{
                        height: 420,
                        overflowY: 'auto',
                        overflowAnchor: 'auto',
                        paddingBottom: 20,
                      }}
                    >
                      <div style={{ height: 900 }} />
                      <input data-testid="input" type="text" />
                    </Drawer.Content>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const scroll = screen.getByTestId('scroll');
        const input = screen.getByTestId('input');

        Object.defineProperties(scroll, {
          clientHeight: { configurable: true, value: 420 },
          scrollHeight: { configurable: true, value: 1200 },
        });
        scroll.getBoundingClientRect = () =>
          ({
            top: 300,
            bottom: 720,
            height: 420,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: 300,
            toJSON: () => {},
          }) as DOMRect;
        input.getBoundingClientRect = () => {
          const top = 650 - scroll.scrollTop;
          return {
            top,
            bottom: top + 40,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          } as DOMRect;
        };

        // Apply the provider's scroll synchronously so the centering assertion below is fast
        // and deterministic instead of waiting on an animated (smooth) scroll.
        scroll.scrollTo = ((options?: ScrollToOptions | number) => {
          if (typeof options === 'object' && options !== null && options.top !== undefined) {
            scroll.scrollTop = options.top;
          }
        }) as typeof scroll.scrollTo;

        const keyboardViewportHeight = 500;
        await act(async () => {
          input.focus();
          scroll.scrollTop = 0;
          visualViewport.resize(keyboardViewportHeight);
        });

        await waitFor(() => {
          expect(Number.parseFloat(scroll.style.paddingBottom)).toBeGreaterThan(20);
        });
        await waitFor(() => {
          expect(scroll.style.scrollPaddingBottom).not.toBe('');
        });
        await waitFor(() => {
          expect(scroll.style.overflowAnchor).toBe('none');
        });
        await waitFor(() => {
          const scrollRect = scroll.getBoundingClientRect();
          const inputRect = input.getBoundingClientRect();
          const inputCenter = (inputRect.top + inputRect.bottom) / 2;
          const visibleCenter = (scrollRect.top + keyboardViewportHeight) / 2;
          expect(inputCenter).toBeCloseTo(visibleCenter, 0);
        });

        await act(async () => {
          input.blur();
        });

        await waitFor(() => {
          expect(scroll.style.paddingBottom).toBe('20px');
        });
        await waitFor(() => {
          expect(scroll.style.scrollPaddingBottom).toBe('');
        });
        await waitFor(() => {
          expect(scroll.style.overflowAnchor).toBe('auto');
        });
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'adds scroll slack to a light-DOM scroller for an input inside a shadow root',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <Drawer.Content
                      data-testid="scroll"
                      style={{
                        height: 420,
                        overflowY: 'auto',
                        overflowAnchor: 'auto',
                        paddingBottom: 20,
                      }}
                    >
                      <div style={{ height: 900 }} />
                      <div data-testid="host" />
                    </Drawer.Content>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const scroll = screen.getByTestId('scroll');
        const host = screen.getByTestId('host');
        const shadowRoot = host.attachShadow({ mode: 'open' });
        const input = document.createElement('input');
        input.type = 'text';
        shadowRoot.append(input);

        Object.defineProperties(scroll, {
          clientHeight: { configurable: true, value: 420 },
          scrollHeight: { configurable: true, value: 1200 },
        });
        scroll.getBoundingClientRect = () =>
          ({
            top: 300,
            bottom: 720,
            height: 420,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: 300,
            toJSON: () => {},
          }) as DOMRect;
        input.getBoundingClientRect = () => {
          const top = 650 - scroll.scrollTop;
          return {
            top,
            bottom: top + 40,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          } as DOMRect;
        };
        scroll.scrollTo = ((options?: ScrollToOptions | number) => {
          if (typeof options === 'object' && options !== null && options.top !== undefined) {
            scroll.scrollTop = options.top;
          }
        }) as typeof scroll.scrollTo;

        const keyboardViewportHeight = 500;
        await act(async () => {
          input.focus();
          scroll.scrollTop = 0;
          visualViewport.resize(keyboardViewportHeight);
        });

        // Slack reaches the light-DOM scroller even though the input lives in a shadow root.
        await waitFor(() => {
          expect(Number.parseFloat(scroll.style.paddingBottom)).toBeGreaterThan(20);
        });
        await waitFor(() => {
          expect(scroll.style.overflowAnchor).toBe('none');
        });
        await waitFor(() => {
          const scrollRect = scroll.getBoundingClientRect();
          const inputRect = input.getBoundingClientRect();
          const inputCenter = (inputRect.top + inputRect.bottom) / 2;
          const visibleCenter = (scrollRect.top + keyboardViewportHeight) / 2;
          expect(inputCenter).toBeCloseTo(visibleCenter, 0);
        });
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'adds keyboard scroll slack to a potential scroll ancestor for textareas',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <div
                      data-testid="scroll"
                      style={{
                        height: 420,
                        overflowY: 'auto',
                        paddingBottom: 20,
                      }}
                    >
                      <div style={{ height: 300 }} />
                      <textarea data-testid="textarea" />
                    </div>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const scroll = screen.getByTestId('scroll');
        const textarea = screen.getByTestId('textarea');

        Object.defineProperties(scroll, {
          clientHeight: { configurable: true, value: 420 },
          scrollHeight: { configurable: true, value: 420 },
        });
        Object.defineProperties(textarea, {
          clientHeight: { configurable: true, value: 88 },
          scrollHeight: { configurable: true, value: 88 },
        });
        scroll.getBoundingClientRect = () =>
          ({
            top: 300,
            bottom: 720,
            height: 420,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: 300,
            toJSON: () => {},
          }) as DOMRect;
        textarea.getBoundingClientRect = () =>
          ({
            top: 650,
            bottom: 690,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: 650,
            toJSON: () => {},
          }) as DOMRect;

        await act(async () => {
          textarea.focus();
          visualViewport.resize(500);
        });

        await waitFor(() => {
          expect(Number.parseFloat(scroll.style.paddingBottom)).toBeGreaterThan(20);
        });
        await waitFor(() => {
          expect(textarea.style.paddingBottom).toBe('');
        });
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'adds keyboard scroll slack to the scroll container, not an overflowing textarea',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <div
                      data-testid="scroll"
                      style={{
                        height: 420,
                        overflowY: 'auto',
                        paddingBottom: 20,
                      }}
                    >
                      <div style={{ height: 300 }} />
                      <textarea data-testid="textarea" defaultValue={'line\n'.repeat(40)} />
                    </div>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const scroll = screen.getByTestId('scroll');
        const textarea = screen.getByTestId('textarea');

        Object.defineProperties(scroll, {
          clientHeight: { configurable: true, value: 420 },
          scrollHeight: { configurable: true, value: 800 },
        });
        // The textarea's own content overflows, making it scrollable itself. Scrolling
        // it cannot move its box above the keyboard, so slack must go to the ancestor.
        Object.defineProperties(textarea, {
          clientHeight: { configurable: true, value: 88 },
          scrollHeight: { configurable: true, value: 600 },
        });
        scroll.getBoundingClientRect = () =>
          ({
            top: 300,
            bottom: 720,
            height: 420,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: 300,
            toJSON: () => {},
          }) as DOMRect;
        textarea.getBoundingClientRect = () =>
          ({
            top: 650,
            bottom: 690,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: 650,
            toJSON: () => {},
          }) as DOMRect;

        await act(async () => {
          textarea.focus();
          visualViewport.resize(500);
        });

        await waitFor(() => {
          expect(Number.parseFloat(scroll.style.paddingBottom)).toBeGreaterThan(20);
        });
        expect(textarea.style.paddingBottom).toBe('');
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'sets the keyboard inset CSS variable for a focused input without a scroll target',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport data-testid="viewport">
                  <Drawer.Popup data-testid="popup">
                    <div>
                      <input data-testid="input" type="text" />
                    </div>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const viewport = screen.getByTestId('viewport');
        const popup = screen.getByTestId('popup');
        const input = screen.getByTestId('input');

        await act(async () => {
          input.focus();
          visualViewport.resize(500);
        });

        await waitFor(() => {
          expect(viewport.style.getPropertyValue('--drawer-keyboard-inset')).toBe('300px');
        });
        await waitFor(() => {
          expect(getComputedStyle(popup).getPropertyValue('--drawer-keyboard-inset')).toBe('300px');
        });

        await act(async () => {
          input.blur();
        });

        await waitFor(() => {
          expect(viewport.style.getPropertyValue('--drawer-keyboard-inset')).toBe('0px');
        });
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)('captures focusin targets through a shadow root', async () => {
    const restoreInnerHeight = mockWindowInnerHeight(800);
    const visualViewport = mockVisualViewport(800);

    try {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport data-testid="viewport">
                <Drawer.Popup>
                  <div data-testid="host" />
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const viewport = screen.getByTestId('viewport');
      const host = screen.getByTestId('host');
      const shadowRoot = host.attachShadow({ mode: 'open' });
      const input = document.createElement('input');
      input.type = 'text';
      shadowRoot.append(input);

      await act(async () => {
        input.focus();
        visualViewport.resize(500);
      });

      await waitFor(() => {
        expect(viewport.style.getPropertyValue('--drawer-keyboard-inset')).toBe('300px');
      });
    } finally {
      visualViewport.restore();
      restoreInnerHeight();
    }
  });

  it.skipIf(isJSDOM)(
    'keeps the keyboard inset when focus moves directly to another keyboard input',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport data-testid="viewport">
                  <Drawer.Popup>
                    <div>
                      <input data-testid="input-a" type="text" />
                      <input data-testid="input-b" type="text" />
                    </div>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const viewport = screen.getByTestId('viewport');
        const inputA = screen.getByTestId('input-a');
        const inputB = screen.getByTestId('input-b');

        await act(async () => {
          inputA.focus();
          visualViewport.resize(500);
        });

        await waitFor(() => {
          expect(viewport.style.getPropertyValue('--drawer-keyboard-inset')).toBe('300px');
        });

        // Focus moving straight to another keyboard input must re-align to the new
        // target, not clear the inset — otherwise it flickers to 0px between fields.
        // Dispatch the focusout in isolation (no following focusin) so a regression
        // that cleared on every focusout would leave nothing to restore the inset.
        await act(async () => {
          inputA.dispatchEvent(
            new FocusEvent('focusout', { bubbles: true, relatedTarget: inputB }),
          );
        });

        await waitFor(() => {
          expect(viewport.style.getPropertyValue('--drawer-keyboard-inset')).toBe('300px');
        });
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)('does not add keyboard scroll slack by default', async () => {
    const restoreInnerHeight = mockWindowInnerHeight(800);
    const visualViewport = mockVisualViewport(800);

    try {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup>
                <Drawer.Content
                  data-testid="scroll"
                  style={{ height: 420, overflowY: 'auto', paddingBottom: 20 }}
                >
                  <div style={{ height: 900 }} />
                  <input data-testid="input" type="text" />
                </Drawer.Content>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const scroll = screen.getByTestId('scroll');
      const input = screen.getByTestId('input');

      await act(async () => {
        input.focus();
        scroll.scrollTop = 0;
        visualViewport.resize(500);
      });

      await waitFor(() => {
        expect(scroll.style.paddingBottom).toBe('20px');
      });
      await waitFor(() => {
        expect(scroll.style.scrollPaddingBottom).toBe('');
      });
      await waitFor(() => {
        expect(scroll.scrollTop).toBe(0);
      });
    } finally {
      visualViewport.restore();
      restoreInnerHeight();
    }
  });

  it.skipIf(isJSDOM)('restores keyboard scroll slack when the drawer closes', async () => {
    const restoreInnerHeight = mockWindowInnerHeight(800);
    const visualViewport = mockVisualViewport(800);

    function TestCase(props: { open: boolean }) {
      return (
        <Drawer.Root open={props.open} modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup>
                  <Drawer.Content
                    data-testid="scroll"
                    style={{
                      height: 420,
                      overflowY: 'auto',
                      overflowAnchor: 'auto',
                      paddingBottom: 20,
                    }}
                  >
                    <div style={{ height: 900 }} />
                    <input data-testid="input" type="text" />
                  </Drawer.Content>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>
      );
    }

    try {
      const { setProps } = await render(<TestCase open />);

      const scroll = screen.getByTestId('scroll');
      const input = screen.getByTestId('input');

      Object.defineProperties(scroll, {
        clientHeight: { configurable: true, value: 420 },
        scrollHeight: { configurable: true, value: 1200 },
      });
      scroll.getBoundingClientRect = () =>
        ({
          top: 300,
          bottom: 720,
          height: 420,
          left: 0,
          right: 320,
          width: 320,
          x: 0,
          y: 300,
          toJSON: () => {},
        }) as DOMRect;
      input.getBoundingClientRect = () =>
        ({
          top: 650,
          bottom: 690,
          height: 40,
          left: 0,
          right: 320,
          width: 320,
          x: 0,
          y: 650,
          toJSON: () => {},
        }) as DOMRect;

      await act(async () => {
        input.focus();
        visualViewport.resize(500);
      });

      await waitFor(() => {
        expect(Number.parseFloat(scroll.style.paddingBottom)).toBeGreaterThan(20);
      });
      await waitFor(() => {
        expect(scroll.style.overflowAnchor).toBe('none');
      });

      await setProps({ open: false });

      await waitFor(() => {
        expect(scroll.style.paddingBottom).toBe('20px');
      });
      await waitFor(() => {
        expect(scroll.style.scrollPaddingBottom).toBe('');
      });
      await waitFor(() => {
        expect(scroll.style.overflowAnchor).toBe('auto');
      });
    } finally {
      visualViewport.restore();
      restoreInnerHeight();
    }
  });

  it.skipIf(isJSDOM)('does not add keyboard scroll slack while pinch-zoomed', async () => {
    const restoreInnerHeight = mockWindowInnerHeight(800);
    const visualViewport = mockVisualViewport(800);

    try {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup>
                  <Drawer.Content
                    data-testid="scroll"
                    style={{ height: 420, overflowY: 'auto', paddingBottom: 20 }}
                  >
                    <div style={{ height: 900 }} />
                    <input data-testid="input" type="text" />
                  </Drawer.Content>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const scroll = screen.getByTestId('scroll');
      const input = screen.getByTestId('input');

      await act(async () => {
        input.focus();
        scroll.scrollTop = 0;
        visualViewport.setScale(1.5);
        visualViewport.resize(500);
      });

      await waitFor(() => {
        expect(scroll.style.paddingBottom).toBe('20px');
      });
      await waitFor(() => {
        expect(scroll.style.scrollPaddingBottom).toBe('');
      });
      await waitFor(() => {
        expect(scroll.scrollTop).toBe(0);
      });
    } finally {
      visualViewport.restore();
      restoreInnerHeight();
    }
  });

  it.skipIf(isJSDOM)(
    'focuses an unfocused keyboard input on touchend without page scroll',
    async () => {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Backdrop data-testid="backdrop" />
              <Drawer.Viewport>
                <Drawer.Popup>
                  <input
                    data-testid="input"
                    style={{
                      opacity: 0.5,
                      transform: 'scale(1)',
                      transition: 'opacity 1s',
                    }}
                    type="text"
                  />
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const backdrop = screen.getByTestId('backdrop');
      const input = screen.getByTestId('input');
      const focusSpy = vi.spyOn(input, 'focus');
      const clickEvents: MouseEvent[] = [];
      input.addEventListener('click', (clickEvent) => {
        clickEvents.push(clickEvent);
      });
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => input;

      try {
        fireEvent.touchStart(input, {
          touches: [
            createTouch(input, {
              clientX: 12,
              clientY: 34,
            }),
          ],
        });

        await waitFor(() => {
          expect(backdrop).toHaveAttribute('data-swiping', '');
        });

        const touchEnd = createNativeTouchEnd(input, {
          clientX: 12,
          clientY: 34,
        });

        await act(async () => {
          input.dispatchEvent(touchEnd);
          await flushMicrotasks();
        });

        expect(touchEnd.defaultPrevented).toBe(true);
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        // Preventing the touchend default suppresses the native compatibility
        // click, so the provider redispatches it.
        expect(clickEvents).toHaveLength(1);
        expect(clickEvents[0].clientX).toBe(12);
        expect(clickEvents[0].clientY).toBe(34);
        expect(clickEvents[0].detail).toBe(1);
        expect(input.style.opacity).toBe('0.5');
        expect(input.style.transform).toBe('scale(1)');
        expect(input.style.transition).toBe('opacity 1s');

        await waitFor(() => {
          expect(backdrop).not.toHaveAttribute('data-swiping');
        });
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        focusSpy.mockRestore();
      }
    },
  );

  it.skipIf(isJSDOM)('preserves native taps on picker inputs', async () => {
    await render(
      <Drawer.Root open modal={false}>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup>
                <input data-testid="input" type="date" />
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>,
    );

    const input = screen.getByTestId('input');
    const focusSpy = vi.spyOn(input, 'focus');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => input;

    try {
      fireEvent.touchStart(input, {
        touches: [
          createTouch(input, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      const touchEnd = createNativeTouchEnd(input, {
        clientX: 0,
        clientY: 0,
      });

      await act(async () => {
        input.dispatchEvent(touchEnd);
        await flushMicrotasks();
      });

      expect(touchEnd.defaultPrevented).toBe(false);
      expect(focusSpy).not.toHaveBeenCalled();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      focusSpy.mockRestore();
    }
  });

  it.skipIf(isJSDOM)(
    'preserves native taps that lift over a neighboring interactive element',
    async () => {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup>
                  <input data-testid="input" type="text" />
                  <button data-testid="button" type="button">
                    Action
                  </button>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const input = screen.getByTestId('input');
      const button = screen.getByTestId('button');
      const focusSpy = vi.spyOn(input, 'focus');
      const inputClickEvents: MouseEvent[] = [];
      input.addEventListener('click', (clickEvent) => {
        inputClickEvents.push(clickEvent as MouseEvent);
      });
      const originalElementFromPoint = document.elementFromPoint;
      // The finger lifts over the button, but `touchend.target` stays on the
      // touchstart input on mobile, so the lift point must win over the fallback.
      document.elementFromPoint = () => button;

      try {
        fireEvent.touchStart(input, {
          touches: [createTouch(input, { clientX: 0, clientY: 0 })],
        });

        // The native touchend is still dispatched on the touchstart input.
        const touchEnd = createNativeTouchEnd(input, { clientX: 5, clientY: 5 });

        await act(async () => {
          input.dispatchEvent(touchEnd);
          await flushMicrotasks();
        });

        expect(touchEnd.defaultPrevented).toBe(false);
        expect(focusSpy).not.toHaveBeenCalled();
        expect(inputClickEvents).toHaveLength(0);
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        focusSpy.mockRestore();
      }
    },
  );

  it.skipIf(isJSDOM)('preserves native taps on disabled inputs', async () => {
    await render(
      <Drawer.Root open modal={false}>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup>
                <input data-testid="input" type="text" disabled />
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>,
    );

    const input = screen.getByTestId('input');
    const focusSpy = vi.spyOn(input, 'focus');
    const clickEvents: MouseEvent[] = [];
    input.addEventListener('click', (clickEvent) => {
      clickEvents.push(clickEvent);
    });
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => input;

    try {
      fireEvent.touchStart(input, {
        touches: [createTouch(input, { clientX: 0, clientY: 0 })],
      });

      const touchEnd = createNativeTouchEnd(input, { clientX: 0, clientY: 0 });

      await act(async () => {
        input.dispatchEvent(touchEnd);
        await flushMicrotasks();
      });

      expect(touchEnd.defaultPrevented).toBe(false);
      expect(focusSpy).not.toHaveBeenCalled();
      expect(clickEvents).toHaveLength(0);
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      focusSpy.mockRestore();
    }
  });

  it.skipIf(isJSDOM)('preserves native taps on disabled textareas', async () => {
    await render(
      <Drawer.Root open modal={false}>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup>
                <textarea data-testid="input" disabled />
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>,
    );

    const input = screen.getByTestId('input');
    const focusSpy = vi.spyOn(input, 'focus');
    const clickEvents: MouseEvent[] = [];
    input.addEventListener('click', (clickEvent) => {
      clickEvents.push(clickEvent);
    });
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => input;

    try {
      fireEvent.touchStart(input, {
        touches: [createTouch(input, { clientX: 0, clientY: 0 })],
      });

      const touchEnd = createNativeTouchEnd(input, { clientX: 0, clientY: 0 });

      await act(async () => {
        input.dispatchEvent(touchEnd);
        await flushMicrotasks();
      });

      expect(touchEnd.defaultPrevented).toBe(false);
      expect(focusSpy).not.toHaveBeenCalled();
      expect(clickEvents).toHaveLength(0);
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      focusSpy.mockRestore();
    }
  });

  it.skipIf(isJSDOM)('preserves native taps on a disabled labelled control', async () => {
    await render(
      <Drawer.Root open modal={false}>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup>
                <label data-testid="label" htmlFor="note">
                  Note
                </label>
                <input data-testid="input" id="note" type="text" disabled />
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>,
    );

    const label = screen.getByTestId('label');
    const input = screen.getByTestId('input');
    const focusSpy = vi.spyOn(input, 'focus');
    const labelClickEvents: MouseEvent[] = [];
    label.addEventListener('click', (clickEvent) => {
      labelClickEvents.push(clickEvent);
    });
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => label;

    try {
      fireEvent.touchStart(label, {
        touches: [createTouch(label, { clientX: 24, clientY: 48 })],
      });

      const touchEnd = createNativeTouchEnd(label, { clientX: 24, clientY: 48 });

      await act(async () => {
        label.dispatchEvent(touchEnd);
        await flushMicrotasks();
      });

      expect(touchEnd.defaultPrevented).toBe(false);
      expect(focusSpy).not.toHaveBeenCalled();
      expect(labelClickEvents).toHaveLength(0);
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      focusSpy.mockRestore();
    }
  });

  it.skipIf(isJSDOM)(
    'focuses a keyboard input with data-base-ui-swipe-ignore without starting drawer swipe',
    async () => {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Backdrop data-testid="backdrop" />
              <Drawer.Viewport>
                <Drawer.Popup>
                  <input data-testid="input" data-base-ui-swipe-ignore type="text" />
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const backdrop = screen.getByTestId('backdrop');
      const input = screen.getByTestId('input');
      const focusSpy = vi.spyOn(input, 'focus');
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => input;

      try {
        fireEvent.touchStart(input, {
          touches: [
            createTouch(input, {
              clientX: 0,
              clientY: 0,
            }),
          ],
        });

        await flushMicrotasks();

        expect(backdrop).not.toHaveAttribute('data-swiping');

        const touchEnd = createNativeTouchEnd(input, {
          clientX: 0,
          clientY: 0,
        });

        await act(async () => {
          input.dispatchEvent(touchEnd);
          await flushMicrotasks();
        });

        expect(touchEnd.defaultPrevented).toBe(true);
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        expect(backdrop).not.toHaveAttribute('data-swiping');
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        focusSpy.mockRestore();
      }
    },
  );

  it.skipIf(isJSDOM)('does not focus a keyboard input on touchend without touchstart', async () => {
    await render(
      <Drawer.Root open modal={false}>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup>
                <input data-testid="input" type="text" />
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>,
    );

    const input = screen.getByTestId('input');
    const focusSpy = vi.spyOn(input, 'focus');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => input;

    try {
      const touchEnd = createNativeTouchEnd(input, {
        clientX: 0,
        clientY: 0,
      });

      await act(async () => {
        input.dispatchEvent(touchEnd);
        await flushMicrotasks();
      });

      expect(touchEnd.defaultPrevented).toBe(false);
      expect(focusSpy).not.toHaveBeenCalled();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      focusSpy.mockRestore();
    }
  });

  it.skipIf(isJSDOM)('does not focus a keyboard input after touchcancel', async () => {
    await render(
      <Drawer.Root open modal={false}>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup>
                <input data-testid="input" type="text" />
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>,
    );

    const input = screen.getByTestId('input');
    const focusSpy = vi.spyOn(input, 'focus');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => input;

    try {
      fireEvent.touchStart(input, {
        touches: [
          createTouch(input, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      const touchCancel = createNativeTouchCancel(input, {
        clientX: 0,
        clientY: 0,
      });

      await act(async () => {
        input.dispatchEvent(touchCancel);
        await flushMicrotasks();
      });

      const touchEnd = createNativeTouchEnd(input, {
        clientX: 0,
        clientY: 0,
      });

      await act(async () => {
        input.dispatchEvent(touchEnd);
        await flushMicrotasks();
      });

      expect(touchEnd.defaultPrevented).toBe(false);
      expect(focusSpy).not.toHaveBeenCalled();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      focusSpy.mockRestore();
    }
  });

  it.skipIf(isJSDOM)('does not focus a keyboard input while a nested drawer is open', async () => {
    await render(
      <Drawer.Root open modal={false}>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup data-testid="parent-popup">
                <input data-testid="input" type="text" />
                <Drawer.Root open modal={false}>
                  <Drawer.Portal>
                    <Drawer.Viewport>
                      <Drawer.Popup>
                        <button type="button">Nested action</button>
                      </Drawer.Popup>
                    </Drawer.Viewport>
                  </Drawer.Portal>
                </Drawer.Root>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>,
    );

    const input = screen.getByTestId('input');
    const parentPopup = screen.getByTestId('parent-popup');
    const focusSpy = vi.spyOn(input, 'focus');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => input;

    try {
      await waitFor(() => {
        expect(parentPopup).toHaveAttribute('data-nested-drawer-open', '');
      });

      fireEvent.touchStart(input, {
        touches: [
          createTouch(input, {
            clientX: 0,
            clientY: 0,
          }),
        ],
      });

      const touchEnd = createNativeTouchEnd(input, {
        clientX: 0,
        clientY: 0,
      });

      await act(async () => {
        input.dispatchEvent(touchEnd);
        await flushMicrotasks();
      });

      expect(touchEnd.defaultPrevented).toBe(false);
      expect(focusSpy).not.toHaveBeenCalled();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      focusSpy.mockRestore();
    }
  });

  it.skipIf(isJSDOM)('preserves native taps on an already-focused keyboard input', async () => {
    const restoreInnerHeight = mockWindowInnerHeight(800);
    const visualViewport = mockVisualViewport(500);

    try {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup>
                  <input data-testid="input" type="text" />
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const input = screen.getByTestId('input');

      await act(async () => {
        input.focus();
      });

      const focusSpy = vi.spyOn(input, 'focus');
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => input;

      try {
        fireEvent.touchStart(input, {
          touches: [
            createTouch(input, {
              clientX: 0,
              clientY: 0,
            }),
          ],
        });

        const touchEnd = createNativeTouchEnd(input, {
          clientX: 0,
          clientY: 0,
        });

        await act(async () => {
          input.dispatchEvent(touchEnd);
          await flushMicrotasks();
        });

        expect(touchEnd.defaultPrevented).toBe(false);
        expect(focusSpy).not.toHaveBeenCalled();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        focusSpy.mockRestore();
      }
    } finally {
      visualViewport.restore();
      restoreInnerHeight();
    }
  });

  it.skipIf(isJSDOM)(
    'refocuses an already-focused keyboard input when the keyboard viewport is closed',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <input data-testid="input" type="text" />
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const input = screen.getByTestId('input');

        await act(async () => {
          input.focus();
        });

        const focusSpy = vi.spyOn(input, 'focus');
        const blurSpy = vi.spyOn(input, 'blur');
        const originalElementFromPoint = document.elementFromPoint;
        document.elementFromPoint = () => input;

        try {
          fireEvent.touchStart(input, {
            touches: [createTouch(input, { clientX: 0, clientY: 0 })],
          });

          const touchEnd = createNativeTouchEnd(input, {
            clientX: 0,
            clientY: 0,
          });

          await act(async () => {
            input.dispatchEvent(touchEnd);
            await flushMicrotasks();
          });

          expect(touchEnd.defaultPrevented).toBe(true);
          expect(blurSpy).toHaveBeenCalledTimes(1);
          expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
        } finally {
          document.elementFromPoint = originalElementFromPoint;
          blurSpy.mockRestore();
          focusSpy.mockRestore();
        }
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'overrides the incoming field geometry when focus moves without a tap while the keyboard is open',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <input data-testid="first" type="text" />
                    <input data-testid="second" type="text" />
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const first = screen.getByTestId('first');
        const second = screen.getByTestId('second');

        await act(async () => {
          first.focus();
          visualViewport.resize(500);
        });

        // The provider's capture-phase focusout listener runs before this bubble-phase one,
        // so the geometry override must already be applied when it fires.
        let transformDuringFocusChange: string | null = null;
        const onFocusOut = () => {
          transformDuringFocusChange = second.style.transform;
        };
        document.addEventListener('focusout', onFocusOut);
        const blurSpy = vi.spyOn(second, 'blur');

        try {
          // Simulates the iOS keyboard's next-field arrow: focus moves with no touch events.
          await act(async () => {
            second.focus();
          });

          expect(transformDuringFocusChange).toContain('translateY');
          expect(second.style.transform).toBe('');
          expect(second.style.opacity).toBe('');
          expect(blurSpy).not.toHaveBeenCalled();
          expect(second).toHaveFocus();
        } finally {
          document.removeEventListener('focusout', onFocusOut);
          blurSpy.mockRestore();
        }
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'centers a field focused without a tap inside the scrollable body',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <Drawer.Content
                      data-testid="scroll"
                      style={{ height: 420, overflowY: 'auto', paddingBottom: 20 }}
                    >
                      <input data-testid="first" type="text" />
                      <div style={{ height: 900 }} />
                      <input data-testid="second" type="text" />
                    </Drawer.Content>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const scroll = screen.getByTestId('scroll');
        const first = screen.getByTestId('first');
        const second = screen.getByTestId('second');

        Object.defineProperties(scroll, {
          clientHeight: { configurable: true, value: 420 },
          scrollHeight: { configurable: true, value: 1200 },
        });
        scroll.getBoundingClientRect = () =>
          ({
            top: 300,
            bottom: 720,
            height: 420,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: 300,
            toJSON: () => {},
          }) as DOMRect;
        // `first` sits at the center of the visible band above the keyboard, so the
        // initial alignment leaves the scroll position at 0.
        first.getBoundingClientRect = () => {
          const top = 380 - scroll.scrollTop;
          return {
            top,
            bottom: top + 40,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          } as DOMRect;
        };
        second.getBoundingClientRect = () => {
          const top = 650 - scroll.scrollTop;
          return {
            top,
            bottom: top + 40,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          } as DOMRect;
        };
        scroll.scrollTo = ((options?: ScrollToOptions | number) => {
          if (typeof options === 'object' && options !== null && options.top !== undefined) {
            scroll.scrollTop = options.top;
          }
        }) as typeof scroll.scrollTo;

        const keyboardViewportHeight = 500;
        await act(async () => {
          first.focus();
          scroll.scrollTop = 0;
          visualViewport.resize(keyboardViewportHeight);
        });

        // Simulates the iOS keyboard's next-field arrow: focus moves with no touch events.
        await act(async () => {
          second.focus();
        });

        await waitFor(() => {
          const scrollRect = scroll.getBoundingClientRect();
          const secondRect = second.getBoundingClientRect();
          const secondCenter = (secondRect.top + secondRect.bottom) / 2;
          const visibleCenter = (scrollRect.top + keyboardViewportHeight) / 2;
          expect(secondCenter).toBeCloseTo(visibleCenter, 0);
        });
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'does not restart a progressing or settled reduced-motion alignment scroll',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);
      const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockImplementation(
        (query) =>
          ({
            matches: query === '(prefers-reduced-motion: reduce)',
          }) as MediaQueryList,
      );
      vi.useFakeTimers();

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <Drawer.Content
                      data-testid="scroll"
                      style={{ height: 420, overflowY: 'auto', paddingBottom: 20 }}
                    >
                      <input data-testid="first" type="text" />
                      <div style={{ height: 900 }} />
                      <input data-testid="second" type="text" />
                    </Drawer.Content>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const scroll = screen.getByTestId('scroll');
        const first = screen.getByTestId('first');
        const second = screen.getByTestId('second');

        Object.defineProperties(scroll, {
          clientHeight: { configurable: true, value: 420 },
          scrollHeight: { configurable: true, value: 1200 },
        });
        scroll.getBoundingClientRect = () =>
          ({
            top: 300,
            bottom: 720,
            height: 420,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: 300,
            toJSON: () => {},
          }) as DOMRect;
        first.getBoundingClientRect = () => {
          const top = 380 - scroll.scrollTop;
          return {
            top,
            bottom: top + 40,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          } as DOMRect;
        };
        second.getBoundingClientRect = () => {
          const top = 650 - scroll.scrollTop;
          return {
            top,
            bottom: top + 40,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          } as DOMRect;
        };
        const scrollToSpy = vi.fn();
        scroll.scrollTo = scrollToSpy as unknown as typeof scroll.scrollTo;

        await act(async () => {
          first.focus();
          visualViewport.resize(500);
        });

        scrollToSpy.mockClear();

        await act(async () => {
          second.focus();
          vi.advanceTimersToNextFrame();
          vi.advanceTimersToNextFrame();
        });

        expect(scrollToSpy).toHaveBeenCalledWith({ top: 270, behavior: 'auto' });

        scroll.scrollTop = 100;
        await act(async () => {
          await vi.advanceTimersByTimeAsync(150);
        });
        expect(scrollToSpy).toHaveBeenCalledTimes(1);

        scroll.scrollTop = 270;
        await act(async () => {
          await vi.runAllTimersAsync();
        });

        expect(scroll.scrollTop).toBe(270);
        expect(scrollToSpy).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
        matchMediaSpy.mockRestore();
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    're-issues the alignment scroll when a delayed realign pass finds it stalled',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <Drawer.Content
                      data-testid="scroll"
                      style={{ height: 420, overflowY: 'auto', paddingBottom: 20 }}
                    >
                      <input data-testid="first" type="text" />
                      <div style={{ height: 900 }} />
                      <input data-testid="second" type="text" />
                    </Drawer.Content>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const scroll = screen.getByTestId('scroll');
        const first = screen.getByTestId('first');
        const second = screen.getByTestId('second');

        Object.defineProperties(scroll, {
          clientHeight: { configurable: true, value: 420 },
          scrollHeight: { configurable: true, value: 1200 },
        });
        scroll.getBoundingClientRect = () =>
          ({
            top: 300,
            bottom: 720,
            height: 420,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: 300,
            toJSON: () => {},
          }) as DOMRect;
        first.getBoundingClientRect = () => {
          const top = 380 - scroll.scrollTop;
          return {
            top,
            bottom: top + 40,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          } as DOMRect;
        };
        second.getBoundingClientRect = () => {
          const top = 650 - scroll.scrollTop;
          return {
            top,
            bottom: top + 40,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          } as DOMRect;
        };
        // The mock never moves, standing in for a smooth scroll canceled by WebKit's
        // native reveal resolution: a later realign pass must re-issue it.
        const scrollToSpy = vi.fn();
        scroll.scrollTo = scrollToSpy as unknown as typeof scroll.scrollTo;

        await act(async () => {
          first.focus();
          visualViewport.resize(500);
        });

        scrollToSpy.mockClear();

        await act(async () => {
          second.focus();
        });

        await waitFor(() => {
          expect(scrollToSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
        });
        expect(scrollToSpy).toHaveBeenLastCalledWith(expect.objectContaining({ top: 270 }));
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'stops pending realignment once the user starts scrolling while geometry is changing',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);
      vi.useFakeTimers();

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <Drawer.Content
                      data-testid="scroll"
                      style={{ height: 420, overflowY: 'auto', paddingBottom: 20 }}
                    >
                      <input data-testid="first" type="text" />
                      <div style={{ height: 900 }} />
                      <input data-testid="second" type="text" />
                    </Drawer.Content>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const scroll = screen.getByTestId('scroll');
        const first = screen.getByTestId('first');
        const second = screen.getByTestId('second');

        Object.defineProperties(scroll, {
          clientHeight: { configurable: true, value: 420 },
          scrollHeight: { configurable: true, value: 1200 },
        });
        let scrollBottom = 380;
        scroll.getBoundingClientRect = () =>
          ({
            top: 300,
            bottom: scrollBottom,
            height: scrollBottom - 300,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: 300,
            toJSON: () => {},
          }) as DOMRect;
        first.getBoundingClientRect = () => {
          const top = 380 - scroll.scrollTop;
          return {
            top,
            bottom: top + 40,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          } as DOMRect;
        };
        second.getBoundingClientRect = () => {
          const top = 650 - scroll.scrollTop;
          return {
            top,
            bottom: top + 40,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          } as DOMRect;
        };
        // The mock never moves, standing in for a smooth scroll canceled by WebKit's native
        // reveal resolution — the exact stall a delayed pass would re-issue. A user scroll
        // stops at a stationary position the same way, so a pointer going down must cancel the
        // passes rather than let one mistake the manual scroll for a canceled reveal and yank
        // the drawer back to center.
        const scrollToSpy = vi.fn();
        scroll.scrollTo = scrollToSpy as unknown as typeof scroll.scrollTo;

        await act(async () => {
          first.focus();
          visualViewport.resize(500);
        });

        scrollToSpy.mockClear();

        await act(async () => {
          second.focus();
          // Let the first settle check observe the squeezed body before the user takes over.
          vi.advanceTimersToNextFrame();
          scroll.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

          // The body continues expanding after pointer-down, then the destination settles.
          // A live frame loop would eventually center the field against the final geometry.
          for (const bottom of [400, 440, 480, 480]) {
            scrollBottom = bottom;
            vi.advanceTimersToNextFrame();
          }

          await vi.runAllTimersAsync();
        });

        // Pointer-down cancels both the pending frame alignment and delayed passes.
        expect(scrollToSpy).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)('clears keyboard state when a tapped input redirects focus away', async () => {
    const restoreInnerHeight = mockWindowInnerHeight(800);
    const visualViewport = mockVisualViewport(500);
    vi.useFakeTimers();

    try {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport data-testid="viewport">
                <Drawer.Popup>
                  <input data-testid="input" type="text" />
                  <button data-testid="other" type="button" />
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const viewport = screen.getByTestId('viewport');
      const input = screen.getByTestId('input');
      const other = screen.getByTestId('other');

      // A consumer redirects focus off the field the moment it focuses (validation,
      // auto-advance, composite focus). Listening on `focusin` at the target matches React's
      // `onFocus`: it runs after the provider's capture-phase `focusin` has already recorded
      // the input, so the provider must reconcile when focus lands on a non-keyboard element.
      input.addEventListener('focusin', () => {
        other.focus();
      });

      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => input;

      try {
        fireEvent.touchStart(input, {
          touches: [createTouch(input, { clientX: 12, clientY: 34 })],
        });

        const touchEnd = createNativeTouchEnd(input, { clientX: 12, clientY: 34 });
        await act(async () => {
          input.dispatchEvent(touchEnd);
          await flushMicrotasks();
          await vi.runAllTimersAsync();
        });

        // Focus stays on the redirected element and the drawer left no keyboard inset
        // behind for the abandoned input.
        expect(other).toHaveFocus();
        expect(viewport.style.getPropertyValue('--drawer-keyboard-inset')).toBe('0px');
      } finally {
        document.elementFromPoint = originalElementFromPoint;
      }
    } finally {
      vi.useRealTimers();
      visualViewport.restore();
      restoreInnerHeight();
    }
  });

  it.skipIf(isJSDOM)('clears keyboard state when a tapped input blurs itself', async () => {
    const restoreInnerHeight = mockWindowInnerHeight(800);
    const visualViewport = mockVisualViewport(500);

    try {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport data-testid="viewport">
                <Drawer.Popup>
                  <Drawer.Content
                    data-testid="scroll"
                    style={{
                      height: 420,
                      overflowY: 'auto',
                      overflowAnchor: 'auto',
                      paddingBottom: 20,
                    }}
                  >
                    <div style={{ height: 900 }} />
                    <input data-testid="input" type="text" />
                  </Drawer.Content>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const viewport = screen.getByTestId('viewport');
      const scroll = screen.getByTestId('scroll');
      const input = screen.getByTestId('input');

      Object.defineProperties(scroll, {
        clientHeight: { configurable: true, value: 420 },
        scrollHeight: { configurable: true, value: 1200 },
      });
      scroll.getBoundingClientRect = () =>
        ({
          top: 300,
          bottom: 720,
          height: 420,
          left: 0,
          right: 320,
          width: 320,
          x: 0,
          y: 300,
          toJSON: () => {},
        }) as DOMRect;
      input.getBoundingClientRect = () =>
        ({
          top: 650,
          bottom: 690,
          height: 40,
          left: 0,
          right: 320,
          width: 320,
          x: 0,
          y: 650,
          toJSON: () => {},
        }) as DOMRect;

      // A consumer that opens its own picker instead of the software keyboard blurs the field
      // from `onFocus`. The `focusout` arrives before `.focus()` returns, and focus ends on the
      // body, so no `focusin` follows to reconcile from: that `focusout` is the provider's only
      // chance to drop the field. Focus does eventually return to the popup, but only on a
      // later task, so a retained target keeps aligning against the blurred field until then.
      input.addEventListener('focusin', () => {
        input.blur();
      });

      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => input;

      try {
        fireEvent.touchStart(input, {
          touches: [createTouch(input, { clientX: 12, clientY: 34 })],
        });

        const touchEnd = createNativeTouchEnd(input, { clientX: 12, clientY: 34 });
        await act(async () => {
          input.dispatchEvent(touchEnd);
          // Let the frame-scheduled alignment run: it is what applies the inset and slack to a
          // target the `focusout` failed to clear.
          await flushAnimationFrames(3);
        });

        expect(input).not.toHaveFocus();
        expect(viewport.style.getPropertyValue('--drawer-keyboard-inset')).toBe('0px');
        expect(scroll.style.paddingBottom).toBe('20px');
        expect(scroll.style.scrollPaddingBottom).toBe('');
      } finally {
        document.elementFromPoint = originalElementFromPoint;
      }
    } finally {
      visualViewport.restore();
      restoreInnerHeight();
    }
  });

  it.skipIf(isJSDOM)('defers the alignment scroll until the destination stops moving', async () => {
    const restoreInnerHeight = mockWindowInnerHeight(800);
    const visualViewport = mockVisualViewport(800);
    vi.useFakeTimers();

    try {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup>
                  <Drawer.Content data-testid="scroll" style={{ height: 420, overflowY: 'auto' }}>
                    <div style={{ height: 900 }} />
                    <input data-testid="input" type="text" />
                  </Drawer.Content>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const scroll = screen.getByTestId('scroll');
      const input = screen.getByTestId('input');

      Object.defineProperties(scroll, {
        clientHeight: { configurable: true, value: 420 },
        scrollHeight: { configurable: true, value: 1200 },
      });
      // The scroller's bottom edge moves after focus (like a footer resizing over a
      // CSS transition): squeezed at first, settled a frame later.
      let scrollBottom = 380;
      scroll.getBoundingClientRect = () =>
        ({
          top: 300,
          bottom: scrollBottom,
          height: scrollBottom - 300,
          left: 0,
          right: 320,
          width: 320,
          x: 0,
          y: 300,
          toJSON: () => {},
        }) as DOMRect;
      input.getBoundingClientRect = () => {
        const top = 650 - scroll.scrollTop;
        return {
          top,
          bottom: top + 40,
          height: 40,
          left: 0,
          right: 320,
          width: 320,
          x: 0,
          y: top,
          toJSON: () => {},
        } as DOMRect;
      };
      const scrollToSpy = vi.fn((options?: ScrollToOptions | number) => {
        if (typeof options === 'object' && options !== null && options.top !== undefined) {
          scroll.scrollTop = options.top;
        }
      });
      scroll.scrollTo = scrollToSpy as unknown as typeof scroll.scrollTo;

      await act(async () => {
        visualViewport.resize(500);
      });

      await act(async () => {
        input.focus();
      });

      // Let the first alignment check measure the squeezed geometry, then settle it.
      await act(async () => {
        vi.advanceTimersToNextFrame();
        scrollBottom = 480;
        await vi.runAllTimersAsync();
      });

      // Squeezed destination: visible band [316, 364] → center 340, input center 670
      // → scrollTop 330. Settled: band [316, 464] → center 390 → scrollTop 280. The
      // squeezed destination must never be scrolled to.
      expect(scroll.scrollTop).toBe(280);
      expect(scrollToSpy).toHaveBeenCalledTimes(1);
      expect(scrollToSpy).not.toHaveBeenCalledWith(expect.objectContaining({ top: 330 }));
    } finally {
      vi.useRealTimers();
      visualViewport.restore();
      restoreInnerHeight();
    }
  });

  it.skipIf(isJSDOM)('eventually aligns when geometry never settles', async () => {
    const restoreInnerHeight = mockWindowInnerHeight(800);
    const visualViewport = mockVisualViewport(500);
    vi.useFakeTimers();

    try {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup initialFocus={false}>
                  <div data-testid="scroll" style={{ height: 420, overflowY: 'auto' }}>
                    <input data-testid="input" type="text" />
                  </div>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const scroll = screen.getByTestId('scroll');
      const input = screen.getByTestId('input');
      let geometryTick = 0;
      Object.defineProperties(scroll, {
        clientHeight: { configurable: true, value: 420 },
        scrollHeight: { configurable: true, value: 1200 },
      });
      scroll.getBoundingClientRect = () => {
        geometryTick += 1;
        const top = geometryTick % 2 === 0 ? 100 : 200;
        return {
          top,
          bottom: top + 300,
          height: 300,
          left: 0,
          right: 320,
          width: 320,
          x: 0,
          y: top,
          toJSON: () => {},
        } as DOMRect;
      };
      input.getBoundingClientRect = () =>
        ({
          top: 650,
          bottom: 690,
          height: 40,
          left: 0,
          right: 320,
          width: 320,
          x: 0,
          y: 650,
          toJSON: () => {},
        }) as DOMRect;
      const scrollToSpy = vi.fn();
      scroll.scrollTo = scrollToSpy as unknown as typeof scroll.scrollTo;

      await act(async () => {
        input.focus();
        for (let index = 0; index < 65; index += 1) {
          vi.advanceTimersToNextFrame();
        }
      });

      expect(scrollToSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
      visualViewport.restore();
      restoreInnerHeight();
    }
  });

  it.skipIf(isJSDOM)(
    'realigns a tapped field in the scrollable body when the keyboard is already open for a field outside it',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <Drawer.Content data-testid="scroll" style={{ height: 420, overflowY: 'auto' }}>
                      <div style={{ height: 900 }} />
                      <textarea data-testid="textarea" />
                    </Drawer.Content>
                    <div>
                      <input data-testid="footer-input" type="text" />
                    </div>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const scroll = screen.getByTestId('scroll');
        const textarea = screen.getByTestId('textarea');
        const footerInput = screen.getByTestId('footer-input');

        Object.defineProperties(scroll, {
          clientHeight: { configurable: true, value: 420 },
          scrollHeight: { configurable: true, value: 1200 },
        });
        // The scroller is squeezed while the footer field holds focus (the demo footer
        // grows by the keyboard inset via `:focus-within`); it expands back over a CSS
        // transition once focus moves into the body.
        let scrollBottom = 380;
        scroll.getBoundingClientRect = () =>
          ({
            top: 100,
            bottom: scrollBottom,
            height: scrollBottom - 100,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: 100,
            toJSON: () => {},
          }) as DOMRect;
        textarea.getBoundingClientRect = () => {
          const top = 650 - scroll.scrollTop;
          return {
            top,
            bottom: top + 40,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          } as DOMRect;
        };
        scroll.scrollTo = ((options?: ScrollToOptions | number) => {
          if (typeof options === 'object' && options !== null && options.top !== undefined) {
            scroll.scrollTop = options.top;
          }
        }) as typeof scroll.scrollTo;

        const keyboardViewportHeight = 500;
        await act(async () => {
          footerInput.focus();
          visualViewport.resize(keyboardViewportHeight);
        });

        const originalElementFromPoint = document.elementFromPoint;
        document.elementFromPoint = () => textarea;

        try {
          fireEvent.touchStart(textarea, {
            touches: [createTouch(textarea, { clientX: 24, clientY: 300 })],
          });

          await act(async () => {
            textarea.dispatchEvent(createNativeTouchEnd(textarea, { clientX: 24, clientY: 300 }));
            await flushMicrotasks();
          });

          expect(textarea).toHaveFocus();

          // The frame-scheduled pass centers against the squeezed geometry:
          // visible band [116, 364] → center 240, textarea center 670 → scrollTop 430.
          await waitFor(() => {
            expect(scroll.scrollTop).toBe(430);
          });

          // The footer's shrink transition settles; only the delayed realign passes see
          // the expanded scroller (the keyboard stays open, so no viewport events fire).
          scrollBottom = 480;

          await waitFor(() => {
            const scrollRect = scroll.getBoundingClientRect();
            const textareaRect = textarea.getBoundingClientRect();
            const textareaCenter = (textareaRect.top + textareaRect.bottom) / 2;
            const visibleCenter =
              (scrollRect.top + Math.min(scrollRect.bottom, keyboardViewportHeight)) / 2;
            expect(textareaCenter).toBeCloseTo(visibleCenter, 0);
          });
        } finally {
          document.elementFromPoint = originalElementFromPoint;
        }
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'does not blur and re-focus for focus changes while the keyboard is closed',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <input data-testid="first" type="text" />
                    <input data-testid="second" type="text" />
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const first = screen.getByTestId('first');
        const second = screen.getByTestId('second');

        await act(async () => {
          first.focus();
        });

        const blurSpy = vi.spyOn(second, 'blur');
        const focusSpy = vi.spyOn(second, 'focus');

        try {
          await act(async () => {
            second.focus();
          });

          expect(blurSpy).not.toHaveBeenCalled();
          expect(focusSpy).toHaveBeenCalledTimes(1);
          expect(second).toHaveFocus();
        } finally {
          blurSpy.mockRestore();
          focusSpy.mockRestore();
        }
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'restores the page scroll position when a modal drawer page scrolls while the keyboard is open',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);
      const originalScrollYDescriptor = Object.getOwnPropertyDescriptor(window, 'scrollY');

      try {
        await render(
          <Drawer.Root open>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <input data-testid="input" type="text" />
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const input = screen.getByTestId('input');

        await act(async () => {
          input.focus();
          visualViewport.resize(500);
        });

        const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

        try {
          // Simulates WebKit's native reveal scroll escaping the scroll lock.
          Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 });
          window.dispatchEvent(new Event('scroll'));

          // Must restore instantly so the following measurements read the resting page; the
          // two-argument form would obey a global `scroll-behavior: smooth` and animate.
          expect(scrollToSpy).toHaveBeenCalledWith({ left: 0, top: 0, behavior: 'instant' });
        } finally {
          scrollToSpy.mockRestore();
          if (originalScrollYDescriptor) {
            Object.defineProperty(window, 'scrollY', originalScrollYDescriptor);
          }
        }
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'does not restore the page scroll position for a non-modal drawer',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);
      const originalScrollYDescriptor = Object.getOwnPropertyDescriptor(window, 'scrollY');

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <input data-testid="input" type="text" />
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const input = screen.getByTestId('input');

        await act(async () => {
          input.focus();
          visualViewport.resize(500);
        });

        const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

        try {
          Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 });
          window.dispatchEvent(new Event('scroll'));

          expect(scrollToSpy).not.toHaveBeenCalled();
        } finally {
          scrollToSpy.mockRestore();
          if (originalScrollYDescriptor) {
            Object.defineProperty(window, 'scrollY', originalScrollYDescriptor);
          }
        }
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'does not treat a small visual viewport reduction as the software keyboard',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport data-testid="viewport">
                  <Drawer.Popup>
                    <Drawer.Content
                      data-testid="scroll"
                      style={{ height: 420, overflowY: 'auto', paddingBottom: 20 }}
                    >
                      <div style={{ height: 900 }} />
                      <input data-testid="input" type="text" />
                    </Drawer.Content>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const viewport = screen.getByTestId('viewport');
        const scroll = screen.getByTestId('scroll');
        const input = screen.getByTestId('input');

        Object.defineProperties(scroll, {
          clientHeight: { configurable: true, value: 420 },
          scrollHeight: { configurable: true, value: 1200 },
        });

        // A reduction of 50px is below KEYBOARD_RESIZE_THRESHOLD (60px), so it is treated as
        // browser chrome movement rather than the software keyboard: no inset, no scroll slack.
        await act(async () => {
          input.focus();
          visualViewport.resize(750);
        });

        await waitFor(() => {
          expect(viewport.style.getPropertyValue('--drawer-keyboard-inset')).toBe('0px');
        });
        expect(scroll.style.paddingBottom).toBe('20px');
        expect(scroll.style.overflowAnchor).toBe('');
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'computes the keyboard inset from a non-zero visual viewport offset',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport data-testid="viewport">
                  <Drawer.Popup>
                    <input data-testid="input" type="text" />
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const viewport = screen.getByTestId('viewport');
        const input = screen.getByTestId('input');

        await act(async () => {
          input.focus();
          // The visual viewport shrinks to 500 and is offset 40px down within the layout viewport.
          visualViewport.scroll(40, 500);
        });

        await waitFor(() => {
          // inset = innerHeight - min(innerHeight, offsetTop + height) = 800 - (40 + 500) = 260.
          expect(viewport.style.getPropertyValue('--drawer-keyboard-inset')).toBe('260px');
        });
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)('focuses the labelled control when a label is tapped', async () => {
    await render(
      <Drawer.Root open modal={false}>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup>
                <label data-testid="label" htmlFor="note">
                  Note
                </label>
                <input data-testid="input" id="note" type="text" />
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>,
    );

    const label = screen.getByTestId('label');
    const input = screen.getByTestId('input');
    const focusSpy = vi.spyOn(input, 'focus');
    const labelClickEvents: MouseEvent[] = [];
    label.addEventListener('click', (clickEvent) => {
      labelClickEvents.push(clickEvent);
    });
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => label;

    try {
      fireEvent.touchStart(label, {
        touches: [createTouch(label, { clientX: 24, clientY: 48 })],
      });

      const touchEnd = createNativeTouchEnd(label, { clientX: 24, clientY: 48 });

      await act(async () => {
        label.dispatchEvent(touchEnd);
        await flushMicrotasks();
      });

      expect(touchEnd.defaultPrevented).toBe(true);
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
      expect(labelClickEvents).toHaveLength(1);
      expect(labelClickEvents[0].clientX).toBe(24);
      expect(labelClickEvents[0].clientY).toBe(48);
      expect(labelClickEvents[0].detail).toBe(1);
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      focusSpy.mockRestore();
    }
  });

  it.skipIf(isJSDOM)('focuses a contentEditable element on touchend', async () => {
    await render(
      <Drawer.Root open modal={false}>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup>
                <div data-testid="editor" contentEditable suppressContentEditableWarning>
                  Edit me
                </div>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>,
    );

    const editor = screen.getByTestId('editor');
    const focusSpy = vi.spyOn(editor, 'focus');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => editor;

    try {
      fireEvent.touchStart(editor, {
        touches: [createTouch(editor, { clientX: 0, clientY: 0 })],
      });

      const touchEnd = createNativeTouchEnd(editor, { clientX: 0, clientY: 0 });

      await act(async () => {
        editor.dispatchEvent(touchEnd);
        await flushMicrotasks();
      });

      expect(touchEnd.defaultPrevented).toBe(true);
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      focusSpy.mockRestore();
    }
  });

  it.skipIf(isJSDOM)(
    'focuses the editing host when tapping a nested element inside a contentEditable',
    async () => {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup>
                  <div data-testid="editor" contentEditable suppressContentEditableWarning>
                    <span data-testid="inner">Edit me</span>
                  </div>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const editor = screen.getByTestId('editor');
      const inner = screen.getByTestId('inner');
      const originalElementFromPoint = document.elementFromPoint;
      // Taps on rich-text content land on inherited-editable descendants, which are
      // not focusable themselves; the editing host must receive focus instead.
      document.elementFromPoint = () => inner;

      try {
        fireEvent.touchStart(inner, {
          touches: [createTouch(inner, { clientX: 0, clientY: 0 })],
        });

        const touchEnd = createNativeTouchEnd(inner, { clientX: 0, clientY: 0 });

        await act(async () => {
          inner.dispatchEvent(touchEnd);
          await flushMicrotasks();
        });

        expect(touchEnd.defaultPrevented).toBe(true);
        expect(editor).toHaveFocus();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
      }
    },
  );

  it.skipIf(isJSDOM)(
    'probes nearby points to resolve a keyboard input retargeted on touchend',
    async () => {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup>
                  <div data-testid="wrapper" style={{ padding: 20 }}>
                    <input data-testid="input" type="text" />
                  </div>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const wrapper = screen.getByTestId('wrapper');
      const input = screen.getByTestId('input');
      const focusSpy = vi.spyOn(input, 'focus');
      const originalElementFromPoint = document.elementFromPoint;
      // The tap point resolves to the wrapper; only a point 16px below resolves to the input,
      // so the input can only be found via the hit-slop probe (not the native event target).
      document.elementFromPoint = ((x: number, y: number) =>
        y === 16 ? input : wrapper) as typeof document.elementFromPoint;

      try {
        fireEvent.touchStart(wrapper, {
          touches: [createTouch(wrapper, { clientX: 0, clientY: 0 })],
        });

        const touchEnd = createNativeTouchEnd(wrapper, { clientX: 0, clientY: 0 });

        await act(async () => {
          wrapper.dispatchEvent(touchEnd);
          await flushMicrotasks();
        });

        expect(touchEnd.defaultPrevented).toBe(true);
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        focusSpy.mockRestore();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'does not focus a keyboard input when the touch moves past the tap threshold',
    async () => {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup>
                  <input data-testid="input" type="text" />
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const input = screen.getByTestId('input');
      const focusSpy = vi.spyOn(input, 'focus');
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => input;

      try {
        fireEvent.touchStart(input, {
          touches: [createTouch(input, { clientX: 0, clientY: 0 })],
        });

        // Moving past INPUT_TAP_MOVE_THRESHOLD (10px) marks the gesture as a scroll, not a tap.
        fireEvent.touchMove(input, {
          touches: [createTouch(input, { clientX: 0, clientY: 80 })],
        });

        const touchEnd = createNativeTouchEnd(input, { clientX: 0, clientY: 80 });

        await act(async () => {
          input.dispatchEvent(touchEnd);
          await flushMicrotasks();
        });

        expect(touchEnd.defaultPrevented).toBe(false);
        expect(focusSpy).not.toHaveBeenCalled();

        fireEvent.touchStart(input, {
          touches: [createTouch(input, { clientX: 0, clientY: 0 })],
        });
        fireEvent.touchMove(input, {
          touches: [createTouch(input, { clientX: 0, clientY: 5 })],
        });
        const shortMoveTouchEnd = createNativeTouchEnd(input, { clientX: 0, clientY: 5 });
        await act(async () => {
          input.dispatchEvent(shortMoveTouchEnd);
          await flushMicrotasks();
        });

        expect(shortMoveTouchEnd.defaultPrevented).toBe(true);
        expect(input).toHaveFocus();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        focusSpy.mockRestore();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'restores the previous scroll slack when focus moves to a different scroll container',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(800);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup>
                    <div
                      data-testid="scroll1"
                      style={{ height: 200, overflowY: 'auto', paddingBottom: 10 }}
                    >
                      <div style={{ height: 600 }} />
                      <input data-testid="input1" type="text" />
                    </div>
                    <div
                      data-testid="scroll2"
                      style={{ height: 200, overflowY: 'auto', paddingBottom: 10 }}
                    >
                      <div style={{ height: 600 }} />
                      <input data-testid="input2" type="text" />
                    </div>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const scroll1 = screen.getByTestId('scroll1');
        const scroll2 = screen.getByTestId('scroll2');
        const input1 = screen.getByTestId('input1');
        const input2 = screen.getByTestId('input2');

        const rectFor = (top: number) => () =>
          ({
            top,
            bottom: top + 40,
            height: 40,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          }) as DOMRect;

        for (const scroll of [scroll1, scroll2]) {
          Object.defineProperties(scroll, {
            clientHeight: { configurable: true, value: 200 },
            scrollHeight: { configurable: true, value: 800 },
          });
        }
        // Both containers extend below the reduced viewport bottom (500), so each needs slack.
        scroll1.getBoundingClientRect = rectFor(520);
        scroll2.getBoundingClientRect = rectFor(560);
        input1.getBoundingClientRect = rectFor(540);
        input2.getBoundingClientRect = rectFor(580);

        await act(async () => {
          input1.focus();
          visualViewport.resize(500);
        });

        await waitFor(() => {
          expect(Number.parseFloat(scroll1.style.paddingBottom)).toBeGreaterThan(10);
        });

        await act(async () => {
          input2.focus();
        });

        await waitFor(() => {
          expect(Number.parseFloat(scroll2.style.paddingBottom)).toBeGreaterThan(10);
        });
        expect(scroll1.style.paddingBottom).toBe('10px');
        expect(scroll1.style.overflowAnchor).toBe('');
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'does not steal a tap that lands on an interactive element near a keyboard input',
    async () => {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup>
                  <input data-testid="input" type="text" />
                  <button data-testid="clear" type="button">
                    Clear
                  </button>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const input = screen.getByTestId('input');
      const clear = screen.getByTestId('clear');
      const focusSpy = vi.spyOn(input, 'focus');
      const originalElementFromPoint = document.elementFromPoint;
      // The tap lands exactly on the button; only the hit-slop probe points
      // resolve to the input. The probe must not steal the button's tap.
      document.elementFromPoint = ((x: number, y: number) =>
        x === 0 && y === 0 ? clear : input) as typeof document.elementFromPoint;

      try {
        fireEvent.touchStart(clear, {
          touches: [createTouch(clear, { clientX: 0, clientY: 0 })],
        });

        const touchEnd = createNativeTouchEnd(clear, { clientX: 0, clientY: 0 });

        await act(async () => {
          clear.dispatchEvent(touchEnd);
          await flushMicrotasks();
        });

        expect(touchEnd.defaultPrevented).toBe(false);
        expect(focusSpy).not.toHaveBeenCalled();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        focusSpy.mockRestore();
      }
    },
  );

  it.skipIf(isJSDOM)('preserves native taps on keyboard inputs while pinch-zoomed', async () => {
    const restoreInnerHeight = mockWindowInnerHeight(800);
    const visualViewport = mockVisualViewport(800);

    try {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup>
                  <input data-testid="input" type="text" />
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const input = screen.getByTestId('input');
      const focusSpy = vi.spyOn(input, 'focus');
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => input;

      await act(async () => {
        visualViewport.setScale(1.5);
      });

      try {
        fireEvent.touchStart(input, {
          touches: [createTouch(input, { clientX: 0, clientY: 0 })],
        });

        const touchEnd = createNativeTouchEnd(input, { clientX: 0, clientY: 0 });

        await act(async () => {
          input.dispatchEvent(touchEnd);
          await flushMicrotasks();
        });

        expect(touchEnd.defaultPrevented).toBe(false);
        expect(focusSpy).not.toHaveBeenCalled();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        focusSpy.mockRestore();
      }
    } finally {
      visualViewport.restore();
      restoreInnerHeight();
    }
  });

  it.skipIf(isJSDOM)(
    'restores slack from a removed scroll container before adjusting a new one',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(500);

      try {
        await render(
          <Drawer.Root open modal={false}>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup initialFocus={false}>
                    <div data-testid="scroll1" style={{ overflowY: 'auto', paddingBottom: 10 }}>
                      <input data-testid="input1" type="text" />
                    </div>
                    <div data-testid="scroll2" style={{ overflowY: 'auto' }}>
                      <input data-testid="input2" type="text" />
                    </div>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const scroll1 = screen.getByTestId('scroll1');
        const scroll2 = screen.getByTestId('scroll2');
        const input1 = screen.getByTestId('input1');
        const input2 = screen.getByTestId('input2');
        const rect = (top: number, bottom: number) =>
          ({
            top,
            bottom,
            height: bottom - top,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => {},
          }) as DOMRect;

        for (const scroll of [scroll1, scroll2]) {
          Object.defineProperties(scroll, {
            clientHeight: { configurable: true, value: 200 },
            scrollHeight: { configurable: true, value: 800 },
          });
          scroll.getBoundingClientRect = () => rect(300, 700);
        }
        input1.getBoundingClientRect = () => rect(620, 660);
        input2.getBoundingClientRect = () => rect(620, 660);

        await act(async () => {
          input1.focus();
          visualViewport.resize(500);
        });
        await waitFor(() => {
          expect(Number.parseFloat(scroll1.style.paddingBottom)).toBeGreaterThan(10);
        });

        Object.defineProperty(scroll1, 'isConnected', { configurable: true, value: false });
        await act(async () => {
          input2.focus();
        });

        await waitFor(() => {
          expect(Number.parseFloat(scroll2.style.paddingBottom)).toBeGreaterThan(0);
        });
        expect(scroll1.style.paddingBottom).toBe('10px');
        expect(scroll1.style.overflowAnchor).toBe('');
      } finally {
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)('clears inset and slack when the focused field is removed', async () => {
    const restoreInnerHeight = mockWindowInnerHeight(800);
    const visualViewport = mockVisualViewport(500);

    try {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport data-testid="viewport">
                <Drawer.Popup initialFocus={false}>
                  <div data-testid="scroll" style={{ overflowY: 'auto', paddingBottom: 10 }}>
                    <input data-testid="input" type="text" />
                  </div>
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const viewport = screen.getByTestId('viewport');
      const scroll = screen.getByTestId('scroll');
      const input = screen.getByTestId('input');
      Object.defineProperties(scroll, {
        clientHeight: { configurable: true, value: 200 },
        scrollHeight: { configurable: true, value: 800 },
      });
      scroll.getBoundingClientRect = () =>
        ({ top: 300, bottom: 700, left: 0, right: 320, width: 320, height: 400 }) as DOMRect;
      input.getBoundingClientRect = () =>
        ({ top: 620, bottom: 660, left: 0, right: 320, width: 320, height: 40 }) as DOMRect;

      await act(async () => {
        input.focus();
        visualViewport.resize(500);
      });
      await waitFor(() => {
        expect(Number.parseFloat(scroll.style.paddingBottom)).toBeGreaterThan(10);
      });

      const nativeContains = viewport.contains.bind(viewport);
      viewport.contains = (candidate) => (candidate === input ? false : nativeContains(candidate));
      await act(async () => {
        visualViewport.resize(490);
        await flushAnimationFrames(2);
      });

      expect(viewport.style.getPropertyValue('--drawer-keyboard-inset')).toBe('0px');
      expect(scroll.style.paddingBottom).toBe('10px');
    } finally {
      visualViewport.restore();
      restoreInnerHeight();
    }
  });

  it.skipIf(isJSDOM)(
    'captures an initially focused input without attempting an unnecessary page restore',
    async () => {
      const restoreInnerHeight = mockWindowInnerHeight(800);
      const visualViewport = mockVisualViewport(500);
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      try {
        await render(
          <Drawer.Root open>
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport data-testid="viewport">
                  <Drawer.Popup initialFocus={false}>
                    <input autoFocus data-testid="input" type="text" />
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        expect(screen.getByTestId('input')).toHaveFocus();
        await waitFor(() => {
          expect(
            screen.getByTestId('viewport').style.getPropertyValue('--drawer-keyboard-inset'),
          ).toBe('300px');
        });
        expect(scrollToSpy).not.toHaveBeenCalled();
      } finally {
        scrollToSpy.mockRestore();
        visualViewport.restore();
        restoreInnerHeight();
      }
    },
  );

  it.skipIf(isJSDOM)(
    'ignores a directly captured touch target while a closed drawer remains mounted',
    async () => {
      const originalElementFromPoint = document.elementFromPoint;

      try {
        await render(
          <Drawer.Root
            defaultOpen
            modal={false}
            onOpenChange={(nextOpen, eventDetails) => {
              if (!nextOpen) {
                eventDetails.preventUnmountOnClose();
              }
            }}
          >
            <Drawer.VirtualKeyboardProvider>
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup initialFocus={false} data-testid="popup">
                    <DirectVirtualKeyboardTouchTarget />
                    <Drawer.Close>Close</Drawer.Close>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.VirtualKeyboardProvider>
          </Drawer.Root>,
        );

        const input = screen.getByTestId('input');
        document.elementFromPoint = () => input;

        await act(async () => {
          screen.getByRole('button', { name: 'Close' }).click();
        });
        await waitFor(() => {
          expect(screen.getByTestId('popup')).toHaveAttribute('data-closed', '');
        });

        fireEvent.touchStart(input, {
          touches: [createTouch(input, { clientX: 0, clientY: 0 })],
        });
        fireEvent.touchMove(input, { touches: [] });
        input.dispatchEvent(createNativeTouchEnd(input, { clientX: 0, clientY: 0 }));

        expect(input).not.toHaveFocus();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
      }
    },
  );

  it.skipIf(isJSDOM)('does not focus a lift-point target outside the drawer', async () => {
    await render(
      <div>
        <input data-testid="outside" type="text" />
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup initialFocus={false}>
                  <input data-testid="inside" type="text" />
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>
      </div>,
    );

    const inside = screen.getByTestId('inside');
    const outside = screen.getByTestId('outside');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => outside;

    try {
      fireEvent.touchStart(inside, {
        touches: [createTouch(inside, { clientX: 0, clientY: 0 })],
      });
      inside.dispatchEvent(createNativeTouchEnd(inside, { clientX: 0, clientY: 0 }));

      expect(inside).not.toHaveFocus();
      expect(outside).not.toHaveFocus();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it.skipIf(isJSDOM)('falls back to the touch target when point lookup misses', async () => {
    await render(
      <Drawer.Root open modal={false}>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup initialFocus={false}>
                <input data-testid="input" type="text" />
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>,
    );

    const input = screen.getByTestId('input');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => null;

    try {
      fireEvent.touchStart(input, {
        touches: [createTouch(input, { clientX: 0, clientY: 0 })],
      });
      const touchEnd = createNativeTouchEnd(input, { clientX: 0, clientY: 0 });
      input.dispatchEvent(touchEnd);

      expect(touchEnd.defaultPrevented).toBe(true);
      expect(input).toHaveFocus();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it.skipIf(isJSDOM)(
    'uses the remaining touch and MouseEvent fallback for keyboard taps',
    async () => {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport>
                <Drawer.Popup initialFocus={false}>
                  <input data-testid="input" type="text" />
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      const input = screen.getByTestId('input');
      const originalElementFromPoint = document.elementFromPoint;
      const pointerEventDescriptor = Object.getOwnPropertyDescriptor(window, 'PointerEvent');
      document.elementFromPoint = () => null;
      Object.defineProperty(window, 'PointerEvent', { configurable: true, value: undefined });

      try {
        fireEvent.touchStart(input, {
          touches: [createTouch(input, { clientX: 10, clientY: 20 })],
        });
        const touchEnd = new Event('touchend', { bubbles: true, cancelable: true });
        Object.defineProperties(touchEnd, {
          changedTouches: { configurable: true, value: [] },
          touches: {
            configurable: true,
            value: [createTouch(input, { clientX: 10, clientY: 20 })],
          },
        });
        input.dispatchEvent(touchEnd);

        expect(touchEnd.defaultPrevented).toBe(true);
        expect(input).toHaveFocus();
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        if (pointerEventDescriptor) {
          Object.defineProperty(window, 'PointerEvent', pointerEventDescriptor);
        }
      }
    },
  );

  it.skipIf(isJSDOM)('ignores a keyboard tap whose native target is not an element', async () => {
    await render(
      <Drawer.Root open modal={false}>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup initialFocus={false}>
                <input data-testid="input" type="text" />
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>,
    );

    const input = screen.getByTestId('input');
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => null;

    try {
      fireEvent.touchStart(input, {
        touches: [createTouch(input, { clientX: 10, clientY: 20 })],
      });
      const touchEnd = createNativeTouchEnd(input, { clientX: 10, clientY: 20 });
      touchEnd.composedPath = () => [window];
      input.dispatchEvent(touchEnd);

      expect(touchEnd.defaultPrevented).toBe(false);
      expect(input).not.toHaveFocus();
    } finally {
      document.elementFromPoint = originalElementFromPoint;
    }
  });

  it.skipIf(isJSDOM)('ignores touchend without a lift coordinate', async () => {
    await render(
      <Drawer.Root open modal={false}>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup initialFocus={false}>
                <input data-testid="input" type="text" />
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>,
    );

    const input = screen.getByTestId('input');
    fireEvent.touchStart(input, {
      touches: [createTouch(input, { clientX: 10, clientY: 20 })],
    });
    await act(async () => {
      const touchEnd = new Event('touchend', { bubbles: true, cancelable: true });
      Object.defineProperties(touchEnd, {
        changedTouches: { configurable: true, value: [] },
        touches: { configurable: true, value: [] },
      });
      input.dispatchEvent(touchEnd);
      await flushMicrotasks();
    });

    expect(input).not.toHaveFocus();
  });

  it.skipIf(isJSDOM)('does not align inputs when visualViewport is unavailable', async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'visualViewport');
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });

    try {
      await render(
        <Drawer.Root open modal={false}>
          <Drawer.VirtualKeyboardProvider>
            <Drawer.Portal>
              <Drawer.Viewport data-testid="viewport">
                <Drawer.Popup initialFocus={false}>
                  <input data-testid="input" type="text" />
                </Drawer.Popup>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.VirtualKeyboardProvider>
        </Drawer.Root>,
      );

      await act(async () => {
        screen.getByTestId('input').focus();
        await flushAnimationFrames(2);
      });

      expect(screen.getByTestId('viewport').style.getPropertyValue('--drawer-keyboard-inset')).toBe(
        '0px',
      );
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, 'visualViewport', originalDescriptor);
      }
    }
  });
});
