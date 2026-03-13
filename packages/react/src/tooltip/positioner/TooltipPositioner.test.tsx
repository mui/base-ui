import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

const Trigger = React.forwardRef(function Trigger(
  props: Tooltip.Trigger.Props,
  ref: React.ForwardedRef<any>,
) {
  return <Tooltip.Trigger {...props} ref={ref} render={<div />} />;
});

type RectLike = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

function mockClientRects(element: Element, rects: RectLike[]) {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  const boundingRect = DOMRect.fromRect({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  });

  Object.defineProperty(element, 'getClientRects', {
    configurable: true,
    value: () =>
      rects.map((rect) =>
        DOMRect.fromRect({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        }),
      ),
  });

  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => boundingRect,
  });
}

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
        <Tooltip.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner data-testid="positioner" sideOffset={sideOffset}>
              <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).to.include({
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

      expect(screen.getByTestId('positioner').getBoundingClientRect()).to.include({
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
      expect(side).to.equal('right');
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
      expect(align).to.equal('end');
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
      expect(side).to.equal('inline-end');
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

      expect(screen.getByTestId('positioner').getBoundingClientRect()).to.include({
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

      expect(screen.getByTestId('positioner').getBoundingClientRect()).to.include({
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
      expect(side).to.equal('right');
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
      expect(align).to.equal('end');
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
      expect(side).to.equal('inline-end');
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
    expect(positioner.style.transform).not.to.equal('');
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
      expect(positioner.style.transform).to.equal('');
    });
  });

  it.skipIf(isJSDOM)(
    'does not affect single-rect trigger positioning on non-default sides',
    async () => {
      await render(
        <Tooltip.Root open>
          <Trigger data-testid="trigger" style={triggerStyle}>
            Trigger
          </Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner data-testid="positioner" side="right">
              <Tooltip.Popup style={popupStyle}>Popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      expect(screen.getByTestId('trigger').getClientRects()).to.have.length(1);

      await waitFor(() => {
        expect(screen.getByTestId('positioner').getBoundingClientRect()).to.include({
          x: anchorWidth,
          y: (anchorHeight - popupHeight) / 2,
        });
      });
    },
  );

  describe.skipIf(isJSDOM)('multiline inline trigger', () => {
    it('positions the popup relative to the hovered line of a multiline trigger', async () => {
      const { user } = await render(
        <div>
          <Tooltip.Root>
            <Trigger
              data-testid="trigger"
              delay={0}
              style={{ display: 'inline', width: 100, lineHeight: 20 }}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </Trigger>
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

      expect(triggerRects.length).to.be.greaterThan(1);

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

      const positioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expect(positioner).toBeVisible();
      });

      // The positioner should be positioned relative to the second line,
      // not the first line or the bounding client rect.
      // y-coordinate should be close to the second line's bottom + sideOffset
      const expectedY = secondLineRect.bottom + 5;

      await waitFor(() => {
        const { x: positionerX, y: positionerY } = positioner.getBoundingClientRect();
        expect(positionerY).to.be.closeTo(expectedY, 2);

        // x-coordinate should also be relative to where we hovered on the second line
        expect(positionerX).to.be.greaterThanOrEqual(secondLineRect.left - 10);
        expect(positionerX).to.be.lessThanOrEqual(secondLineRect.right + 10);
      });
    });

    it('positions the popup relative to the side-aligned rect when open is controlled', async () => {
      const sideOffset = 5;
      const inlinePopupHeight = 40;

      await render(
        <div>
          <Tooltip.Root open>
            <Trigger
              data-testid="trigger"
              delay={0}
              style={{ display: 'inline', width: 100, lineHeight: 20 }}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner data-testid="positioner" side="bottom" sideOffset={sideOffset}>
                <Tooltip.Popup style={{ width: 80, height: inlinePopupHeight }}>
                  Tooltip Content
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).to.be.greaterThan(1);

      const targetRect = triggerRects[triggerRects.length - 1];
      const expectedY = targetRect.bottom + sideOffset;

      await waitFor(() => {
        const positioner = screen.getByTestId('positioner');
        expect(positioner).toBeVisible();

        const { x: positionerX, y: positionerY } = positioner.getBoundingClientRect();
        expect(positionerY).to.be.closeTo(expectedY, 2);
        expect(positionerX).to.be.greaterThanOrEqual(targetRect.left - 10);
        expect(positionerX).to.be.lessThanOrEqual(targetRect.right + 10);
      });
    });

    it('ignores stale hovered coords when a controlled trigger switch reuses the popup', async () => {
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [triggerId, setTriggerId] = React.useState<string | null>(null);

        return (
          <div>
            <Tooltip.Root
              open={open}
              triggerId={triggerId}
              onOpenChange={(nextOpen, eventDetails) => {
                setOpen(nextOpen);
                setTriggerId(eventDetails.trigger?.id ?? null);
              }}
            >
              <Trigger
                id="trigger-1"
                data-testid="trigger-1"
                delay={0}
                style={{ display: 'inline' }}
              >
                Trigger 1
              </Trigger>
              <Trigger
                id="trigger-2"
                data-testid="trigger-2"
                delay={0}
                style={{ display: 'inline' }}
              >
                Trigger 2
              </Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                  <Tooltip.Popup style={{ width: 80, height: 40 }}>Tooltip Content</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>

            <button
              type="button"
              onClick={() => {
                setOpen(true);
                setTriggerId('trigger-2');
              }}
            >
              Switch
            </button>
          </div>
        );
      }

      const { user } = await render(<Test />);
      const trigger1 = screen.getByTestId('trigger-1');
      const trigger2 = screen.getByTestId('trigger-2');

      mockClientRects(trigger1, [
        { left: 180, top: 0, right: 220, bottom: 10, width: 40, height: 10 },
        { left: 100, top: 20, right: 160, bottom: 30, width: 60, height: 10 },
      ]);
      mockClientRects(trigger2, [
        { left: 180, top: 100, right: 220, bottom: 110, width: 40, height: 10 },
        { left: 100, top: 120, right: 160, bottom: 130, width: 60, height: 10 },
      ]);

      await user.pointer([
        { target: document.body },
        { target: trigger1, coords: { clientX: 200, clientY: 5 } },
      ]);

      await waitFor(() => {
        expect(screen.getByTestId('positioner')).toBeVisible();
      });

      await user.click(screen.getByRole('button', { name: 'Switch' }));

      await waitFor(() => {
        const { x: positionerX, y: positionerY } = screen
          .getByTestId('positioner')
          .getBoundingClientRect();

        expect(positionerY).to.be.closeTo(135, 2);
        expect(positionerX).to.be.greaterThanOrEqual(90);
        expect(positionerX).to.be.lessThanOrEqual(170);
      });
    });

    it('positions the popup relative to the side-aligned rect when opened via focus', async () => {
      const sideOffset = 5;
      const inlinePopupHeight = 40;
      const { user } = await render(
        <div>
          <Tooltip.Root>
            <Trigger
              data-testid="trigger"
              delay={0}
              tabIndex={0}
              style={{ display: 'inline', width: 100, lineHeight: 20 }}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner data-testid="positioner" side="top" sideOffset={sideOffset}>
                <Tooltip.Popup style={{ width: 80, height: inlinePopupHeight }}>
                  Tooltip Content
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).to.be.greaterThan(1);

      const targetRect = triggerRects[0];
      const expectedY = targetRect.top - inlinePopupHeight - sideOffset;

      await user.tab();

      await waitFor(() => {
        const positioner = screen.getByTestId('positioner');
        expect(positioner).toBeVisible();

        const { x: positionerX, y: positionerY } = positioner.getBoundingClientRect();
        expect(positionerY).to.be.closeTo(expectedY, 2);
        expect(positionerX).to.be.greaterThanOrEqual(targetRect.left - 10);
        expect(positionerX).to.be.lessThanOrEqual(targetRect.right + 10);
      });
    });
  });
});
