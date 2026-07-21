import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Drawer } from '@base-ui/react/drawer';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

const useIdMockState = vi.hoisted(() => ({ returnUndefined: false }));

vi.mock('@base-ui/utils/useId', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/useId')>('@base-ui/utils/useId');
  return {
    ...actual,
    useId(...args: Parameters<typeof actual.useId>) {
      const id = actual.useId(...args);
      return useIdMockState.returnUndefined ? undefined : id;
    },
  };
});

type Point = {
  x: number;
  y: number;
};

type SwipeInput = 'pointer' | 'touch';

type SwipeOptions = {
  beforeRelease?: (() => Promise<unknown>) | (() => unknown);
  input?: SwipeInput;
  timeStepMs?: number;
  startTimeMs?: number;
};

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

function dispatchTouchPointerEvent(element: Element, type: string) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerType: { value: 'touch' },
    pointerId: { value: 1 },
    button: { value: 0 },
    buttons: { value: type === 'pointerup' || type === 'pointercancel' ? 0 : 1 },
    clientX: { value: 0 },
    clientY: { value: 0 },
  });
  element.dispatchEvent(event);
}

async function swipe(element: HTMLElement, start: Point, end: Point, options: SwipeOptions = {}) {
  const stepX = start.x + (end.x === start.x ? 0 : Math.sign(end.x - start.x));
  const stepY = start.y + (end.y === start.y ? 0 : Math.sign(end.y - start.y));
  const { beforeRelease, input = 'pointer', timeStepMs, startTimeMs = 0 } = options;
  const useTimeStamp = input === 'pointer' && typeof timeStepMs === 'number';
  let timeStamp = startTimeMs;

  if (input === 'touch') {
    fireEvent.touchStart(element, {
      bubbles: true,
      touches: [
        createTouch(element, {
          clientX: start.x,
          clientY: start.y,
        }),
      ],
    });

    await flushMicrotasks();

    fireEvent.touchMove(element, {
      bubbles: true,
      touches: [
        createTouch(element, {
          clientX: stepX,
          clientY: stepY,
        }),
      ],
    });

    await flushMicrotasks();

    fireEvent.touchMove(element, {
      bubbles: true,
      touches: [
        createTouch(element, {
          clientX: end.x,
          clientY: end.y,
        }),
      ],
    });

    await flushMicrotasks();

    if (beforeRelease) {
      await beforeRelease();
      await flushMicrotasks();
    }

    fireEvent.touchEnd(element, {
      bubbles: true,
      changedTouches: [
        createTouch(element, {
          clientX: end.x,
          clientY: end.y,
        }),
      ],
    });

    await flushMicrotasks();
    return;
  }

  fireEvent.pointerDown(element, {
    button: 0,
    buttons: 1,
    pointerId: 1,
    clientX: start.x,
    clientY: start.y,
    pointerType: 'mouse',
    ...(useTimeStamp ? { timeStamp } : null),
  });

  await flushMicrotasks();

  if (useTimeStamp) {
    timeStamp += timeStepMs;
  }

  fireEvent.pointerMove(element, {
    pointerId: 1,
    clientX: stepX,
    clientY: stepY,
    buttons: 1,
    pointerType: 'mouse',
    ...(useTimeStamp ? { timeStamp } : null),
  });

  await flushMicrotasks();

  if (useTimeStamp) {
    timeStamp += timeStepMs;
  }

  fireEvent.pointerMove(element, {
    pointerId: 1,
    clientX: end.x,
    clientY: end.y,
    buttons: 1,
    pointerType: 'mouse',
    ...(useTimeStamp ? { timeStamp } : null),
  });

  await flushMicrotasks();

  if (beforeRelease) {
    await beforeRelease();
    await flushMicrotasks();
  }

  if (useTimeStamp) {
    timeStamp += timeStepMs;
  }

  fireEvent.pointerUp(element, {
    pointerId: 1,
    clientX: end.x,
    clientY: end.y,
    pointerType: 'mouse',
    ...(useTimeStamp ? { timeStamp } : null),
  });

  await flushMicrotasks();
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function nextMacrotask() {
  return wait(0);
}

// A real outside press always begins with a `pointerdown`; the swipe-open guard relies on that
// fresh press to distinguish a deliberate dismissal from the `click` synthesized by the gesture's
// own `pointerup`.
function pressOutside(target: Element = document.body) {
  fireEvent.pointerDown(target, { button: 0, buttons: 1, pointerType: 'mouse' });
  fireEvent.pointerUp(target, { button: 0, buttons: 0, pointerType: 'mouse' });
  fireEvent.click(target);
}

// A real touch tap dispatches `pointerdown` alongside `touchstart`/`touchend`, so the swipe-open
// guard re-enables on that fresh `pointerdown` before the dismissal fires — touch outside presses
// dismiss just like mouse ones.
function pressOutsideTouch(target: Element = document.body) {
  const touch = createTouch(target, { clientX: 0, clientY: 0 });
  fireEvent.pointerDown(target, { button: 0, buttons: 1, pointerId: 1, pointerType: 'touch' });
  fireEvent.touchStart(target, { touches: [touch] });
  fireEvent.touchEnd(target, { changedTouches: [touch], touches: [] });
  fireEvent.pointerUp(target, { button: 0, buttons: 0, pointerId: 1, pointerType: 'touch' });
  fireEvent.click(target);
}

async function swipeUp(element: HTMLElement, startY: number, endY: number, options?: SwipeOptions) {
  return swipe(element, { x: 10, y: startY }, { x: 10, y: endY }, options);
}

async function swipeLeft(
  element: HTMLElement,
  startX: number,
  endX: number,
  options?: SwipeOptions,
) {
  return swipe(element, { x: startX, y: 10 }, { x: endX, y: 10 }, options);
}

describe('<Drawer.SwipeArea />', () => {
  beforeAll(function beforeHook() {
    // PointerEvent not fully implemented in jsdom, causing fireEvent.pointer* to ignore options.
    // https://github.com/jsdom/jsdom/issues/2527
    (window as any).PointerEvent = window.MouseEvent;
  });

  const { render } = createRenderer();

  describeConformance(<Drawer.SwipeArea />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Drawer.Root>{node}</Drawer.Root>);
    },
  }));

  it('opens the drawer when swiped in the open direction', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    expect(swipeArea).toHaveAttribute('data-closed', '');

    await swipeUp(swipeArea, 120, 40);

    expect(swipeArea).toHaveAttribute('data-open', '');
  });

  it('does not open when the swipe direction never locks to the open direction', async () => {
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root onOpenChange={handleOpenChange}>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    await swipe(swipeArea, { x: 10, y: 120 }, { x: 70, y: 118 });

    expect(swipeArea).toHaveAttribute('data-closed', '');
    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('prevents default pointer down for non-touch swipes', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );

    const notCancelled = fireEvent.pointerDown(screen.getByTestId('swipe-area'), {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      pointerType: 'mouse',
    });

    expect(notCancelled).toBe(false);
  });

  it('does not open the drawer when disabled', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" disabled />
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    await swipeUp(swipeArea, 120, 40);

    expect(swipeArea).toHaveAttribute('data-closed', '');
  });

  it('respects custom swipeDirection', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" swipeDirection="left" />
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    await swipeLeft(swipeArea, 120, 40);

    expect(swipeArea).toHaveAttribute('data-open', '');
  });

  it('synchronizes overshoot styles across the popup, backdrop, and provider indent', async () => {
    await render(
      <Drawer.Provider>
        <Drawer.Indent data-testid="indent" />
        <Drawer.Root>
          <Drawer.SwipeArea data-testid="swipe-area" swipeDirection="left" />
          <Drawer.Portal>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport>
              <Drawer.Popup
                data-testid="popup"
                ref={(element) => {
                  if (element) {
                    Object.defineProperties(element, {
                      offsetHeight: { configurable: true, value: 100 },
                      offsetWidth: { configurable: true, value: 100 },
                    });
                  }
                }}
              >
                Drawer
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </Drawer.Provider>,
    );

    const swipeArea = screen.getByTestId('swipe-area');
    const indent = screen.getByTestId('indent');

    await swipeLeft(swipeArea, 200, -50, {
      async beforeRelease() {
        const popup = screen.getByTestId('popup');
        const backdrop = screen.getByTestId('backdrop');

        expect(
          Number.parseFloat(popup.style.getPropertyValue('--drawer-swipe-movement-x')),
        ).toBeCloseTo(-Math.sqrt(150));
        expect(popup.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('0px');
        expect(popup.style.transition).toBe('none');
        expect(backdrop).toHaveAttribute('data-swiping', '');
        expect(backdrop.style.getPropertyValue('--drawer-height')).toBe('100px');
        expect(indent.style.getPropertyValue('--drawer-swipe-progress')).toBe('1');
        expect(indent.style.getPropertyValue('--drawer-height')).toBe('100px');

        fireEvent.pointerMove(swipeArea, {
          buttons: 1,
          pointerId: 1,
          clientX: 200,
          clientY: 0,
          pointerType: 'mouse',
        });
        await flushMicrotasks();
        expect(indent.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
        expect(indent.style.getPropertyValue('--drawer-height')).toBe('');

        fireEvent.pointerMove(swipeArea, {
          buttons: 1,
          pointerId: 1,
          clientX: -50,
          clientY: 0,
          pointerType: 'mouse',
        });
        await flushMicrotasks();
      },
    });

    expect(screen.getByTestId('backdrop')).not.toHaveAttribute('data-swiping');
    expect(screen.getByTestId('backdrop').style.getPropertyValue('--drawer-swipe-progress')).toBe(
      '0',
    );
    expect(indent.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
    expect(indent.style.getPropertyValue('--drawer-height')).toBe('');
  });

  it('opens from the rendered transform distance in either horizontal direction', async () => {
    await render(
      <Drawer.Root swipeDirection="left">
        <Drawer.SwipeArea data-testid="swipe-area" swipeDirection="right" />
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup
              data-testid="popup"
              style={{ transform: 'matrix(1, 0, 0, 1, 60, 0)' }}
              ref={(element) => {
                if (element) {
                  Object.defineProperty(element, 'offsetWidth', {
                    configurable: true,
                    value: 100,
                  });
                }
              }}
            >
              Drawer
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await swipe(
      screen.getByTestId('swipe-area'),
      { x: 0, y: 10 },
      { x: 40, y: 10 },
      {
        beforeRelease() {
          expect(
            Number.parseFloat(
              screen.getByTestId('popup').style.getPropertyValue('--drawer-swipe-movement-x'),
            ),
          ).toBeCloseTo(-20);
        },
      },
    );

    expect(screen.getByTestId('swipe-area')).toHaveAttribute('data-open', '');
  });

  it('omits frontmost height when an opening drawer has no measured height', async () => {
    await render(
      <Drawer.Provider>
        <Drawer.Indent data-testid="indent" />
        <Drawer.Root>
          <Drawer.SwipeArea data-testid="swipe-area" swipeDirection="left" />
          <Drawer.Portal>
            <Drawer.Backdrop data-testid="backdrop" />
            <Drawer.Viewport>
              <Drawer.Popup
                ref={(element) => {
                  if (element) {
                    Object.defineProperties(element, {
                      offsetHeight: { configurable: true, value: 0 },
                      offsetWidth: { configurable: true, value: 100 },
                    });
                  }
                }}
              >
                Drawer
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </Drawer.Provider>,
    );

    await swipeLeft(screen.getByTestId('swipe-area'), 100, 40, {
      beforeRelease() {
        expect(screen.getByTestId('backdrop').style.getPropertyValue('--drawer-height')).toBe('');
        expect(screen.getByTestId('indent').style.getPropertyValue('--drawer-height')).toBe('');
      },
    });
  });

  it('does not apply or close swipe state when a controlled parent rejects opening', async () => {
    const handleOpenChange = vi.fn();
    await render(
      <Drawer.Root open={false} onOpenChange={handleOpenChange}>
        <Drawer.SwipeArea data-testid="swipe-area" />
        <Drawer.Portal keepMounted>
          <Drawer.Viewport>
            <Drawer.Popup
              data-testid="popup"
              ref={(element) => {
                if (element) {
                  Object.defineProperty(element, 'offsetHeight', {
                    configurable: true,
                    value: 100,
                  });
                }
              }}
            >
              Drawer
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    await swipeUp(screen.getByTestId('swipe-area'), 120, 110, {
      startTimeMs: 1000,
      timeStepMs: 1000,
    });

    expect(handleOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(handleOpenChange).not.toHaveBeenCalledWith(false, expect.anything());
    expect(screen.getByTestId('popup')).not.toHaveAttribute('data-swiping');
    expect(screen.getByTestId('popup').style.getPropertyValue('--drawer-swipe-movement-y')).toBe(
      '0px',
    );
  });

  it('cancels an active opening gesture when the swipe area becomes disabled', async () => {
    function TestCase({ disabled }: { disabled: boolean }) {
      return (
        <Drawer.Root>
          <Drawer.SwipeArea
            data-testid="swipe-area"
            disabled={disabled}
            ref={(element) => {
              if (element) {
                Object.defineProperty(element, 'offsetHeight', {
                  configurable: true,
                  value: 100,
                });
              }
            }}
          />
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup
                data-testid="popup"
                ref={(element) => {
                  if (element) {
                    Object.defineProperty(element, 'offsetHeight', {
                      configurable: true,
                      value: 100,
                    });
                  }
                }}
              >
                Drawer
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      );
    }

    const { setProps } = await render(<TestCase disabled={false} />);
    const swipeArea = screen.getByTestId('swipe-area');

    fireEvent.pointerDown(swipeArea, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 0,
      clientY: 100,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(swipeArea, {
      buttons: 1,
      pointerId: 1,
      clientX: 0,
      clientY: 99,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(swipeArea, {
      buttons: 1,
      pointerId: 1,
      clientX: 0,
      clientY: 60,
      pointerType: 'mouse',
    });
    await flushMicrotasks();
    expect(screen.getByTestId('popup')).toHaveAttribute('data-swiping', '');

    await setProps({ disabled: true });
    expect(screen.getByTestId('popup')).not.toHaveAttribute('data-swiping');
    expect(swipeArea).toHaveAttribute('data-disabled', '');
  });

  it('does not prevent a non-cancelable pointer start', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );

    const event = new Event('pointerdown', { bubbles: true, cancelable: false });
    Object.defineProperties(event, {
      pointerType: { value: 'mouse' },
      pointerId: { value: 1 },
      button: { value: 0 },
      buttons: { value: 1 },
      clientX: { value: 0 },
      clientY: { value: 0 },
    });

    let dispatched = false;
    await act(async () => {
      dispatched = screen.getByTestId('swipe-area').dispatchEvent(event);
      await flushMicrotasks();
    });
    expect(dispatched).toBe(true);
    expect(event.defaultPrevented).toBe(false);

    fireEvent.pointerCancel(screen.getByTestId('swipe-area'), {
      pointerType: 'mouse',
      pointerId: 1,
    });
    await flushMicrotasks();
  });

  it('ignores compatibility touch pointer events and handles pointer cancellation', async () => {
    const handleOpenChange = vi.fn();
    await render(
      <Drawer.Root onOpenChange={handleOpenChange}>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );
    const swipeArea = screen.getByTestId('swipe-area');

    dispatchTouchPointerEvent(swipeArea, 'pointerdown');
    dispatchTouchPointerEvent(swipeArea, 'pointermove');
    dispatchTouchPointerEvent(swipeArea, 'pointerup');
    dispatchTouchPointerEvent(swipeArea, 'pointercancel');
    expect(handleOpenChange).not.toHaveBeenCalled();

    fireEvent.pointerDown(swipeArea, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      pointerType: 'mouse',
    });
    fireEvent.pointerCancel(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      pointerType: 'mouse',
    });

    expect(swipeArea).toHaveAttribute('data-closed', '');
    expect(swipeArea).not.toHaveAttribute('data-swiping');
  });

  it('works before a generated swipe area id is available', async () => {
    useIdMockState.returnUndefined = true;

    try {
      await render(
        <Drawer.Root>
          <Drawer.SwipeArea data-testid="swipe-area" />
        </Drawer.Root>,
      );
      const swipeArea = screen.getByTestId('swipe-area');

      expect(swipeArea).not.toHaveAttribute('id');
      await swipeUp(swipeArea, 120, 40);
      expect(swipeArea).toHaveAttribute('data-open', '');
    } finally {
      useIdMockState.returnUndefined = false;
    }
  });

  it('opens the drawer when swiped with touch events', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    await swipeUp(swipeArea, 120, 40, { input: 'touch' });

    expect(swipeArea).toHaveAttribute('data-open', '');
    expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');
  });

  it('applies data-swiping during an active swipe gesture', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    await swipeUp(swipeArea, 120, 40, {
      beforeRelease() {
        expect(swipeArea).toHaveAttribute('data-swiping', '');
      },
    });

    expect(swipeArea).not.toHaveAttribute('data-swiping');
  });

  it('re-enables outside press dismissal after opening by swipe', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    await swipeUp(swipeArea, 120, 40, { input: 'touch' });

    expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');

    await act(async () => {
      await nextMacrotask();
    });

    pressOutside();

    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBe(null);
    });

    expect(swipeArea).toHaveAttribute('data-closed', '');
  });

  it('re-enables outside press dismissal for a touch outside press after opening by swipe', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    await swipeUp(swipeArea, 120, 40, { input: 'touch' });

    expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');

    await act(async () => {
      await nextMacrotask();
    });

    // A touch outside press fires `pointerdown` alongside `touchstart`/`touchend`, so it must
    // re-enable dismissal and close the swipe-opened drawer the same way a mouse press does.
    pressOutsideTouch();

    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBe(null);
    });

    expect(swipeArea).toHaveAttribute('data-closed', '');
  });

  it('does not dismiss from the click synthesized by the swipe-open pointerup', async () => {
    // Dragging past the popup releases the pointer outside it, so the gesture's own pointerup
    // synthesizes a `click` over the backdrop. That click (which has no fresh pointerdown) must not
    // be read as an outside press and dismiss the drawer that was just opened — even when it lands a
    // macrotask later, after a timer-based re-enable would have fired.
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    await swipeUp(swipeArea, 120, 40);

    expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');

    await act(async () => {
      await nextMacrotask();
    });

    // Trailing synthesized click with no preceding fresh pointerdown.
    fireEvent.click(document.body);

    await act(async () => {
      await nextMacrotask();
    });

    expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');
  });

  it('re-enables outside press dismissal after an interrupted swipe-open gesture', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    fireEvent.pointerDown(swipeArea, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      pointerType: 'mouse',
    });

    await flushMicrotasks();

    fireEvent.pointerMove(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 119,
      buttons: 1,
      pointerType: 'mouse',
    });

    await flushMicrotasks();

    fireEvent.pointerMove(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 80,
      buttons: 1,
      pointerType: 'mouse',
    });

    await flushMicrotasks();

    expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');
    expect(swipeArea).toHaveAttribute('data-open', '');

    fireEvent.pointerMove(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 60,
      buttons: 2,
      pointerType: 'mouse',
    });

    await flushMicrotasks();

    await act(async () => {
      await nextMacrotask();
    });

    pressOutside();

    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBe(null);
    });

    expect(swipeArea).toHaveAttribute('data-closed', '');
  });

  it('re-enables outside press dismissal after a context menu interrupts swipe-open', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    fireEvent.pointerDown(swipeArea, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      pointerType: 'mouse',
    });

    await flushMicrotasks();

    fireEvent.pointerMove(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 119,
      buttons: 1,
      pointerType: 'mouse',
    });

    await flushMicrotasks();

    fireEvent.pointerMove(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 80,
      buttons: 1,
      pointerType: 'mouse',
    });

    await flushMicrotasks();

    expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');

    fireEvent.pointerMove(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 60,
      buttons: 2,
      pointerType: 'mouse',
    });

    await flushMicrotasks();

    fireEvent.contextMenu(swipeArea, {
      button: 2,
      clientX: 10,
      clientY: 60,
    });

    await act(async () => {
      await nextMacrotask();
    });

    pressOutside();

    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBe(null);
    });
  });

  it.skipIf(isJSDOM)('uses a size-based swipe threshold by default', async () => {
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup" style={{ height: 200 }}>
              Drawer
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');
    const slowSwipe = {
      async beforeRelease() {
        const popup = await screen.findByTestId('popup');
        Object.defineProperty(popup, 'offsetHeight', { value: 200, configurable: true });
        // Age the last drag sample past the flick-velocity window so distance decides the outcome.
        await act(async () => {
          await wait(81);
        });
      },
    };

    await swipeUp(swipeArea, 200, 130, slowSwipe);

    expect(swipeArea).toHaveAttribute('data-closed', '');

    await swipeUp(swipeArea, 200, 80, slowSwipe);

    expect(swipeArea).toHaveAttribute('data-open', '');
  });

  it.skipIf(isJSDOM)(
    'keeps the swipe-area movement on the popup when re-grabbed during close',
    async () => {
      // Regression guard for the swipe-area re-grab flash. When the swipe area drives the open, the
      // popup's `--drawer-swipe-movement-*` are written imperatively by `applySwipeMovement`, but
      // the viewport's open-reset effect would otherwise zero them
      // (`resetSwipe` -> `syncDragStyles(false)`) on the same commit that flips `open` true,
      // flashing the popup fully open for a frame. The shared `swipeAreaActiveRef` must make the
      // viewport skip that reset while the swipe area owns the gesture.
      //
      // The flash only reproduces on a *re-grab*, i.e. when the popup is already mounted as the open
      // commit lands. A real exit animation keeps the popup mounted (`mounted` stays true) through
      // the close, so the re-grab below drives a fresh open while it is still in the DOM.
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const style = `
        @keyframes swipe-regrab-exit {
          to {
            opacity: 0;
          }
        }

        .swipe-regrab-popup {
          height: 200px;
        }

        .swipe-regrab-popup[data-ending-style] {
          animation: swipe-regrab-exit 200ms;
        }
      `;

      try {
        await render(
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <Drawer.Root>
              <Drawer.SwipeArea data-testid="swipe-area" />
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup className="swipe-regrab-popup" data-testid="popup">
                    <Drawer.Close>Close</Drawer.Close>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.Root>
          </div>,
        );

        const swipeArea = screen.getByTestId('swipe-area');

        await swipeUp(swipeArea, 220, 20);
        expect(swipeArea).toHaveAttribute('data-open', '');

        const popup = screen.getByTestId('popup');

        // Begin closing; the exit animation keeps the popup mounted while it plays.
        await act(async () => {
          screen.getByRole('button', { name: 'Close' }).click();
        });
        await waitFor(() => {
          expect(popup).toHaveAttribute('data-ending-style');
        });

        // Re-grab while the popup is still mounted mid-exit. A single move that locks the direction,
        // re-opens the drawer, and writes the movement (200 - 80 = 120px of remaining travel) on the
        // commit that flips `open` back to true.
        fireEvent.pointerDown(swipeArea, {
          button: 0,
          buttons: 1,
          pointerId: 1,
          clientX: 10,
          clientY: 120,
          pointerType: 'mouse',
        });
        await flushMicrotasks();

        fireEvent.pointerMove(swipeArea, {
          pointerId: 1,
          clientX: 10,
          clientY: 40,
          buttons: 1,
          pointerType: 'mouse',
        });
        await flushMicrotasks();

        expect(swipeArea).toHaveAttribute('data-open', '');
        // The viewport's open-reset must not have clobbered the swipe area's value back to `0px`.
        expect(popup.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('120px');
      } finally {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      }
    },
  );

  it('opens on a quick flick whose only move is already released (buttons: 0)', async () => {
    // On a fast flick — especially on a low-refresh-rate display — the pointer can be lifted before
    // the first `pointermove` is sampled, so the single move arrives with `buttons: 0` and no
    // preceding pressed move. It must still commit the swipe-open instead of being discarded.
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    fireEvent.pointerDown(swipeArea, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      pointerType: 'mouse',
      timeStamp: 0,
    });
    await flushMicrotasks();

    fireEvent.pointerMove(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 40,
      buttons: 0,
      pointerType: 'mouse',
      timeStamp: 16,
    });
    await flushMicrotasks();

    // No trailing `pointerup` follows; the released move must finish the gesture by itself.
    expect(swipeArea).toHaveAttribute('data-open', '');
    expect(swipeArea).not.toHaveAttribute('data-swiping');

    pressOutside();

    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBe(null);
    });
  });

  it('commits a released-move quick flick exactly once when a real pointerup trails it', async () => {
    // The `buttons: 0` move finishes the gesture by itself, but a real browser still delivers the
    // trailing `pointerup` afterwards. That second `handleEnd` must be a no-op: the flick stays open
    // and does not re-commit the release (no double open-change, no spurious close).
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root onOpenChange={handleOpenChange}>
        <Drawer.SwipeArea data-testid="swipe-area" />
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    fireEvent.pointerDown(swipeArea, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      pointerType: 'mouse',
      timeStamp: 0,
    });
    await flushMicrotasks();

    fireEvent.pointerMove(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 40,
      buttons: 0,
      pointerType: 'mouse',
      timeStamp: 16,
    });
    await flushMicrotasks();

    expect(swipeArea).toHaveAttribute('data-open', '');
    expect(handleOpenChange).toHaveBeenCalledTimes(1);
    expect(handleOpenChange.mock.calls[0][0]).toBe(true);

    // The trailing `pointerup` a real browser still delivers must not re-run the release.
    fireEvent.pointerUp(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 40,
      buttons: 0,
      pointerType: 'mouse',
      timeStamp: 32,
    });
    await flushMicrotasks();

    expect(swipeArea).toHaveAttribute('data-open', '');
    expect(swipeArea).not.toHaveAttribute('data-swiping');
    expect(handleOpenChange).toHaveBeenCalledTimes(1);
  });

  it('opens on a quick flick that lands its whole travel in a single touch move', async () => {
    // A fast touch flick on a low-refresh-rate display can produce a single `touchmove` carrying
    // the entire travel between `touchstart` and `touchend`. The first-move latency calibration
    // must not discard it for the swipe-area (which doesn't track a dragged element).
    await render(
      <Drawer.Root>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    fireEvent.touchStart(swipeArea, {
      bubbles: true,
      touches: [createTouch(swipeArea, { clientX: 10, clientY: 120 })],
    });
    await flushMicrotasks();

    fireEvent.touchMove(swipeArea, {
      bubbles: true,
      touches: [createTouch(swipeArea, { clientX: 10, clientY: 40 })],
    });
    await flushMicrotasks();

    fireEvent.touchEnd(swipeArea, {
      bubbles: true,
      changedTouches: [createTouch(swipeArea, { clientX: 10, clientY: 40 })],
    });
    await flushMicrotasks();

    expect(swipeArea).toHaveAttribute('data-open', '');
  });

  it('does not open on an in-place press-release without movement', async () => {
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root onOpenChange={handleOpenChange}>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    fireEvent.pointerDown(swipeArea, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      pointerType: 'mouse',
      timeStamp: 0,
    });
    await flushMicrotasks();

    // Released in place: a `buttons: 0` move with no displacement must not open the drawer.
    fireEvent.pointerMove(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      buttons: 0,
      pointerType: 'mouse',
      timeStamp: 16,
    });
    await flushMicrotasks();

    fireEvent.pointerUp(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      buttons: 0,
      pointerType: 'mouse',
      timeStamp: 32,
    });
    await flushMicrotasks();

    expect(swipeArea).toHaveAttribute('data-closed', '');
    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('does not open a horizontal drawer on a stationary pointer move', async () => {
    const handleOpenChange = vi.fn();

    await render(
      <Drawer.Root onOpenChange={handleOpenChange}>
        <Drawer.SwipeArea data-testid="swipe-area" swipeDirection="left" />
      </Drawer.Root>,
    );

    const swipeArea = screen.getByTestId('swipe-area');

    fireEvent.pointerDown(swipeArea, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 100,
      clientY: 10,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(swipeArea, {
      buttons: 1,
      pointerId: 1,
      clientX: 100,
      clientY: 10,
      pointerType: 'mouse',
    });

    expect(handleOpenChange).not.toHaveBeenCalled();

    fireEvent.pointerUp(swipeArea, {
      pointerId: 1,
      clientX: 100,
      clientY: 10,
      pointerType: 'mouse',
    });

    expect(handleOpenChange).not.toHaveBeenCalled();
  });
});
