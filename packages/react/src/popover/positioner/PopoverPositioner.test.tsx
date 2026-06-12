import { expect } from 'vitest';
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

  describe.skipIf(isJSDOM)('transform origin', () => {
    function getTransformOrigin() {
      return screen.getByTestId('positioner').style.getPropertyValue('--transform-origin');
    }

    it('points to the anchor center for center alignment', async () => {
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, margin: 50 }}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      // The popup is centered on the anchor, so the anchor's center maps to the popup's center.
      expect(getTransformOrigin()).toBe(`${popupWidth / 2}px 0px`);
    });

    it('points to the popup start edge for start alignment', async () => {
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, margin: 50 }}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" align="start">
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(getTransformOrigin()).toBe('0% 0px');
    });

    it('points to the popup logical start edge for start alignment in RTL', async () => {
      await render(
        <div dir="rtl">
          <DirectionProvider direction="rtl">
            <Popover.Root open>
              <Trigger style={{ ...triggerStyle, margin: 50 }}>Trigger</Trigger>
              <Popover.Portal>
                <Popover.Positioner data-testid="positioner" align="start" dir="rtl">
                  <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </DirectionProvider>
        </div>,
      );

      expect(getTransformOrigin()).toBe('100% 0px');
    });

    it('uses the floating element direction for RTL alignment', async () => {
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, margin: 50 }}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" align="start" dir="rtl">
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(getTransformOrigin()).toBe('100% 0px');
    });

    it('points to the popup end edge for end alignment', async () => {
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, margin: 50 }}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" align="end">
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(getTransformOrigin()).toBe('100% 0px');
    });

    it('points to the popup logical end edge for end alignment in RTL', async () => {
      await render(
        <div dir="rtl">
          <DirectionProvider direction="rtl">
            <Popover.Root open>
              <Trigger style={{ ...triggerStyle, margin: 50 }}>Trigger</Trigger>
              <Popover.Portal>
                <Popover.Positioner data-testid="positioner" align="end" dir="rtl">
                  <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </DirectionProvider>
        </div>,
      );

      expect(getTransformOrigin()).toBe('0% 0px');
    });

    it('places the side coordinate first for horizontal sides', async () => {
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, margin: 50 }}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" side="right" align="start">
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(getTransformOrigin()).toBe('0px 0%');
    });

    it('points to the popup end edge for horizontal end alignment', async () => {
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, position: 'fixed', left: 200, top: 50 }}>
            Trigger
          </Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" side="left" align="end" sideOffset={7}>
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(getTransformOrigin()).toBe('calc(100% + 7px) 100%');
    });

    it('accounts for sideOffset', async () => {
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, margin: 50 }}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" align="start" sideOffset={7}>
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(getTransformOrigin()).toBe('0% -7px');
    });

    it('accounts for sideOffset on top side', async () => {
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, position: 'fixed', left: 50, top: 200 }}>
            Trigger
          </Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" align="start" side="top" sideOffset={7}>
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(getTransformOrigin()).toBe('0% calc(100% + 7px)');
    });

    it('keeps the popup start edge as the origin with alignOffset', async () => {
      const alignOffset = 7;
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, margin: 50 }}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" align="start" alignOffset={alignOffset}>
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByText('Trigger');
      const positioner = screen.getByTestId('positioner');
      const anchorRect = trigger.getBoundingClientRect();
      const positionerRect = positioner.getBoundingClientRect();

      expect(positionerRect.left - anchorRect.left).toBe(alignOffset);
      expect(getTransformOrigin()).toBe('0% 0px');
    });

    it('keeps the popup start edge as the origin for a 1px cross-axis shift', async () => {
      await render(
        <Popover.Root open>
          <Trigger
            style={{
              ...triggerStyle,
              position: 'fixed',
              left: `calc(100vw - ${popupWidth - 1}px)`,
              top: 50,
            }}
          >
            Trigger
          </Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              align="start"
              collisionAvoidance={{ align: 'shift' }}
              collisionPadding={0}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByText('Trigger');
      const positioner = screen.getByTestId('positioner');
      const anchorRect = trigger.getBoundingClientRect();
      const positionerRect = positioner.getBoundingClientRect();

      expect(Math.round(positionerRect.left - anchorRect.left)).toBe(-1);
      expect(getTransformOrigin()).toBe('0% 0px');
    });

    it('points to the anchor center when start alignment is shifted on the cross axis', async () => {
      const shiftedPopupWidth = 240;
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, position: 'fixed', top: 50, right: 10 }}>
            Trigger
          </Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              align="start"
              collisionAvoidance={{ align: 'shift' }}
            >
              <Popover.Popup style={{ ...popupStyle, width: shiftedPopupWidth }}>
                Popup
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByText('Trigger');
      const positioner = screen.getByTestId('positioner');
      const anchorRect = trigger.getBoundingClientRect();
      const positionerRect = positioner.getBoundingClientRect();

      expect(positionerRect.left).toBeLessThan(anchorRect.left);
      expect(getTransformOrigin()).toBe(
        `${anchorRect.x + anchorWidth / 2 - positionerRect.x}px 0px`,
      );
    });

    it('points to the anchor center when end alignment is shifted on the cross axis', async () => {
      const shiftedPopupWidth = 240;
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, position: 'fixed', left: 10, top: 50 }}>
            Trigger
          </Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              align="end"
              collisionAvoidance={{ align: 'shift' }}
            >
              <Popover.Popup style={{ ...popupStyle, width: shiftedPopupWidth }}>
                Popup
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByText('Trigger');
      const positioner = screen.getByTestId('positioner');
      const anchorRect = trigger.getBoundingClientRect();
      const positionerRect = positioner.getBoundingClientRect();

      expect(positionerRect.right).toBeGreaterThan(anchorRect.right);
      expect(getTransformOrigin()).toBe(
        `${anchorRect.x + anchorWidth / 2 - positionerRect.x}px 0px`,
      );
    });

    it('points to the anchor center when horizontal alignment is shifted on the cross axis', async () => {
      const shiftedPopupHeight = 120;
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, position: 'fixed', left: 50, bottom: 10 }}>
            Trigger
          </Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              side="right"
              align="start"
              collisionAvoidance={{ align: 'shift' }}
            >
              <Popover.Popup style={{ ...popupStyle, height: shiftedPopupHeight }}>
                Popup
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByText('Trigger');
      const positioner = screen.getByTestId('positioner');
      const anchorRect = trigger.getBoundingClientRect();
      const positionerRect = positioner.getBoundingClientRect();

      expect(positionerRect.top).toBeLessThan(anchorRect.top);
      expect(getTransformOrigin()).toBe(
        `0px ${anchorRect.y + anchorHeight / 2 - positionerRect.y}px`,
      );
    });

    it('points to the arrow when present regardless of alignment', async () => {
      const arrowSize = 10;
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, margin: 50 }}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" align="start">
              <Popover.Popup style={popupStyle}>
                <Popover.Arrow style={{ width: arrowSize, height: arrowSize }} />
                Popup
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      // The arrow is centered against the anchor, whose center sits at half the anchor's
      // width from the popup's left edge with start alignment.
      expect(getTransformOrigin()).toBe(`${anchorWidth / 2}px 0px`);
    });

    it('points to the anchor center when the popup is shifted to overlap the anchor', async () => {
      await render(
        <Popover.Root open>
          <Trigger style={{ ...triggerStyle, position: 'fixed', left: 50, bottom: 10 }}>
            Trigger
          </Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" collisionAvoidance={{ side: 'shift' }}>
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByText('Trigger');
      const positioner = screen.getByTestId('positioner');
      const anchorRect = trigger.getBoundingClientRect();
      const positionerRect = positioner.getBoundingClientRect();

      // The popup doesn't fit below the anchor, so it shifts up and overlaps it. The
      // side-axis origin then points to the anchor's vertical center within the popup.
      expect(positionerRect.top).toBeLessThan(anchorRect.bottom);
      expect(getTransformOrigin()).toBe(
        `${popupWidth / 2}px ${anchorRect.y + anchorHeight / 2 - positionerRect.y}px`,
      );
    });
  });
});
