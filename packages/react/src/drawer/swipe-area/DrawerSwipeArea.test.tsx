import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  act,
  fireEvent,
  flushMicrotasks,
  ignoreActWarnings,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import { createRenderer, describeConformance, firePointer, isJSDOM } from '#test-utils';
import {
  type DrawerProviderContext,
  useDrawerProviderContext,
} from '../provider/DrawerProviderContext';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import type { DialogStore } from '../../dialog/store/DialogStore';

const useIdMockState = vi.hoisted(() => ({ returnUndefined: false }));
const eventUtilsMockState = vi.hoisted(() => ({ forceVirtualClick: false }));

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

vi.mock('../../floating-ui-react/utils/event', async () => {
  const actual = await vi.importActual<typeof import('../../floating-ui-react/utils/event')>(
    '../../floating-ui-react/utils/event',
  );
  return {
    ...actual,
    isVirtualClick(...args: Parameters<typeof actual.isVirtualClick>) {
      return eventUtilsMockState.forceVirtualClick || actual.isVirtualClick(...args);
    },
  };
});

type Point = {
  x: number;
  y: number;
};

type SwipeInput = 'pointer' | 'touch';

type SwipeContext = {
  /** Advances the gesture timeline by one step and returns the new timestamp. */
  nextTimeStamp: () => number;
};

type SwipeOptions = {
  // Receives the gesture's timeline so any event it injects stays on the same clock as the rest of
  // the swipe. Firing an untimed event here would stamp it off the real clock, landing it out of
  // order against the synthetic timestamps and skipping the release-velocity refinement.
  beforeRelease?: (context: SwipeContext) => Promise<unknown> | unknown;
  input?: SwipeInput;
  // Applies only to `input: 'pointer'`; the `touch` branch always dispatches touch events.
  pointerType?: 'mouse' | 'pen' | 'touch';
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

function dispatchTouchPointerEvent(
  element: Element,
  type: string,
  point: { clientX: number; clientY: number },
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerType: { value: 'touch' },
    pointerId: { value: 1 },
    button: { value: 0 },
    buttons: { value: type === 'pointerup' || type === 'pointercancel' ? 0 : 1 },
    clientX: { value: point.clientX },
    clientY: { value: point.clientY },
  });
  element.dispatchEvent(event);
}

async function swipe(element: HTMLElement, start: Point, end: Point, options: SwipeOptions = {}) {
  const stepX = start.x + (end.x === start.x ? 0 : Math.sign(end.x - start.x));
  const stepY = start.y + (end.y === start.y ? 0 : Math.sign(end.y - start.y));
  const {
    beforeRelease,
    input = 'pointer',
    pointerType = 'mouse',
    // Every pointer swipe runs on a fixed timeline. Without one the gesture's velocity is derived
    // from whatever wall-clock gaps the runner leaves between calls, and `MAX_RELEASE_VELOCITY_AGE_MS`
    // (80ms) flips the release decision whenever the machine stalls between the last move and the up.
    timeStepMs = 16,
    startTimeMs = 1,
  } = options;
  let timeStamp = startTimeMs;
  const swipeContext: SwipeContext = {
    nextTimeStamp: () => {
      timeStamp += timeStepMs;
      return timeStamp;
    },
  };

  if (input === 'touch') {
    // Touch events are still fired untimed, so a timeline handed out here would advance a counter
    // no event carries. Throwing makes that a loud failure rather than an event silently stamped
    // off the real clock, which is the trap this helper exists to close.
    const touchContext: SwipeContext = {
      nextTimeStamp: () => {
        throw new Error(
          "swipe(): `nextTimeStamp` is unavailable for `input: 'touch'` — touch events do not " +
            'carry timestamps yet, so an event stamped with it would still use the real clock.',
        );
      },
    };

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
      await beforeRelease(touchContext);
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

  firePointer.down(element, {
    button: 0,
    buttons: 1,
    pointerId: 1,
    clientX: start.x,
    clientY: start.y,
    pointerType,
    timeStamp,
  });

  await flushMicrotasks();

  timeStamp += timeStepMs;

  firePointer.move(element, {
    pointerId: 1,
    clientX: stepX,
    clientY: stepY,
    buttons: 1,
    pointerType,
    timeStamp,
  });

  await flushMicrotasks();

  timeStamp += timeStepMs;

  firePointer.move(element, {
    pointerId: 1,
    clientX: end.x,
    clientY: end.y,
    buttons: 1,
    pointerType,
    timeStamp,
  });

  await flushMicrotasks();

  if (beforeRelease) {
    await beforeRelease(swipeContext);
    await flushMicrotasks();
  }

  timeStamp += timeStepMs;

  firePointer.up(element, {
    pointerId: 1,
    clientX: end.x,
    clientY: end.y,
    pointerType,
    timeStamp,
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

function StoreProbe({ storeRef }: { storeRef: { current: DialogStore<unknown> | null } }) {
  storeRef.current = useDialogRootContext();
  return null;
}

describe('<Drawer.SwipeArea />', () => {
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

  it('passes its payload to the drawer when opened by a swipe', async () => {
    await render(
      <Drawer.Root>
        {({ payload }) => (
          <React.Fragment>
            <Drawer.SwipeArea data-testid="swipe-area" payload="drawer screen" />
            <div data-testid="payload">{String(payload)}</div>
          </React.Fragment>
        )}
      </Drawer.Root>,
    );

    await swipeUp(screen.getByTestId('swipe-area'), 120, 40);

    expect(screen.getByTestId('payload')).toHaveTextContent('drawer screen');
  });

  it('uses the payload from the swipe area that opens the drawer', async () => {
    await render(
      <Drawer.Root>
        {({ payload }) => (
          <React.Fragment>
            <Drawer.SwipeArea data-testid="first-swipe-area" payload="first drawer" />
            <Drawer.SwipeArea data-testid="second-swipe-area" payload="second drawer" />
            <Drawer.Close data-testid="close" />
            <div data-testid="payload">{String(payload)}</div>
          </React.Fragment>
        )}
      </Drawer.Root>,
    );

    await swipeUp(screen.getByTestId('first-swipe-area'), 120, 40);

    expect(screen.getByTestId('payload')).toHaveTextContent('first drawer');

    fireEvent.click(screen.getByTestId('close'));
    await flushMicrotasks();
    await swipeUp(screen.getByTestId('second-swipe-area'), 120, 40);

    expect(screen.getByTestId('payload')).toHaveTextContent('second drawer');
  });

  it('clears a previous trigger payload when opened by a swipe without one', async () => {
    await render(
      <Drawer.Root>
        {({ payload }) => (
          <React.Fragment>
            <Drawer.Trigger data-testid="trigger" payload="trigger payload" />
            <Drawer.SwipeArea data-testid="swipe-area" />
            <Drawer.Close data-testid="close" />
            <div data-testid="payload">{String(payload)}</div>
          </React.Fragment>
        )}
      </Drawer.Root>,
    );

    fireEvent.click(screen.getByTestId('trigger'));
    await flushMicrotasks();

    expect(screen.getByTestId('payload')).toHaveTextContent('trigger payload');

    fireEvent.click(screen.getByTestId('close'));
    await flushMicrotasks();
    await swipeUp(screen.getByTestId('swipe-area'), 120, 40);

    expect(screen.getByTestId('payload')).toHaveTextContent('undefined');
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
      async beforeRelease({ nextTimeStamp }) {
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

        firePointer.move(swipeArea, {
          buttons: 1,
          pointerId: 1,
          clientX: 200,
          clientY: 0,
          pointerType: 'mouse',
          timeStamp: nextTimeStamp(),
        });
        await flushMicrotasks();
        expect(indent.style.getPropertyValue('--drawer-swipe-progress')).toBe('0');
        expect(indent.style.getPropertyValue('--drawer-height')).toBe('');

        firePointer.move(swipeArea, {
          buttons: 1,
          pointerId: 1,
          clientX: -50,
          clientY: 0,
          pointerType: 'mouse',
          timeStamp: nextTimeStamp(),
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
    let disabledPassiveEffectFlushed = false;
    let providerContext: DrawerProviderContext | undefined;
    const cleanupPhases: boolean[] = [];

    const SwipeAreaPhaseBoundary = React.forwardRef<
      HTMLDivElement,
      React.ComponentPropsWithoutRef<'div'>
    >(function SwipeAreaPhaseBoundary(props, ref) {
      useIsoLayoutEffect(() => {
        disabledPassiveEffectFlushed = false;
      });

      React.useEffect(() => {
        disabledPassiveEffectFlushed = true;
      });

      return <div {...props} ref={ref} />;
    });

    function ProviderContextCapture() {
      providerContext = useDrawerProviderContext();
      return null;
    }

    function TestCase({ disabled }: { disabled: boolean }) {
      return (
        <Drawer.Provider>
          <ProviderContextCapture />
          <Drawer.Root>
            <Drawer.SwipeArea
              data-testid="swipe-area"
              disabled={disabled}
              render={<SwipeAreaPhaseBoundary />}
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
        </Drawer.Provider>
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
    const popup = screen.getByTestId('popup');
    expect(popup).toHaveAttribute('data-swiping', '');

    const originalSetVisualState = providerContext!.visualStateStore.set;
    providerContext!.visualStateStore.set = (state) => {
      if (state.swipeProgress === 0) {
        cleanupPhases.push(!disabledPassiveEffectFlushed);
      }
      originalSetVisualState(state);
    };

    try {
      await setProps({ disabled: true });
      expect(cleanupPhases.at(-1)).toBe(true);
      expect(screen.getByTestId('popup')).not.toHaveAttribute('data-swiping');
      expect(swipeArea).toHaveAttribute('data-disabled', '');

      pressOutside();

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).toBe(null);
      });
    } finally {
      providerContext!.visualStateStore.set = originalSetVisualState;
    }
  });

  it('keeps the drawer open when the release click follows a mid-gesture disable', async () => {
    function TestCase({ disabled }: { disabled: boolean }) {
      return (
        <Drawer.Root>
          <Drawer.SwipeArea data-testid="swipe-area" disabled={disabled} />
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup data-testid="popup">Drawer</Drawer.Popup>
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
      clientY: 40,
      pointerType: 'mouse',
    });
    await flushMicrotasks();
    expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');

    await setProps({ disabled: true });

    // The pointer is still down when `disabled` flips, so the gesture's eventual release
    // synthesizes a click with no fresh `pointerdown`. It must not dismiss the drawer the
    // gesture just opened.
    const releaseClick = new MouseEvent('click', { bubbles: true, detail: 1 });
    Object.defineProperty(releaseClick, 'pointerType', { value: 'mouse' });
    fireEvent(document.body, releaseClick);

    await act(async () => {
      await nextMacrotask();
    });

    expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');

    pressOutside();

    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBe(null);
    });
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
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    let dispatched = false;
    await act(async () => {
      dispatched = screen.getByTestId('swipe-area').dispatchEvent(event);
      await flushMicrotasks();
    });
    expect(dispatched).toBe(true);
    expect(event.defaultPrevented).toBe(false);
    expect(preventDefaultSpy).not.toHaveBeenCalled();

    fireEvent.pointerCancel(screen.getByTestId('swipe-area'), {
      pointerType: 'mouse',
      pointerId: 1,
    });
    await flushMicrotasks();
  });

  it('ignores compatibility touch pointer gestures with real displacement', async () => {
    const handleOpenChange = vi.fn();
    await render(
      <Drawer.Root onOpenChange={handleOpenChange}>
        <Drawer.SwipeArea data-testid="swipe-area" />
      </Drawer.Root>,
    );
    const swipeArea = screen.getByTestId('swipe-area');

    await act(async () => {
      dispatchTouchPointerEvent(swipeArea, 'pointerdown', { clientX: 0, clientY: 120 });
      dispatchTouchPointerEvent(swipeArea, 'pointermove', { clientX: 0, clientY: 40 });
      dispatchTouchPointerEvent(swipeArea, 'pointerup', { clientX: 0, clientY: 40 });
      dispatchTouchPointerEvent(swipeArea, 'pointercancel', { clientX: 0, clientY: 40 });
      await flushMicrotasks();
    });
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

  it('registers the swipe area once a generated id becomes available', async () => {
    useIdMockState.returnUndefined = true;
    const storeRef: { current: DialogStore<unknown> | null } = { current: null };

    function App() {
      const [, forceRender] = React.useReducer((count: number) => count + 1, 0);

      React.useEffect(() => {
        // React 17's `useId` fallback resolves the id in an effect after the first commit.
        useIdMockState.returnUndefined = false;
        forceRender();
      }, []);

      return (
        <Drawer.Root>
          <StoreProbe storeRef={storeRef} />
          <Drawer.SwipeArea data-testid="swipe-area" />
        </Drawer.Root>
      );
    }

    try {
      await render(<App />);

      const swipeArea = screen.getByTestId('swipe-area');
      await waitFor(() => {
        expect(swipeArea).toHaveAttribute('id');
      });

      expect(storeRef.current!.context.triggerElements.getById(swipeArea.id)).toBe(swipeArea);
    } finally {
      useIdMockState.returnUndefined = false;
    }
  });

  it('follows a swipe area id change', async () => {
    const storeRef: { current: DialogStore<unknown> | null } = { current: null };

    function App({ id }: { id: string }) {
      return (
        <Drawer.Root>
          <StoreProbe storeRef={storeRef} />
          <Drawer.SwipeArea data-testid="swipe-area" id={id} />
        </Drawer.Root>
      );
    }

    const { setProps } = await render(<App id="first" />);

    const swipeArea = screen.getByTestId('swipe-area');
    expect(storeRef.current!.context.triggerElements.getById('first')).toBe(swipeArea);

    await setProps({ id: 'second' });

    expect(storeRef.current!.context.triggerElements.getById('first')).toBeUndefined();
    expect(storeRef.current!.context.triggerElements.getById('second')).toBe(swipeArea);
    expect(storeRef.current!.context.triggerElements.size).toBe(1);
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

  it.each([
    { input: 'pointer' as const, pointerType: 'mouse' as const },
    { input: 'pointer' as const, pointerType: 'pen' as const },
    { input: 'touch' as const, pointerType: 'touch' as const },
  ])(
    'does not dismiss from the $pointerType/$input click synthesized by the swipe-open release',
    async ({ input, pointerType }) => {
      // Dragging past the popup releases the pointer outside it, so the gesture's own pointerup
      // synthesizes a `click` over the backdrop. That click (which has no fresh pointerdown) must not
      // be read as an outside press and dismiss the drawer that was just opened — even when it lands
      // a macrotask later, after a timer-based re-enable would have fired.
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

      await swipeUp(swipeArea, 120, 40, { input, pointerType });

      expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');

      await act(async () => {
        await nextMacrotask();
      });

      // Trailing synthesized click with no preceding fresh pointerdown.
      const releaseClick = new MouseEvent('click', { bubbles: true, detail: 1 });
      Object.defineProperty(releaseClick, 'pointerType', { value: pointerType });
      fireEvent(document.body, releaseClick);

      await act(async () => {
        await nextMacrotask();
      });

      expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');
    },
  );

  it.skipIf(isJSDOM)(
    'suppresses a trusted release click that arrives without a preceding pointerdown',
    async () => {
      // A trusted dispatch performs a microtask checkpoint after each listener, so only trusted
      // input exercises the real ordering between the release guard (document capture) and
      // floating-ui's outside-press check (target phase). Browsers deliver the gesture's trailing
      // click without a fresh `pointerdown` (e.g. a touch flick within tap slop); trusted
      // low-level input cannot produce that shape directly, so the `pointerdown` is stopped at
      // the window — ahead of document capture — and only the trusted `click` flows through.
      ignoreActWarnings();
      const { userEvent: user } = await import('vitest/browser');
      const { render: vbrRender, cleanup } = await import('vitest-browser-react');

      const stopPointerDown = (event: Event) => event.stopPropagation();

      try {
        await vbrRender(
          <div>
            <div
              data-testid="outside-target"
              style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: 100 }}
            />
            <Drawer.Root>
              <Drawer.SwipeArea
                data-testid="swipe-area"
                style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 40 }}
              />
              <Drawer.Portal>
                <Drawer.Viewport>
                  <Drawer.Popup
                    data-testid="popup"
                    style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 150 }}
                  >
                    Drawer
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.Root>
          </div>,
        );

        // Synthetic swipe: opens the drawer and arms the release guard without synthesizing the
        // trailing click (`fireEvent` does not), leaving the guard waiting for it.
        await swipeUp(screen.getByTestId('swipe-area'), 120, 40);
        expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');

        window.addEventListener('pointerdown', stopPointerDown, true);
        // `force` skips Playwright's actionability check; the drawer's internal backdrop
        // intercepts the click, which is exactly where a release click would land.
        await user.click(screen.getByTestId('outside-target'), { force: true });
        window.removeEventListener('pointerdown', stopPointerDown, true);

        await act(async () => {
          await nextMacrotask();
        });

        expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');

        // The guard is consumed and restored, so a deliberate outside press now dismisses.
        await user.click(screen.getByTestId('outside-target'), { force: true });

        await waitFor(() => {
          expect(screen.queryByTestId('popup')).toBe(null);
        });
      } finally {
        window.removeEventListener('pointerdown', stopPointerDown, true);
        await cleanup();
      }
    },
  );

  it.skipIf(isJSDOM)('allows a later click-only activation to dismiss after a swipe', async () => {
    const { user } = await render(
      <React.Fragment>
        <button type="button">Outside</button>
        <Drawer.Root modal={false}>
          <Drawer.SwipeArea data-testid="swipe-area" />
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup data-testid="popup" initialFocus={false}>
                Drawer
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </React.Fragment>,
    );

    const outside = screen.getByRole('button', { name: 'Outside' });
    outside.focus();

    await swipeUp(screen.getByTestId('swipe-area'), 120, 40);
    expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');
    expect(outside).toHaveFocus();

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBe(null);
    });
  });

  it('allows a later pointerless virtual click to dismiss when the release has no click', async () => {
    await render(
      <React.Fragment>
        <button type="button">Outside</button>
        <Drawer.Root modal={false}>
          <Drawer.SwipeArea data-testid="swipe-area" />
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup data-testid="popup" initialFocus={false}>
                Drawer
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </React.Fragment>,
    );

    await swipeUp(screen.getByTestId('swipe-area'), 120, 40, { input: 'touch' });
    expect(screen.getByTestId('popup')).toHaveAttribute('data-open', '');

    eventUtilsMockState.forceVirtualClick = true;
    try {
      const virtualClick = new MouseEvent('click', { bubbles: true, detail: 1 });
      Object.defineProperty(virtualClick, 'pointerType', { value: '' });
      fireEvent(screen.getByRole('button', { name: 'Outside' }), virtualClick);
    } finally {
      eventUtilsMockState.forceVirtualClick = false;
    }

    await waitFor(() => {
      expect(screen.queryByTestId('popup')).toBe(null);
    });
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
      // Step the gesture past the flick-velocity window (`MAX_RELEASE_VELOCITY_AGE_MS`, 80ms) so
      // distance decides the outcome. Expressed on the swipe's own timeline rather than a real
      // sleep, which previously cleared the threshold by a single millisecond.
      timeStepMs: 100,
      async beforeRelease() {
        const popup = await screen.findByTestId('popup');
        Object.defineProperty(popup, 'offsetHeight', { value: 200, configurable: true });
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

    firePointer.down(swipeArea, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      pointerType: 'mouse',
      timeStamp: 1,
    });
    await flushMicrotasks();

    firePointer.move(swipeArea, {
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

    firePointer.down(swipeArea, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      pointerType: 'mouse',
      timeStamp: 1,
    });
    await flushMicrotasks();

    firePointer.move(swipeArea, {
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
    firePointer.up(swipeArea, {
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

    firePointer.down(swipeArea, {
      button: 0,
      buttons: 1,
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      pointerType: 'mouse',
      timeStamp: 1,
    });
    await flushMicrotasks();

    // Released in place: a `buttons: 0` move with no displacement must not open the drawer.
    firePointer.move(swipeArea, {
      pointerId: 1,
      clientX: 10,
      clientY: 120,
      buttons: 0,
      pointerType: 'mouse',
      timeStamp: 16,
    });
    await flushMicrotasks();

    firePointer.up(swipeArea, {
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
