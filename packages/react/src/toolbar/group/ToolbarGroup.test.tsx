import * as React from 'react';
import { expect } from 'chai';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { ToolbarRootContext } from '../root/ToolbarRootContext';
import { CompositeRootContext } from '../../composite/root/CompositeRootContext';

const testCompositeContext: CompositeRootContext = {
  highlightedIndex: 0,
  onHighlightedIndexChange: NOOP,
  highlightItemOnHover: false,
};

const testToolbarContext: ToolbarRootContext = {
  disabled: false,
  orientation: 'horizontal',
  setItemMap: NOOP,
};

describe('<Toolbar.Group />', () => {
  const { render } = createRenderer();

  describeConformance(<Toolbar.Group />, () => ({
    refInstanceof: window.HTMLDivElement,
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
    it('renders a group', async () => {
      const { getByTestId } = await render(
        <Toolbar.Root>
          <Toolbar.Group data-testid="group" />
        </Toolbar.Root>,
      );

      expect(getByTestId('group')).to.equal(screen.getByRole('group'));
    });
  });

  describe('prop: disabled', () => {
    it('disables all toolbar items except links in the group', async () => {
      const { getByRole, getByText } = await render(
        <Toolbar.Root>
          <Toolbar.Group disabled>
            <Toolbar.Button />
            <Toolbar.Link href="https://base-ui.com">Link</Toolbar.Link>
            <Toolbar.Input defaultValue="" />
          </Toolbar.Group>
        </Toolbar.Root>,
      );

      [getByRole('button'), getByRole('textbox')].forEach((toolbarItem) => {
        expect(toolbarItem).to.have.attribute('aria-disabled', 'true');
        expect(toolbarItem).to.have.attribute('data-disabled');
      });

      expect(getByText('Link')).to.not.have.attribute('data-disabled');
      expect(getByText('Link')).to.not.have.attribute('aria-disabled');
    });
  });
});
