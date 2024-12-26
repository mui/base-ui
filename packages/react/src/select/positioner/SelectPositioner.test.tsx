import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { describeSkipIf, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance } from '#test-utils';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

const Trigger = React.forwardRef(function Trigger(
  props: Select.Trigger.Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return <Select.Trigger {...props} ref={ref} render={<div />} />;
});

describe('<Select.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Portal>{node}</Select.Portal>
        </Select.Root>,
      );
    },
  }));

  const baselineX = 10.5;
  const baselineY = 18.5;
  const popupWidth = 51;
  const anchorWidth = 72;

  describeSkipIf(isJSDOM)('prop: sideOffset', () => {
    it('offsets the side when a number is specified', async () => {
      const sideOffset = 7;
      await render(
        <Select.Root open alignItemToTrigger={false}>
          <Trigger style={{ width: anchorWidth }}>Trigger</Trigger>
          <Select.Portal>
            <Select.Positioner data-testid="positioner" align="center" sideOffset={sideOffset}>
              <Select.Popup style={{ width: popupWidth }}>Popup</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(screen.getByTestId('positioner').style.transform).to.equal(
        `translate(${baselineX}px, ${baselineY + sideOffset}px)`,
      );
    });

    it('offsets the side when a function is specified', async () => {
      await render(
        <Select.Root open alignItemToTrigger={false}>
          <Trigger style={{ width: anchorWidth }}>Trigger</Trigger>
          <Select.Portal>
            <Select.Positioner
              data-testid="positioner"
              align="center"
              sideOffset={(data) => data.popup.width + data.anchor.width}
            >
              <Select.Popup style={{ width: popupWidth }}>Popup</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(screen.getByTestId('positioner').style.transform).to.equal(
        `translate(${baselineX}px, ${baselineY + popupWidth + anchorWidth}px)`,
      );
    });

    it('can read the latest side inside sideOffset', async () => {
      let side = 'none';
      await render(
        <Select.Root open alignItemToTrigger={false}>
          <Trigger style={{ width: anchorWidth }}>Trigger</Trigger>
          <Select.Portal>
            <Select.Positioner
              side="left"
              align="center"
              data-testid="positioner"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Select.Popup style={{ width: popupWidth }}>Popup</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      // correctly flips the side in the browser
      expect(side).to.equal('right');
    });

    it('can read the latest align inside sideOffset', async () => {
      let align = 'none';
      await render(
        <Select.Root open alignItemToTrigger={false}>
          <Trigger style={{ width: anchorWidth }}>Trigger</Trigger>
          <Select.Portal>
            <Select.Positioner
              side="right"
              align="start"
              data-testid="positioner"
              sideOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <Select.Popup style={{ width: popupWidth }}>Popup</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(align).to.equal('start');
    });
  });

  describeSkipIf(isJSDOM)('prop: alignOffset', () => {
    it('offsets the align when a number is specified', async () => {
      const alignOffset = 7;
      await render(
        <Select.Root open alignItemToTrigger={false}>
          <Trigger style={{ width: anchorWidth }}>Trigger</Trigger>
          <Select.Portal>
            <Select.Positioner data-testid="positioner" align="center" alignOffset={alignOffset}>
              <Select.Popup style={{ width: popupWidth }}>Popup</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(screen.getByTestId('positioner').style.transform).to.equal(
        `translate(${baselineX + alignOffset}px, ${baselineY}px)`,
      );
    });

    it('offsets the align when a function is specified', async () => {
      await render(
        <Select.Root open alignItemToTrigger={false}>
          <Trigger style={{ width: anchorWidth }}>Trigger</Trigger>
          <Select.Portal>
            <Select.Positioner
              data-testid="positioner"
              align="center"
              alignOffset={(data) => data.popup.width}
            >
              <Select.Popup style={{ width: popupWidth }}>Popup</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(screen.getByTestId('positioner').style.transform).to.equal(
        `translate(${baselineX + popupWidth}px, ${baselineY}px)`,
      );
    });

    it('can read the latest side inside alignOffset', async () => {
      let side = 'none';
      await render(
        <Select.Root open alignItemToTrigger={false}>
          <Trigger style={{ width: anchorWidth }}>Trigger</Trigger>
          <Select.Portal>
            <Select.Positioner
              side="left"
              align="center"
              data-testid="positioner"
              alignOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Select.Popup style={{ width: popupWidth }}>Popup</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      // correctly flips the side in the browser
      expect(side).to.equal('right');
    });

    it('can read the latest align inside alignOffset', async () => {
      let align = 'none';
      await render(
        <Select.Root open alignItemToTrigger={false}>
          <Trigger style={{ width: anchorWidth }}>Trigger</Trigger>
          <Select.Portal>
            <Select.Positioner
              side="right"
              align="start"
              data-testid="positioner"
              alignOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <Select.Popup style={{ width: popupWidth }}>Popup</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(align).to.equal('start');
    });
  });
});
