import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

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

      expect(screen.getByTestId('positioner').getBoundingClientRect()).to.include({
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

      expect(screen.getByTestId('positioner').getBoundingClientRect()).to.include({
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
      expect(side).to.equal('right');
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
      expect(align).to.equal('end');
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
      expect(side).to.equal('inline-end');
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

      expect(screen.getByTestId('positioner').getBoundingClientRect()).to.include({
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

      expect(screen.getByTestId('positioner').getBoundingClientRect()).to.include({
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
      expect(side).to.equal('right');
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
      expect(align).to.equal('end');
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
      expect(side).to.equal('inline-end');
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

    expect(positioner.getBoundingClientRect()).to.include(initial);

    await setPropsAsync({ top: 100 });

    await waitFor(() => {
      expect(positioner.getBoundingClientRect()).not.to.include(initial);
    });

    expect(positioner.getBoundingClientRect()).to.include(final);
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

    expect(positioner.getBoundingClientRect()).to.include(initial);

    await setPropsAsync({ top: 100 });

    await waitFor(() => {
      expect(positioner.getBoundingClientRect()).not.to.include(initial);
    });

    expect(positioner.getBoundingClientRect()).to.include(final);
  });

  describe.skipIf(isJSDOM)('multiline inline trigger', () => {
    it('positions the popup relative to the hovered line of a multiline trigger', async () => {
      const { user } = await render(
        <div>
          <Popover.Root>
            <Trigger
              data-testid="trigger"
              style={{ display: 'inline', width: 100, lineHeight: 20 }}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </Trigger>
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

      expect(triggerRects.length).to.be.greaterThan(1);

      // Hover over the second line (need to move mouse first to capture the rect)
      const secondLineRect = triggerRects[1];
      const secondLineCenterX = secondLineRect.left + secondLineRect.width / 2;
      const secondLineCenterY = secondLineRect.top + secondLineRect.height / 2;

      await user.pointer([
        { target: document.body },
        {
          target: trigger,
          coords: { clientX: secondLineCenterX, clientY: secondLineCenterY },
        },
        {
          keys: '[MouseLeft]',
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
          <Popover.Root open>
            <Trigger
              data-testid="trigger"
              style={{ display: 'inline', width: 100, lineHeight: 20 }}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner" side="bottom" sideOffset={sideOffset}>
                <Popover.Popup style={{ width: 80, height: inlinePopupHeight }}>
                  Popover Content
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
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

    it('positions the popup relative to the side-aligned rect when opened via focus', async () => {
      const sideOffset = 5;
      const inlinePopupHeight = 40;
      const { user } = await render(
        <div>
          <Popover.Root>
            <Trigger
              data-testid="trigger"
              tabIndex={0}
              style={{ display: 'inline', width: 100, lineHeight: 20 }}
            >
              This is a long text that will wrap across multiple lines in the trigger element
            </Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner" side="top" sideOffset={sideOffset}>
                <Popover.Popup style={{ width: 80, height: inlinePopupHeight }}>
                  Popover Content
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');
      const triggerRects = trigger.getClientRects();

      expect(triggerRects.length).to.be.greaterThan(1);

      const targetRect = triggerRects[0];
      const expectedY = targetRect.top - inlinePopupHeight - sideOffset;

      await user.tab();
      await user.keyboard('[Enter]');

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
