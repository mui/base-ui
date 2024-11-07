import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import {
  act,
  createRenderer,
  describeSkipIf,
  fireEvent,
  flushMicrotasks,
} from '@mui/internal-test-utils';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { describeConformance } from '../../../test/describeConformance';
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
    inheritComponent: 'div',
    render: (node) => {
      const { container, ...other } = render(
        <CollapsibleRootContext.Provider value={contextValue}>
          {node}
        </CollapsibleRootContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLDivElement,
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
          <Collapsible.Panel hiddenUntilFound>This is panel content</Collapsible.Panel>
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

    // toWarnDev doesn't work reliably with async rendering. To re-enable after it's fixed in the test-utils.
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('warns when setting both `hiddenUntilFound` and `keepMounted={false}`', async function test() {
      await expect(() =>
        render(
          <Collapsible.Root animated={false}>
            <Collapsible.Trigger />
            <Collapsible.Panel hiddenUntilFound keepMounted={false}>
              This is panel content
            </Collapsible.Panel>
          </Collapsible.Root>,
        ),
      ).toWarnDev([
        'Base UI: The `keepMounted={false}` prop on a Collapsible will be ignored when using `hiddenUntilFound` since it requires the Panel to remain mounted even when closed.',
        'Base UI: The `keepMounted={false}` prop on a Collapsible will be ignored when using `hiddenUntilFound` since it requires the Panel to remain mounted even when closed.',
      ]);
    });
  });
});
