import { expect } from 'vitest';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tooltip.Portal />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Portal />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Tooltip.Root open>{node}</Tooltip.Root>);
    },
  }));

  describe('prop: keepMounted', () => {
    function ClosedTooltip({ keepMounted }: { keepMounted?: boolean }) {
      return (
        <Tooltip.Root>
          <Tooltip.Trigger>Trigger</Tooltip.Trigger>
          <Tooltip.Portal keepMounted={keepMounted}>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="popup">Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      );
    }

    it('renders the closed popup as hidden instead of unmounting it', async () => {
      await render(<ClosedTooltip keepMounted />);

      expect(screen.getByTestId('popup')).toBeInaccessible();
    });

    it('unmounts the closed popup by default', async () => {
      await render(<ClosedTooltip />);

      expect(screen.queryByTestId('popup')).toBe(null);
    });
  });
});
