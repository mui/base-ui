import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  describeConformance,
  isJSDOM,
  positionerConformanceTests,
} from '#test-utils';

const Trigger = React.forwardRef(function Trigger(
  props: Select.Trigger.Props,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  return <Select.Trigger {...props} ref={ref} />;
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

  const triggerStyle = { width: 72, height: 36 };
  const popupStyle = { width: 52, height: 24 };

  positionerConformanceTests({
    render,
    createComponent: ({ root, trigger, positioner, popup }) => (
      <Select.Root {...root}>
        <Trigger {...trigger}>Trigger</Trigger>
        <Select.Portal>
          <Select.Positioner align="center" alignItemWithTrigger={false} {...positioner}>
            <Select.Popup {...popup}>Popup</Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ),
  });

  describe.skipIf(isJSDOM)('kept-mounted positioner', () => {
    it('does not retain stale coordinates while closed', async () => {
      const { user } = await render(
        <Select.Root defaultOpen>
          <Trigger style={triggerStyle}>Trigger</Trigger>
          <Select.Portal>
            <Select.Positioner data-testid="positioner" alignItemWithTrigger={false}>
              <Select.Popup style={popupStyle}>Popup</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const positioner = screen.getByTestId('positioner');
      expect(positioner.style.transform).not.toBe('');

      await user.keyboard('{Escape}');

      // The portal can remount around the close, so re-query the kept-mounted node.
      await waitFor(() => {
        expect(screen.getByTestId('positioner').hidden).toBe(true);
      });

      // Rendering the full-size popup at coordinates computed for the hidden (zero-size)
      // positioner can overflow the layout viewport on the next open, making mobile Chrome
      // zoom the page out. The positioner must sit at the viewport origin until positioned.
      const closedPositioner = screen.getByTestId('positioner');
      await waitFor(() => {
        expect(closedPositioner.style.position).toBe('fixed');
      });
      expect(closedPositioner.style.transform).toBe('');
      expect(closedPositioner.style.top).toBe('0px');
      expect(closedPositioner.style.left).toBe('0px');
    });
  });
});
