import { expect, vi } from 'vitest';
import * as React from 'react';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Popover } from '@base-ui/react/popover';
import { Tooltip } from '@base-ui/react/tooltip';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
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

  it.skipIf(isJSDOM)('does not transition from the viewport origin on first open', async () => {
    let transitionRuns = 0;

    await render(
      <React.Fragment>
        <style>{`
          .initial-position-transition-test {
            transition: transform 200ms linear;
          }
        `}</style>
        <Popover.Root>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner
              ref={(element) => {
                element?.addEventListener('transitionrun', (event) => {
                  if (event.propertyName === 'transform') {
                    transitionRuns += 1;
                  }
                });
              }}
              className="initial-position-transition-test"
              data-testid="positioner"
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </React.Fragment>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));

    const positioner = screen.getByTestId('positioner');
    await waitFor(() => {
      expect(positioner.style.opacity).toBe('');
    });

    await waitFor(() => {
      expect(getComputedStyle(positioner).transitionProperty).toBe('transform');
    });
    expect(transitionRuns).toBe(0);
  });

  it.skipIf(isJSDOM)('preserves the popup starting-style animation on every open', async () => {
    const mountSnapshots: Array<{
      hasStartingStyle: boolean;
      opacity: string;
      transform: string;
    }> = [];
    const mountedElements = new WeakSet<HTMLDivElement>();

    const setPopupElement = (element: HTMLDivElement | null) => {
      if (!element || mountedElements.has(element)) {
        return;
      }

      mountedElements.add(element);
      const computedStyle = getComputedStyle(element);
      mountSnapshots.push({
        hasStartingStyle: element.hasAttribute('data-starting-style'),
        opacity: computedStyle.opacity,
        transform: computedStyle.transform,
      });
    };

    await render(
      <React.Fragment>
        <style>{`
          .popup-starting-style-test {
            opacity: 1;
            transform: scale(1);
            transition:
              opacity 200ms linear,
              transform 200ms linear;
          }

          .popup-starting-style-test[data-starting-style] {
            opacity: 0;
            transform: scale(0.9);
          }
        `}</style>
        <Popover.Root>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup
                ref={setPopupElement}
                className="popup-starting-style-test"
                data-testid="popup"
                style={popupStyle}
              >
                Popup
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </React.Fragment>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(mountSnapshots).toHaveLength(1);
    });
    expect(mountSnapshots[0].hasStartingStyle).toBe(true);
    expect(mountSnapshots[0].opacity).toBe('0');
    expect(mountSnapshots[0].transform).not.toBe('none');

    const firstPopup = screen.getByTestId('popup');
    await waitFor(() => {
      expect(Number.parseFloat(getComputedStyle(firstPopup).opacity)).toBeGreaterThan(0);
    });
    expect(getComputedStyle(firstPopup).transform).not.toBe(mountSnapshots[0].transform);

    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
    });

    fireEvent.click(trigger);
    await waitFor(() => {
      expect(mountSnapshots).toHaveLength(2);
    });
    expect(mountSnapshots[1].hasStartingStyle).toBe(true);
    expect(mountSnapshots[1].opacity).toBe('0');
    expect(mountSnapshots[1].transform).not.toBe('none');

    const secondPopup = screen.getByTestId('popup');
    await waitFor(() => {
      expect(Number.parseFloat(getComputedStyle(secondPopup).opacity)).toBeGreaterThan(0);
    });
    expect(getComputedStyle(secondPopup).transform).not.toBe(mountSnapshots[1].transform);
  });

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
});
