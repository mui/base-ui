import { afterEach, expect } from 'vitest';
import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

const Trigger = React.forwardRef(function Trigger(
  props: PreviewCard.Trigger.Props,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  return <PreviewCard.Trigger {...props} ref={ref} render={<div />} />;
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

describe('<PreviewCard.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<PreviewCard.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <PreviewCard.Root open>
          <PreviewCard.Portal>{node}</PreviewCard.Portal>
        </PreviewCard.Root>,
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
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner data-testid="positioner" sideOffset={sideOffset}>
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX,
        y: baselineY + sideOffset,
      });
    });

    it('offsets the side when a function is specified', async () => {
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              data-testid="positioner"
              sideOffset={(data) => data.positioner.width + data.anchor.width}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX,
        y: baselineY + popupWidth + anchorWidth,
      });
    });

    it('can read the latest side inside sideOffset', async () => {
      let side = 'none';
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side="left"
              data-testid="positioner"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('right');
    });

    it('can read the latest align inside sideOffset', async () => {
      let align = 'none';
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side="right"
              align="start"
              data-testid="positioner"
              sideOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      // correctly flips the align in the browser
      expect(align).toBe('end');
    });

    it('reads logical side inside sideOffset', async () => {
      let side = 'none';
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side="inline-start"
              data-testid="positioner"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('inline-end');
    });
  });

  describe.skipIf(isJSDOM)('prop: alignOffset', () => {
    it('offsets the align when a number is specified', async () => {
      const alignOffset = 7;
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner data-testid="positioner" alignOffset={alignOffset}>
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX + alignOffset,
        y: baselineY,
      });
    });

    it('offsets the align when a function is specified', async () => {
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              data-testid="positioner"
              alignOffset={(data) => data.positioner.width}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      expect(screen.getByTestId('positioner').getBoundingClientRect()).toMatchObject({
        x: baselineX + popupWidth,
        y: baselineY,
      });
    });

    it('can read the latest side inside alignOffset', async () => {
      let side = 'none';
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side="left"
              data-testid="positioner"
              alignOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('right');
    });

    it('can read the latest align inside alignOffset', async () => {
      let align = 'none';
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side="right"
              align="start"
              data-testid="positioner"
              alignOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      // correctly flips the align in the browser
      expect(align).toBe('end');
    });

    it('reads logical side inside alignOffset', async () => {
      let side = 'none';
      await render(
        <PreviewCard.Root open>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side="inline-start"
              data-testid="positioner"
              alignOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      // correctly flips the side in the browser
      expect(side).toBe('inline-end');
    });
  });

  it.skipIf(isJSDOM)('uses transform positioning without Viewport', async () => {
    await render(
      <PreviewCard.Root open>
        <Trigger style={triggerStyle}>Trigger</Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner data-testid="positioner">
            <PreviewCard.Popup style={popupStyle}>Popup</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );

    const positioner = screen.getByTestId('positioner');
    expect(positioner.style.transform).not.toBe('');
  });

  it.skipIf(isJSDOM)('uses top/left positioning with Viewport', async () => {
    await render(
      <PreviewCard.Root open>
        <Trigger style={triggerStyle}>Trigger</Trigger>
        <PreviewCard.Portal>
          <PreviewCard.Positioner data-testid="positioner">
            <PreviewCard.Popup style={popupStyle}>
              <PreviewCard.Viewport>Popup</PreviewCard.Viewport>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );

    const positioner = screen.getByTestId('positioner');
    await waitFor(() => {
      expect(positioner.style.transform).toBe('');
    });
  });

  describe.skipIf(isJSDOM)('multiline inline trigger', () => {
    afterEach(() => {
      window.scrollTo(0, 0);
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.body.style.margin = '';
    });

    it('positions the popup relative to the hovered line of a multiline trigger', async () => {
      const { user } = await render(
        <div>
          <PreviewCard.Root>
            <PreviewCard.Trigger
              delay={0}
              data-testid="trigger"
              style={{ display: 'inline', width: 100, lineHeight: 20 }}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </PreviewCard.Trigger>
            <PreviewCard.Portal>
              <PreviewCard.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                <PreviewCard.Popup style={{ width: 80, height: 40 }}>
                  Preview Content
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
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

    it('keeps the popup aligned after page scroll', async () => {
      document.documentElement.style.height = '4000px';
      document.body.style.height = '4000px';
      document.body.style.margin = '0';

      const { user } = await render(
        <div>
          <div style={{ height: 1200 }} />
          <PreviewCard.Root>
            <PreviewCard.Trigger
              delay={0}
              data-testid="trigger"
              style={{ display: 'inline', width: 100, lineHeight: 20 }}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </PreviewCard.Trigger>
            <PreviewCard.Portal>
              <PreviewCard.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                <PreviewCard.Popup style={{ width: 80, height: 40 }}>
                  Preview Content
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
          <div style={{ height: 1200 }} />
        </div>,
      );

      window.scrollTo(0, 1000);

      await waitFor(() => {
        expect(window.scrollY).toBe(1000);
      });

      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).to.be.greaterThan(1);

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

      const expectedY = secondLineRect.bottom + 5;

      await waitFor(() => {
        const { x: positionerX, y: positionerY } = positioner.getBoundingClientRect();
        expect(positionerY).to.be.closeTo(expectedY, 2);
        expect(positionerX).to.be.greaterThanOrEqual(secondLineRect.left - 10);
        expect(positionerX).to.be.lessThanOrEqual(secondLineRect.right + 10);
      });
    });

    it('positions the popup relative to the side-aligned rect when open is controlled', async () => {
      const sideOffset = 5;
      const inlinePopupHeight = 40;

      await render(
        <div>
          <PreviewCard.Root open>
            <PreviewCard.Trigger
              delay={0}
              data-testid="trigger"
              style={{ display: 'inline', width: 100, lineHeight: 20 }}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </PreviewCard.Trigger>
            <PreviewCard.Portal>
              <PreviewCard.Positioner
                data-testid="positioner"
                side="bottom"
                sideOffset={sideOffset}
              >
                <PreviewCard.Popup style={{ width: 80, height: inlinePopupHeight }}>
                  Preview Content
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
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
            <PreviewCard.Root
              open={open}
              triggerId={triggerId}
              onOpenChange={(nextOpen, eventDetails) => {
                setOpen(nextOpen);
                setTriggerId(eventDetails.trigger?.id ?? null);
              }}
            >
              <PreviewCard.Trigger
                href="#"
                id="trigger-1"
                data-testid="trigger-1"
                delay={0}
                style={{ display: 'inline' }}
              >
                Trigger 1
              </PreviewCard.Trigger>
              <PreviewCard.Trigger
                href="#"
                id="trigger-2"
                data-testid="trigger-2"
                delay={0}
                style={{ display: 'inline' }}
              >
                Trigger 2
              </PreviewCard.Trigger>
              <PreviewCard.Portal>
                <PreviewCard.Positioner data-testid="positioner" side="bottom" sideOffset={5}>
                  <PreviewCard.Popup style={{ width: 80, height: 40 }}>
                    Preview Content
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>

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
          <PreviewCard.Root>
            <PreviewCard.Trigger
              delay={0}
              data-testid="trigger"
              tabIndex={0}
              style={{ display: 'inline', width: 100, lineHeight: 20 }}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </PreviewCard.Trigger>
            <PreviewCard.Portal>
              <PreviewCard.Positioner data-testid="positioner" side="top" sideOffset={sideOffset}>
                <PreviewCard.Popup style={{ width: 80, height: inlinePopupHeight }}>
                  Preview Content
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
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
