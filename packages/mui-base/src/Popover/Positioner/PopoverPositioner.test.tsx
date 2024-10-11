import * as React from 'react';
import * as Popover from '@base_ui/react/Popover';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';

describe('<Popover.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Popover.Root open animated={false}>
          {node}
        </Popover.Root>,
      );
    },
  }));

  describe('prop: keepMounted', () => {
    it('has inert attribute when closed', async () => {
      await render(
        <Popover.Root animated={false}>
          <Popover.Positioner keepMounted data-testid="positioner" />
        </Popover.Root>,
      );

      expect(screen.getByTestId('positioner')).to.have.attribute('inert');
    });

    it('does not have inert attribute when open', async () => {
      await render(
        <Popover.Root open animated={false}>
          <Popover.Positioner keepMounted data-testid="positioner" />
        </Popover.Root>,
      );

      expect(screen.getByTestId('positioner')).not.to.have.attribute('inert');
    });
  });
});
