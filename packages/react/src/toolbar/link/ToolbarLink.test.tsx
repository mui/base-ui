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

describe('<Toolbar.Link />', () => {
  const { render } = createRenderer();

  describeConformance(<Toolbar.Link />, () => ({
    refInstanceof: window.HTMLAnchorElement,
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
    it('renders an anchor', async () => {
      const { getByTestId } = await render(
        <Toolbar.Root>
          <Toolbar.Link data-testid="link" href="https://base-ui.com" />
        </Toolbar.Root>,
      );

      expect(getByTestId('link')).to.equal(screen.getByRole('link'));
    });
  });
});
