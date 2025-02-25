import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { NumberField } from '@base-ui-components/react/number-field';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { ToolbarRootContext } from '../root/ToolbarRootContext';
import { type Orientation } from '../../utils/types';
import { CompositeRootContext } from '../../composite/root/CompositeRootContext';
import { ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT } from '../../composite/composite';

const testCompositeContext = {
  highlightedIndex: 0,
  onHighlightedIndexChange: NOOP,
};

const testToolbarContext: ToolbarRootContext = {
  disabled: false,
  orientation: 'horizontal',
  setItemMap: NOOP,
};

describe('<Toolbar.Input />', () => {
  const { render } = createRenderer();

  describeConformance(<Toolbar.Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    testRenderPropWith: 'input',
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
    it('renders a textbox', async () => {
      const { getByTestId } = await render(
        <Toolbar.Root>
          <Toolbar.Input data-testid="input" />
        </Toolbar.Root>,
      );

      expect(getByTestId('input')).to.equal(screen.getByRole('textbox'));
    });
  });

  describe.skipIf(isJSDOM)('keyboard navigation', () => {
    // when navigating through RTL text in real browsers the arrow keys for
    // moving the text insertion cursor is also reversed from LTR but this doesn't
    // work with testing library
    [
      ['horizontal', ARROW_RIGHT, ARROW_LEFT],
      ['vertical', ARROW_DOWN, ARROW_UP],
    ].forEach((entry) => {
      const [orientation, nextKey, prevKey] = entry;

      function expectFocused(element: Element) {
        expect(element).to.have.attribute('data-highlighted');
        expect(element).to.have.attribute('tabindex', '0');
        expect(element).toHaveFocus();
      }

      it(`orientation: ${orientation}`, async () => {
        const { getAllByRole, getByRole, user } = await render(
          <Toolbar.Root orientation={orientation as Orientation}>
            <Toolbar.Button />
            <Toolbar.Input defaultValue="abcd" />
            <Toolbar.Button />
          </Toolbar.Root>,
        );
        const input = getByRole('textbox');
        const [button1, button2] = getAllByRole('button');

        await user.keyboard('[Tab]');
        expectFocused(button1);

        await user.keyboard(`[${nextKey}]`);
        expectFocused(input);

        await user.keyboard(`[${ARROW_RIGHT}]`);
        await user.keyboard(`[${ARROW_RIGHT}]`);
        await user.keyboard(`[${ARROW_RIGHT}]`);
        await user.keyboard(`[${ARROW_RIGHT}]`);
        await user.keyboard(`[${nextKey}]`);

        expectFocused(button2);

        await user.keyboard(`[${prevKey}]`);
        expectFocused(input);

        await user.keyboard(`[${ARROW_LEFT}]`);
        await user.keyboard(`[${ARROW_LEFT}]`);
        await user.keyboard(`[${ARROW_LEFT}]`);
        await user.keyboard(`[${ARROW_LEFT}]`);
        await user.keyboard(`[${prevKey}]`);

        expectFocused(button1);
      });
    });
  });

  describe('rendering NumberField', () => {
    it('renders NumberField.Input', async () => {
      await render(
        <Toolbar.Root>
          <NumberField.Root>
            <NumberField.Group>
              <Toolbar.Input render={<NumberField.Input />} />
            </NumberField.Group>
          </NumberField.Root>
        </Toolbar.Root>,
      );

      expect(screen.getByRole('textbox')).to.have.attribute('aria-roledescription', 'Number field');
    });

    it('handles interactions', async () => {
      const onValueChange = spy();
      const { user } = await render(
        <Toolbar.Root>
          <NumberField.Root min={1} max={10} defaultValue={5} onValueChange={onValueChange}>
            <NumberField.Group>
              <NumberField.Decrement />
              <Toolbar.Input render={<NumberField.Input />} />
              <NumberField.Increment />
            </NumberField.Group>
          </NumberField.Root>
        </Toolbar.Root>,
      );

      const input = screen.getByRole('textbox');

      await user.keyboard('[Tab]');
      expect(input).to.have.attribute('data-highlighted');
      expect(input).to.have.attribute('tabindex', '0');
      expect(input).toHaveFocus();

      await user.keyboard(`[${ARROW_UP}]`);
      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.args[0][0]).to.equal(6);

      await user.keyboard(`[${ARROW_DOWN}]`);
      expect(onValueChange.callCount).to.equal(2);
      expect(onValueChange.args[1][0]).to.equal(5);
    });

    it('disabled state', async () => {
      const onValueChange = spy();
      const { user } = await render(
        <Toolbar.Root>
          <NumberField.Root min={1} max={10} defaultValue={5} onValueChange={onValueChange}>
            <NumberField.Group>
              <NumberField.Decrement />
              <Toolbar.Input disabled render={<NumberField.Input />} />
              <NumberField.Increment />
            </NumberField.Group>
          </NumberField.Root>
        </Toolbar.Root>,
      );

      const input = screen.getByRole('textbox');

      expect(input).to.not.have.attribute('disabled');
      expect(input).to.have.attribute('data-disabled');
      expect(input).to.have.attribute('aria-disabled', 'true');

      await user.keyboard('[Tab]');
      expect(input).to.have.attribute('data-highlighted');
      expect(input).to.have.attribute('tabindex', '0');
      expect(input).toHaveFocus();

      await user.keyboard(`[${ARROW_UP}]`);
      await user.keyboard(`[${ARROW_DOWN}]`);
      expect(onValueChange.callCount).to.equal(0);
    });
  });
});
