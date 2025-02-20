import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { Switch } from '@base-ui-components/react/switch';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { ToolbarRootContext } from '../root/ToolbarRootContext';
import { CompositeRootContext } from '../../composite/root/CompositeRootContext';

const testCompositeContext = {
  highlightedIndex: 0,
  onHighlightedIndexChange: NOOP,
};

const testToolbarContext: ToolbarRootContext = {
  disabled: false,
  orientation: 'horizontal',
  setItemMap: NOOP,
};

describe('<Toolbar.Button />', () => {
  const { render } = createRenderer();

  describeConformance(<Toolbar.Button />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render: (node) => {
      return render(
        <ToolbarRootContext.Provider value={testToolbarContext}>
          <CompositeRootContext.Provider value={testCompositeContext}>
            {node}
          </CompositeRootContext.Provider>
        </ToolbarRootContext.Provider>,
      );
    },
  }));

  describe('ARIA attributes', () => {
    it('renders a button', async () => {
      const { getByTestId } = await render(
        <Toolbar.Root>
          <Toolbar.Button data-testid="button" />
        </Toolbar.Root>,
      );

      expect(getByTestId('button')).to.equal(screen.getByRole('button'));
    });
  });

  describe('rendering other Base UI components', () => {
    describe('Switch', () => {
      it('renders a switch', async () => {
        const { getByTestId } = await render(
          <Toolbar.Root>
            <Toolbar.Button data-testid="button" render={<Switch.Root />} />
          </Toolbar.Root>,
        );

        expect(getByTestId('button')).to.equal(screen.getByRole('switch'));
      });

      it('handles events', async () => {
        const handleCheckedChange = spy();
        const handleClick = spy();
        const { user } = await render(
          <Toolbar.Root>
            <Toolbar.Button
              onClick={handleClick}
              render={<Switch.Root defaultChecked={false} onCheckedChange={handleCheckedChange} />}
            />
          </Toolbar.Root>,
        );

        const switchElement = screen.getByRole('switch');
        expect(switchElement).to.have.attribute('data-unchecked');

        await user.keyboard('[Tab]');
        expect(switchElement).to.have.attribute('data-highlighted');
        expect(switchElement).to.have.attribute('tabindex', '0');

        await user.click(switchElement);
        expect(handleCheckedChange.callCount).to.equal(1);
        expect(handleClick.callCount).to.equal(1);
        expect(switchElement).to.have.attribute('data-checked');

        await user.keyboard('[Enter]');
        expect(handleCheckedChange.callCount).to.equal(2);
        expect(handleClick.callCount).to.equal(2);
        expect(switchElement).to.have.attribute('data-unchecked');

        await user.keyboard('[Space]');
        expect(handleCheckedChange.callCount).to.equal(3);
        expect(handleClick.callCount).to.equal(3);
        expect(switchElement).to.have.attribute('data-checked');
      });

      it('disabled state', async () => {
        const handleCheckedChange = spy();
        const handleClick = spy();
        const { user } = await render(
          <Toolbar.Root>
            <Toolbar.Button
              disabled
              onClick={handleClick}
              render={<Switch.Root onCheckedChange={handleCheckedChange} />}
            />
          </Toolbar.Root>,
        );

        const switchElement = screen.getByRole('switch');

        expect(switchElement).to.not.have.attribute('disabled');
        expect(switchElement).to.have.attribute('data-disabled');
        expect(switchElement).to.have.attribute('aria-disabled', 'true');

        await user.keyboard('[Tab]');
        expect(switchElement).to.have.attribute('data-highlighted');
        expect(switchElement).to.have.attribute('tabindex', '0');

        await user.keyboard('[Enter]');
        expect(handleCheckedChange.callCount).to.equal(0);
        expect(handleClick.callCount).to.equal(0);

        await user.keyboard('[Space]');
        expect(handleCheckedChange.callCount).to.equal(0);
        expect(handleClick.callCount).to.equal(0);

        await user.click(switchElement);
        expect(handleCheckedChange.callCount).to.equal(0);
        expect(handleClick.callCount).to.equal(0);
      });
    });
  });
});
