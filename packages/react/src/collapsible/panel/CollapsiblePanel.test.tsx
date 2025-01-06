import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, fireEvent, flushMicrotasks } from '@mui/internal-test-utils';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { createRenderer, describeConformance } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { CollapsibleRootContext } from '../root/CollapsibleRootContext';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

const PANEL_CONTENT = 'This is panel content';

const contextValue: CollapsibleRootContext = {
  panelId: 'PanelId',
  disabled: false,
  mounted: true,
  open: true,
  setPanelId: NOOP,
  setMounted: NOOP,
  setOpen: NOOP,
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
          <Collapsible.Root open={open} onOpenChange={setOpen}>
            <Collapsible.Trigger />
            <Collapsible.Panel keepMounted>{PANEL_CONTENT}</Collapsible.Panel>
          </Collapsible.Root>
        );
      }

      const { queryByText, getByRole } = await render(<App />);

      const trigger = getByRole('button');

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(trigger.getAttribute('aria-controls')).to.equal(
        queryByText(PANEL_CONTENT)?.getAttribute('id'),
      );
      expect(queryByText(PANEL_CONTENT)).to.not.equal(null);
      expect(queryByText(PANEL_CONTENT)).not.toBeVisible();
      expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-closed');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).to.have.attribute('aria-expanded', 'true');

      expect(queryByText(PANEL_CONTENT)).toBeVisible();
      expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-open');
      expect(trigger).to.have.attribute('data-panel-open');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).to.have.attribute('aria-expanded', 'false');
      expect(trigger.getAttribute('aria-controls')).to.equal(
        queryByText(PANEL_CONTENT)?.getAttribute('id'),
      );
      expect(queryByText(PANEL_CONTENT)).not.toBeVisible();
      expect(queryByText(PANEL_CONTENT)).to.have.attribute('data-closed');
    });
  });

  // we test firefox in browserstack which does not support this yet
  describe.skipIf(!('onbeforematch' in window) || isJSDOM)('prop: hiddenUntilFound', () => {
    it('uses `hidden="until-found" to hide panel when true', async function test() {
      const handleOpenChange = spy();

      const { queryByText } = await render(
        <Collapsible.Root defaultOpen={false} onOpenChange={handleOpenChange}>
          <Collapsible.Trigger />
          <Collapsible.Panel hiddenUntilFound keepMounted>
            {PANEL_CONTENT}
          </Collapsible.Panel>
        </Collapsible.Root>,
      );

      const panel = queryByText(PANEL_CONTENT);

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
