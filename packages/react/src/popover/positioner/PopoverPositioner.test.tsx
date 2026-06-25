import { afterEach, expect, vi } from 'vitest';
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

  const multilineWrapperStyle = { width: 140 };
  const multilineTriggerStyle = { display: 'inline', lineHeight: '20px' };

  function expectWithin(actual: number, expected: number, tolerance = 2) {
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
  }

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

  describe.skipIf(isJSDOM)('multiline inline trigger', () => {
    afterEach(() => {
      window.scrollTo(0, 0);
    });

    it('positions the popup relative to the hovered line of a multiline trigger', async () => {
      const { user } = await render(
        <div style={multilineWrapperStyle}>
          <Popover.Root>
            <Popover.Trigger
              openOnHover
              delay={0}
              data-testid="trigger"
              nativeButton={false}
              render={<span />}
              style={multilineTriggerStyle}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                <Popover.Popup style={{ width: 80, height: 40 }}>Popover Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).toBeGreaterThan(2);

      // Enter over the second line so opening on hover uses the correct inline rect.
      const secondLineRect = triggerRects[1];
      const secondLineCenterX = secondLineRect.left + secondLineRect.width / 2;
      const secondLineCenterY = secondLineRect.top + secondLineRect.height / 2;

      await user.pointer([
        { target: document.body },
        {
          target: trigger,
          coords: { clientX: secondLineCenterX, clientY: secondLineCenterY },
        },
      ]);

      const positioner = await screen.findByTestId('positioner');
      await waitFor(() => {
        expect(positioner).toBeVisible();
      });

      // The positioner should be positioned relative to the second line,
      // not the first line or the full bounding client rect.
      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, secondLineRect.bottom + 5);
      });

      const { x: positionerX } = positioner.getBoundingClientRect();
      expect(positionerX).toBeGreaterThanOrEqual(secondLineRect.left - 10);
      expect(positionerX).toBeLessThanOrEqual(secondLineRect.right + 10);
    });

    it('does not alter positioning for a single-line trigger', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger
            openOnHover
            delay={0}
            data-testid="trigger"
            nativeButton={false}
            render={<span />}
            style={{ display: 'inline-block', width: 120, height: 20 }}
          >
            Trigger
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
              <Popover.Popup style={{ width: 80, height: 40 }}>Popover Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      const triggerRect = trigger.getBoundingClientRect();

      await user.pointer([
        { target: document.body },
        {
          target: trigger,
          coords: { clientX: triggerRect.left + 10, clientY: triggerRect.top + 10 },
        },
      ]);

      const positioner = await screen.findByTestId('positioner');
      await waitFor(() => {
        expect(positioner).toBeVisible();
      });

      // The middleware is a no-op for single-line triggers, so the popup anchors to the
      // full (centered) trigger rect.
      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, triggerRect.bottom + 5);
      });

      const positionerRect = positioner.getBoundingClientRect();
      expectWithin(
        positionerRect.x + positionerRect.width / 2,
        triggerRect.left + triggerRect.width / 2,
      );
    });

    it('repositions to a newly hovered line after closing and reopening', async () => {
      const { user } = await render(
        <div style={multilineWrapperStyle}>
          <Popover.Root>
            <Popover.Trigger
              openOnHover
              delay={0}
              closeDelay={0}
              data-testid="trigger"
              nativeButton={false}
              render={<span />}
              style={multilineTriggerStyle}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                <Popover.Popup style={{ width: 80, height: 40 }}>Popover Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).toBeGreaterThan(2);

      const firstLineRect = triggerRects[0];
      const secondLineRect = triggerRects[1];

      // Open over the first line.
      await user.pointer([
        { target: document.body },
        {
          target: trigger,
          coords: {
            clientX: firstLineRect.left + firstLineRect.width / 2,
            clientY: firstLineRect.top + firstLineRect.height / 2,
          },
        },
      ]);

      let positioner = await screen.findByTestId('positioner');
      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, firstLineRect.bottom + 5);
      });

      // Close by moving the pointer away.
      await user.pointer([{ target: document.body, coords: { clientX: 300, clientY: 300 } }]);
      await waitFor(() => {
        expect(screen.queryByTestId('positioner')).not.toBeInTheDocument();
      });

      // Reopen over the second line.
      await user.pointer([
        {
          target: trigger,
          coords: {
            clientX: secondLineRect.left + secondLineRect.width / 2,
            clientY: secondLineRect.top + secondLineRect.height / 2,
          },
        },
      ]);

      positioner = await screen.findByTestId('positioner');
      await waitFor(() => {
        expectWithin(positioner.getBoundingClientRect().y, secondLineRect.bottom + 5);
      });
    });
  });
});
