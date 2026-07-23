import { expect, vi } from 'vitest';
import * as React from 'react';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Popover } from '@base-ui/react/popover';
import { Tooltip } from '@base-ui/react/tooltip';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM, waitSingleFrame } from '#test-utils';

const Trigger = React.forwardRef(function Trigger(
  props: Popover.Trigger.Props,
  ref: React.ForwardedRef<any>,
) {
  return <Popover.Trigger {...props} ref={ref} render={<div />} nativeButton={false} />;
});

describe('<Popover.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>{node}</Popover.Portal>
        </Popover.Root>,
      );
    },
  }));

  it('throws a descriptive error when rendered outside <Popover.Portal>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Popover.Root open>
            <Popover.Positioner />
          </Popover.Root>,
        ),
      ).rejects.toThrow('Base UI: <Popover.Portal> is missing.');
    } finally {
      errorSpy.mockRestore();
    }
  });

  const baselineX = 10;
  const baselineY = 36;
  const popupWidth = 52;
  const popupHeight = 24;
  const anchorWidth = 72;
  const anchorHeight = 36;
  const triggerStyle = { width: anchorWidth, height: anchorHeight };
  const popupStyle = { width: popupWidth, height: popupHeight };

  describe.skipIf(isJSDOM)('prop: sideOffset', () => {
    it('offsets the side when a number is specified', async () => {
      const sideOffset = 7;
      await render(
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" sideOffset={sideOffset}>
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX,
        y: baselineY + sideOffset,
      });
    });

    it('offsets the side when a function is specified', async () => {
      await render(
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              sideOffset={(data) => data.positioner.width + data.anchor.width}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX,
        y: baselineY + popupWidth + anchorWidth,
      });
    });

    it('can read the latest side inside sideOffset', async () => {
      let side = 'none';
      await render(
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="left"
              data-testid="positioner"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('right');
    });

    it('can read the latest align inside sideOffset', async () => {
      let align = 'none';
      await render(
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="right"
              align="start"
              data-testid="positioner"
              sideOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      // correctly flips the align in the browser
      expect(align).toBe('end');
    });

    it('reads logical side inside sideOffset', async () => {
      let side = 'none';
      await render(
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="inline-start"
              data-testid="positioner"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('inline-end');
    });

    it('reads logical side inside sideOffset in RTL mode', async () => {
      let side = 'none';
      await render(
        <DirectionProvider direction="rtl">
          <Popover.Root open>
            <Trigger style={triggerStyle}>Trigger</Trigger>
            <Popover.Portal>
              <Popover.Positioner
                side="inline-start"
                data-testid="positioner"
                sideOffset={(data) => {
                  side = data.side;
                  return 0;
                }}
              >
                <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </DirectionProvider>,
      );

      expect(side).toBe('inline-start');
    });
  });

  describe.skipIf(isJSDOM)('prop: alignOffset', () => {
    it('offsets the align when a number is specified', async () => {
      const alignOffset = 7;
      await render(
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" alignOffset={alignOffset}>
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX + alignOffset,
        y: baselineY,
      });
    });

    it('offsets the align when a function is specified', async () => {
      await render(
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              alignOffset={(data) => data.positioner.width}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX + popupWidth,
        y: baselineY,
      });
    });

    it('can read the latest side inside alignOffset', async () => {
      let side = 'none';
      await render(
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="left"
              data-testid="positioner"
              alignOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('right');
    });

    it('can read the latest align inside alignOffset', async () => {
      let align = 'none';
      await render(
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="right"
              align="start"
              data-testid="positioner"
              alignOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      // correctly flips the align in the browser
      expect(align).toBe('end');
    });

    it('reads logical side inside alignOffset', async () => {
      let side = 'none';
      await render(
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="inline-start"
              data-testid="positioner"
              alignOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('inline-end');
    });
  });

  // https://github.com/mui/base-ui/issues/5131
  it.skipIf(isJSDOM)('rests exactly at collisionPadding from the colliding edge', async () => {
    const collisionPadding = 12;

    await render(
      // Anchor pinned near the bottom so the bottom-side popup flips to the top and
      // collides with the top viewport edge.
      <div style={{ position: 'fixed', bottom: 8, left: 16 }}>
        <Popover.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              side="bottom"
              sideOffset={8}
              collisionPadding={collisionPadding}
              collisionAvoidance={{ fallbackAxisSide: 'none' }}
            >
              <Popover.Popup
                style={{ width: 200, height: 1000, maxHeight: 'var(--available-height)' }}
              >
                Popup
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>,
    );

    const positioner = screen.getByTestId('positioner');
    await waitFor(() => {
      expect(positioner).toHaveAttribute('data-side', 'top');
    });

    // The preferred-side bias used by flip() must not leak into the resting position:
    // the popup should sit exactly `collisionPadding` away from the top edge, not +1px.
    expect(Math.round(screen.getByTestId('positioner').getBoundingClientRect().top)).toBe(
      collisionPadding,
    );
  });

  it.skipIf(isJSDOM)('remains anchored if keepMounted=false', async () => {
    function App({ top }: { top: number }) {
      return (
        <Popover.Root open>
          <Trigger style={{ width: 100, height: 100, position: 'relative', top }}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup style={{ width: 100, height: 100 }}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const { setPropsAsync } = await render(<App top={0} />);
    const positioner = screen.getByTestId('positioner');

    const initial = { x: 5, y: 100 };
    const final = { x: 5, y: 200 };

    expect(positioner.getBoundingClientRect()).toMatchObject(initial);

    await setPropsAsync({ top: 100 });

    await waitFor(() => {
      expect(positioner.getBoundingClientRect()).not.toMatchObject(initial);
    });

    expect(positioner.getBoundingClientRect()).toMatchObject(final);
  });

  it.skipIf(isJSDOM)('remains anchored if keepMounted=true', async () => {
    function App({ top }: { top: number }) {
      return (
        <Popover.Root open>
          <Trigger style={{ width: 100, height: 100, position: 'relative', top }}>Trigger</Trigger>
          <Popover.Portal keepMounted>
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup style={{ width: 100, height: 100 }}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    const { setPropsAsync } = await render(<App top={0} />);
    const positioner = screen.getByTestId('positioner');

    const initial = { x: 5, y: 100 };
    const final = { x: 5, y: 200 };

    expect(positioner.getBoundingClientRect()).toMatchObject(initial);

    await setPropsAsync({ top: 100 });

    await waitFor(() => {
      expect(positioner.getBoundingClientRect()).not.toMatchObject(initial);
    });

    expect(positioner.getBoundingClientRect()).toMatchObject(final);
  });

  it.skipIf(isJSDOM)('observes a custom anchor for keepMounted auto-updates', async () => {
    const originalResizeObserver = window.ResizeObserver;
    const observedElements: Element[] = [];

    class TestResizeObserver {
      observe(element: Element) {
        observedElements.push(element);
      }

      unobserve() {}

      disconnect() {}
    }

    window.ResizeObserver = TestResizeObserver as typeof ResizeObserver;

    function App() {
      const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
      return (
        <Popover.Root open>
          <Trigger data-testid="trigger" style={{ width: 100, height: 100 }}>
            Trigger
          </Trigger>
          <div
            ref={setAnchor}
            data-testid="custom-anchor"
            style={{ width: 50, height: 50, position: 'relative' }}
          >
            Anchor
          </div>
          <Popover.Portal keepMounted>
            <Popover.Positioner data-testid="positioner" anchor={anchor}>
              <Popover.Popup style={{ width: 100, height: 100 }}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    try {
      await render(<App />);
      const anchor = screen.getByTestId('custom-anchor');

      await waitFor(() => {
        expect(observedElements).toContain(anchor);
      });
    } finally {
      window.ResizeObserver = originalResizeObserver;
    }
  });

  it.skipIf(isJSDOM)(
    'remains anchored to the trigger when closing from a tooltip trigger close',
    async () => {
      const testPopover = Popover.createHandle();

      function App() {
        const [open, setOpen] = React.useState(true);

        return (
          <React.Fragment>
            <Popover.Trigger
              handle={testPopover}
              id="trigger-1"
              style={{ width: 100, height: 100 }}
            >
              Trigger
            </Popover.Trigger>
            <Popover.Root
              handle={testPopover}
              open={open}
              triggerId="trigger-1"
              onOpenChange={(nextOpen, eventDetails) => {
                if (!nextOpen) {
                  eventDetails.preventUnmountOnClose();
                }
                setOpen(nextOpen);
              }}
            >
              <Popover.Portal>
                <Popover.Positioner data-testid="positioner">
                  <Popover.Popup data-testid="popup" style={{ width: 160, height: 120 }}>
                    <Popover.Close
                      render={(popoverCloseProps) => (
                        <Tooltip.Root>
                          <Tooltip.Trigger {...popoverCloseProps}>Close</Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Positioner>
                              <Tooltip.Popup>Tooltip</Tooltip.Popup>
                            </Tooltip.Positioner>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      )}
                    />
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </React.Fragment>
        );
      }

      const { user } = await render(<App />);
      const positioner = screen.getByTestId('positioner');
      const initialRect = positioner.getBoundingClientRect();

      await user.click(screen.getByRole('button', { name: 'Close' }));
      await act(async () => {
        await waitSingleFrame();
        await waitSingleFrame();
      });

      await waitFor(() => {
        expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
      });

      const closingRect = positioner.getBoundingClientRect();
      expect(Math.abs(closingRect.x - initialRect.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(closingRect.y - initialRect.y)).toBeLessThanOrEqual(1);
    },
  );

  it.skipIf(isJSDOM)('uses transform positioning without Viewport', async () => {
    await render(
      <Popover.Root open>
        <Trigger style={triggerStyle}>Trigger</Trigger>
        <Popover.Portal>
          <Popover.Positioner data-testid="positioner">
            <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    expect(screen.getByTestId('positioner').style.transform).not.toBe('');
  });

  it.skipIf(isJSDOM)('uses top/left positioning with Viewport', async () => {
    await render(
      <Popover.Root open>
        <Trigger style={triggerStyle}>Trigger</Trigger>
        <Popover.Portal>
          <Popover.Positioner data-testid="positioner">
            <Popover.Popup style={popupStyle}>
              <Popover.Viewport>Popup</Popover.Viewport>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('positioner').style.transform).toBe('');
    });
  });

  describe.skipIf(isJSDOM)('rendered side change transitions', () => {
    beforeEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
    });

    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    it('transitions the position when a trigger change swaps the rendered side', async () => {
      const { user } = await render(
        <div>
          <style>
            {`
              [data-testid="positioner"] {
                width: var(--positioner-width);
                height: var(--positioner-height);
                transition: top 10s linear, bottom 10s linear, left 10s linear, right 10s linear;
              }
            `}
          </style>
          <Popover.Root>
            <Popover.Trigger
              data-testid="trigger1"
              style={{ position: 'fixed', top: 10, left: 10, width: 100, height: 50 }}
            >
              Trigger 1
            </Popover.Trigger>
            <Popover.Trigger
              data-testid="trigger2"
              style={{ position: 'fixed', bottom: 10, left: 10, width: 100, height: 50 }}
            >
              Trigger 2
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner">
                <Popover.Popup style={popupStyle}>
                  <Popover.Viewport>Popup</Popover.Viewport>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>,
      );

      // Trigger 1 has space below it (side `bottom`); trigger 2 sits at the bottom
      // of the viewport, so the popup flips to side `top` when moving to it.
      await user.click(screen.getByTestId('trigger1'));

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expect(positioner).toHaveAttribute('data-side', 'bottom');
      });

      const initialTop = positioner.getBoundingClientRect().top;

      await user.click(screen.getByTestId('trigger2'));

      // The positioning property swaps from `top` to `bottom`. The popup must
      // transition from its previous visual position instead of teleporting, so
      // its position may never change abruptly between frames (the 10s linear
      // transition moves it by roughly 1px per frame).
      let previousTop = initialTop;
      await act(async () => {
        for (let i = 0; i < 20; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await waitSingleFrame();
          const { top } = positioner.getBoundingClientRect();
          expect(Math.abs(top - previousTop)).toBeLessThan(20);
          previousTop = top;
        }
      });

      expect(positioner).toHaveAttribute('data-side', 'top');
    });

    it('does not transition the position when the side flips for the same anchor', async () => {
      const { user } = await render(
        <div>
          <style>
            {`
              [data-testid="positioner"] {
                width: var(--positioner-width);
                height: var(--positioner-height);
                transition: top 10s linear, bottom 10s linear, left 10s linear, right 10s linear;
              }
            `}
          </style>
          <div
            data-testid="scroller"
            style={{ height: 400, overflow: 'auto', position: 'relative' }}
          >
            <div style={{ height: 1200 }}>
              <Popover.Root>
                <Popover.Trigger
                  data-testid="trigger"
                  style={{ position: 'absolute', top: 300, left: 10, width: 100, height: 50 }}
                >
                  Trigger
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner data-testid="positioner" side="top" sideOffset={8}>
                    <Popover.Popup style={popupStyle}>
                      <Popover.Viewport>Popup</Popover.Viewport>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </div>
        </div>,
      );

      await user.click(screen.getByTestId('trigger'));

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expect(positioner).toHaveAttribute('data-side', 'top');
      });

      // Scrolling moves the anchor near the top of its clipping container,
      // flipping the popup below it.
      screen.getByTestId('scroller').scrollTop = 280;

      await waitFor(() => {
        expect(positioner).toHaveAttribute('data-side', 'bottom');
      });

      // A same-anchor collision flip applies instantly instead of gliding across the anchor.
      const triggerRect = screen.getByTestId('trigger').getBoundingClientRect();
      const positionerRect = positioner.getBoundingClientRect();
      expect(Math.abs(positionerRect.top - (triggerRect.bottom + 8))).toBeLessThan(2);
    });

    it('preserves inline transition longhands when a same-anchor flip disables the transition', async () => {
      const { user } = await render(
        <div>
          <style>
            {`
              [data-testid="positioner"] {
                width: var(--positioner-width);
                height: var(--positioner-height);
              }
            `}
          </style>
          <div
            data-testid="scroller"
            style={{ height: 400, overflow: 'auto', position: 'relative' }}
          >
            <div style={{ height: 1200 }}>
              <Popover.Root>
                <Popover.Trigger
                  data-testid="trigger"
                  style={{ position: 'absolute', top: 300, left: 10, width: 100, height: 50 }}
                >
                  Trigger
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner data-testid="positioner" side="top" sideOffset={8}>
                    <Popover.Popup style={popupStyle}>
                      <Popover.Viewport>Popup</Popover.Viewport>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </div>
        </div>,
      );

      await user.click(screen.getByTestId('trigger'));

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expect(positioner).toHaveAttribute('data-side', 'top');
      });
      // Wait for the mount-time `transition: none` style to be removed, since React
      // clears the inline longhands when it removes the shorthand.
      await waitFor(() => {
        expect(positioner.style.transition).toBe('');
      });

      // Transitions configured through individual inline longhands rather than
      // the `transition` shorthand.
      positioner.style.transitionProperty = 'top, bottom, left, right';
      positioner.style.transitionDuration = '10s';
      positioner.style.transitionTimingFunction = 'linear';

      // Scrolling moves the anchor near the top of its clipping container,
      // flipping the popup below it and taking the transition-disabling path.
      screen.getByTestId('scroller').scrollTop = 280;

      await waitFor(() => {
        expect(positioner).toHaveAttribute('data-side', 'bottom');
      });

      expect(positioner.style.transitionProperty).toBe('top, bottom, left, right');
      expect(positioner.style.transitionDuration).toBe('10s');
      expect(positioner.style.transitionTimingFunction).toBe('linear');
    });

    it('keeps an unchanged-axis transition running when the side flips during a trigger change', async () => {
      const { user } = await render(
        <div>
          <style>
            {`
              [data-testid="positioner"] {
                width: var(--positioner-width);
                height: var(--positioner-height);
                transition: top 1s linear, bottom 1s linear, left 1s linear, right 1s linear;
              }
            `}
          </style>
          <div
            data-testid="scroller"
            style={{ height: 400, overflow: 'auto', position: 'relative' }}
          >
            <div style={{ height: 1200, position: 'relative' }}>
              <Popover.Root>
                <Popover.Trigger
                  data-testid="trigger1"
                  style={{ position: 'absolute', top: 300, left: 10, width: 100, height: 50 }}
                >
                  Trigger 1
                </Popover.Trigger>
                <Popover.Trigger
                  data-testid="trigger2"
                  style={{ position: 'absolute', top: 300, left: 300, width: 100, height: 50 }}
                >
                  Trigger 2
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner data-testid="positioner" side="top" sideOffset={8}>
                    <Popover.Popup style={popupStyle}>
                      <Popover.Viewport>Popup</Popover.Viewport>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </div>
        </div>,
      );

      await user.click(screen.getByTestId('trigger1'));

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expect(positioner).toHaveAttribute('data-side', 'top');
      });

      await user.click(screen.getByTestId('trigger2'));

      await waitFor(() => {
        expect(
          positioner
            .getAnimations()
            .some(
              (animation) =>
                (animation as CSSTransition).transitionProperty === 'left' &&
                animation.playState === 'running',
            ),
        ).toBe(true);
      });

      const scroller = screen.getByTestId('scroller');
      scroller.scrollTop = 280;

      await waitFor(() => {
        expect(positioner).toHaveAttribute('data-side', 'bottom');
      });

      const triggerRect = screen.getByTestId('trigger2').getBoundingClientRect();
      const targetLeft = triggerRect.left + (triggerRect.width - popupWidth) / 2;
      await waitFor(
        () => {
          expect(Math.abs(positioner.getBoundingClientRect().left - targetLeft)).toBeLessThan(2);
        },
        { timeout: 2000 },
      );
    });
  });
});
