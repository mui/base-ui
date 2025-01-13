import * as React from 'react';
import { expect } from 'chai';
// import { spy } from 'sinon';
// import { act } from '@mui/internal-test-utils';
import { Toolbar } from '@base-ui-components/react/toolbar';
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
});
