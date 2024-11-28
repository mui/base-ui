import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, describeSkipIf, fireEvent, flushMicrotasks } from '@mui/internal-test-utils';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { createRenderer, describeConformance } from '#test-utils';
import { CollapsibleRootContext } from '../root/CollapsibleRootContext';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

const PANEL_CONTENT = 'This is panel content';

const contextValue: CollapsibleRootContext = {
  animated: false,
  panelId: 'PanelId',
  disabled: false,
  mounted: true,
  open: true,
  setPanelId() {},
  setMounted() {},
  setOpen() {},
  transitionStatus: undefined,
  state: {
    open: true,
    disabled: false,
    transitionStatus: undefined,
  },
};

describe('<Collapsible.Panel />', () => {
  const { render } = createRenderer();

  describeConformance(<Collapsible.Panel />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(
        <CollapsibleRootContext.Provider value={contextValue}>
          {node}
        </CollapsibleRootContext.Provider>,
      );
    },
  }));

  describe('prop: keepMounted', () => {
    it('does not unmount the panel when true', async () => {
      function App() {
        const [open, setOpen] = React.useState(false);
        return (
          <Collapsible.Root open={open} onOpenChange={setOpen} animated={false}>
            <Collapsible.Trigger />
            <Collapsible.Panel keepMounted>This is panel content</Collapsible.Panel>
          </Collapsible.Root>
        );
      }

      const { queryByText, getByRole } = await render(<App />);

      const trigger = getByRole('button');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT)).to.not.equal(null);
      expect(queryByText(PANEL_CONTENT)).not.toBeVisible();

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).to.have.attribute('aria-expanded', 'true');

      expect(queryByText(PANEL_CONTENT)).toBeVisible();
      expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(queryByText(PANEL_CONTENT)).not.toBeVisible();
    });
  });

  // we test firefox in browserstack which does not support this yet
  describeSkipIf(!('onbeforematch' in window) || isJSDOM)('prop: hiddenUntilFound', () => {
    it('uses `hidden="until-found" to hide panel when true', async function test() {
      const handleOpenChange = spy();

      const { queryByText } = await render(
        <Collapsible.Root defaultOpen={false} animated={false} onOpenChange={handleOpenChange}>
          <Collapsible.Trigger />
          <Collapsible.Panel hiddenUntilFound keepMounted>
            This is panel content
          </Collapsible.Panel>
        </Collapsible.Root>,
      );

      const panel = queryByText('This is panel content');

      act(() => {
        const event = new window.Event('beforematch', {
          bubbles: true,
          cancelable: false,
        });
        panel?.dispatchEvent(event);
      });

      expect(handleOpenChange.callCount).to.equal(1);
      expect(panel).to.have.attribute('data-open');
    });
  });
});
