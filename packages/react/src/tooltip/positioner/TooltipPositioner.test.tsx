import { afterEach, expect, vi } from 'vitest';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

const Trigger = React.forwardRef(function Trigger(
  props: Tooltip.Trigger.Props,
  ref: React.ForwardedRef<any>,
) {
  return <Tooltip.Trigger {...props} ref={ref} render={<div />} />;
});

describe('<Tooltip.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Tooltip.Root open>
          <Tooltip.Portal>{node}</Tooltip.Portal>
        </Tooltip.Root>,
      );
    },
  }));

  it('throws a descriptive error when rendered outside <Tooltip.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Tooltip.Positioner />)).rejects.toThrow(
        'Base UI: TooltipRootContext is missing. Tooltip parts must be placed within <Tooltip.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('throws a descriptive error when rendered outside <Tooltip.Portal>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Tooltip.Root open>
            <Tooltip.Positioner />
          </Tooltip.Root>,
        ),
      ).rejects.toThrow('Base UI: <Tooltip.Portal> is missing.');
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
        <Tooltip.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner data-testid="positioner" sideOffset={sideOffset}>
              <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX,
        y: baselineY + sideOffset,
      });
    });

    it('offsets the side when a function is specified', async () => {
      await render(
        <Tooltip.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner
              data-testid="positioner"
              sideOffset={(data) => data.positioner.width + data.anchor.width}
            >
              <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX,
        y: baselineY + popupWidth + anchorWidth,
      });
    });

    it('can read the latest side inside sideOffset', async () => {
      let side = 'none';
      await render(
        <Tooltip.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner
              side="left"
              data-testid="positioner"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('right');
    });

    it('can read the latest align inside sideOffset', async () => {
      let align = 'none';
      await render(
        <Tooltip.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner
              side="right"
              align="start"
              data-testid="positioner"
              sideOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      // correctly flips the align in the browser
      expect(align).toBe('end');
    });

    it('reads logical side inside sideOffset', async () => {
      let side = 'none';
      await render(
        <Tooltip.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner
              side="inline-start"
              data-testid="positioner"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('inline-end');
    });
  });

  describe.skipIf(isJSDOM)('prop: alignOffset', () => {
    it('offsets the align when a number is specified', async () => {
      const alignOffset = 7;
      await render(
        <Tooltip.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner data-testid="positioner" alignOffset={alignOffset}>
              <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX + alignOffset,
        y: baselineY,
      });
    });

    it('offsets the align when a function is specified', async () => {
      await render(
        <Tooltip.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner
              data-testid="positioner"
              alignOffset={(data) => data.positioner.width}
            >
              <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX + popupWidth,
        y: baselineY,
      });
    });

    it('can read the latest side inside alignOffset', async () => {
      let side = 'none';
      await render(
        <Tooltip.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner
              side="left"
              data-testid="positioner"
              alignOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('right');
    });

    it('can read the latest align inside alignOffset', async () => {
      let align = 'none';
      await render(
        <Tooltip.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner
              side="right"
              align="start"
              data-testid="positioner"
              alignOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      // correctly flips the align in the browser
      expect(align).toBe('end');
    });

    it('reads logical side inside alignOffset', async () => {
      let side = 'none';
      await render(
        <Tooltip.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner
              side="inline-start"
              data-testid="positioner"
              alignOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('inline-end');
    });
  });

  it.skipIf(isJSDOM)('uses transform positioning without Viewport', async () => {
    await render(
      <Tooltip.Root open>
        <Trigger style={triggerStyle}>Trigger</Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner data-testid="positioner">
            <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );

    const positioner = screen.getByTestId('positioner');
    expect(positioner.style.transform).not.toBe('');
  });

  it.skipIf(isJSDOM)('uses top/left positioning with Viewport', async () => {
    await render(
      <Tooltip.Root open>
        <Trigger style={triggerStyle}>Trigger</Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner data-testid="positioner">
            <Tooltip.Popup style={popupStyle}>
              <Tooltip.Viewport>Popup</Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );

    const positioner = screen.getByTestId('positioner');
    await waitFor(() => {
      expect(positioner.style.transform).toBe('');
    });
  });

  it.skipIf(isJSDOM)('updates positioning when Viewport mounts and unmounts', async () => {
    function App() {
      const [showViewport, setShowViewport] = React.useState(false);

      return (
        <React.Fragment>
          <button onClick={() => setShowViewport((value) => !value)}>Toggle Viewport</button>
          <Tooltip.Root open>
            <Trigger style={triggerStyle}>Trigger</Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner data-testid="positioner">
                <Tooltip.Popup style={popupStyle}>
                  {showViewport ? <Tooltip.Viewport>Popup</Tooltip.Viewport> : 'Popup'}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </React.Fragment>
      );
    }

    const { user } = await render(<App />);
    const positioner = screen.getByTestId('positioner');

    expect(positioner.style.transform).not.toBe('');

    await user.click(screen.getByRole('button', { name: 'Toggle Viewport' }));
    await waitFor(() => {
      expect(positioner.style.transform).toBe('');
    });

    await user.click(screen.getByRole('button', { name: 'Toggle Viewport' }));
    await waitFor(() => {
      expect(positioner.style.transform).not.toBe('');
    });
  });

  describe.skipIf(isJSDOM)('multiline inline trigger', () => {
    afterEach(() => {
      window.scrollTo(0, 0);
    });

    it('positions the popup relative to the hovered line of a multiline trigger', async () => {
      const { user } = await render(
        <div style={multilineWrapperStyle}>
          <Tooltip.Root>
            <Tooltip.Trigger
              delay={0}
              data-testid="trigger"
              render={<span />}
              style={multilineTriggerStyle}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                <Tooltip.Popup style={{ width: 80, height: 40 }}>Tooltip Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
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
        <Tooltip.Root>
          <Tooltip.Trigger
            delay={0}
            data-testid="trigger"
            render={<span />}
            style={{ display: 'inline-block', width: 120, height: 20 }}
          >
            Trigger
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
              <Tooltip.Popup style={{ width: 80, height: 40 }}>Tooltip Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
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
          <Tooltip.Root>
            <Tooltip.Trigger
              delay={0}
              closeDelay={0}
              data-testid="trigger"
              render={<span />}
              style={multilineTriggerStyle}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                <Tooltip.Popup style={{ width: 80, height: 40 }}>Tooltip Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
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
