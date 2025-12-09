import { expect } from 'chai';
import { Toolbar } from '@base-ui/react/toolbar';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { ToolbarRootContext } from '../root/ToolbarRootContext';
import { CompositeRootContext } from '../../composite/root/CompositeRootContext';

const testCompositeContext: CompositeRootContext = {
  highlightedIndex: 0,
  onHighlightedIndexChange: NOOP,
  highlightItemOnHover: false,
  relayKeyboardEvent: NOOP,
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
    testRenderPropWith: 'a',
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
      await render(
        <Toolbar.Root>
          <Toolbar.Link data-testid="link" href="https://base-ui.com" />
        </Toolbar.Root>,
      );

      expect(screen.getByTestId('link')).to.equal(screen.getByRole('link'));
    });
  });
});
