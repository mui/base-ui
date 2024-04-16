import * as React from 'react';
import { expect } from 'chai';
import { act, createRenderer } from '@mui/internal-test-utils';
import * as Tabs from '@base_ui/react/Tabs';
import { TabsContext } from '@base_ui/react/useTabs';
import { describeConformance } from '../../../test/describeConformance';

describe('<Tabs.List />', () => {
  const { render } = createRenderer();

  describeConformance(<Tabs.List />, () => ({
    inheritComponent: 'div',
    render: (node) => {
      const { container, ...other } = render(
        <TabsContext.Provider
          value={{
            value: '1',
            onSelected: () => {},
            registerTabIdLookup() {},
            getTabId: () => '',
            getTabPanelId: () => '',
            orientation: 'horizontal',
            direction: 'ltr',
          }}
        >
          {node}
        </TabsContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLDivElement,
    skip: [
      'reactTestRenderer', // Need to be wrapped with TabsContext
    ],
  }));

  describe('accessibility attributes', () => {
    it('sets the aria-selected attribute on the selected tab', () => {
      const { getByText } = render(
        <Tabs.Root defaultValue={1}>
          <Tabs.List>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
            <Tabs.Tab value={3}>Tab 3</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>,
      );

      const tab1 = getByText('Tab 1');
      const tab2 = getByText('Tab 2');
      const tab3 = getByText('Tab 3');

      expect(tab1).to.have.attribute('aria-selected', 'true');
      expect(tab2).to.have.attribute('aria-selected', 'false');
      expect(tab3).to.have.attribute('aria-selected', 'false');

      act(() => {
        tab2.click();
      });

      expect(tab1).to.have.attribute('aria-selected', 'false');
      expect(tab2).to.have.attribute('aria-selected', 'true');
      expect(tab3).to.have.attribute('aria-selected', 'false');

      act(() => {
        tab3.click();
      });

      expect(tab1).to.have.attribute('aria-selected', 'false');
      expect(tab2).to.have.attribute('aria-selected', 'false');
      expect(tab3).to.have.attribute('aria-selected', 'true');

      act(() => {
        tab1.click();
      });

      expect(tab1).to.have.attribute('aria-selected', 'true');
      expect(tab2).to.have.attribute('aria-selected', 'false');
      expect(tab3).to.have.attribute('aria-selected', 'false');
    });
  });

  it('can be named via `aria-label`', () => {
    const { getByRole } = render(
      <Tabs.Root defaultValue={0}>
        <Tabs.List aria-label="string label">
          <Tabs.Tab value={0} />
        </Tabs.List>
      </Tabs.Root>,
    );

    expect(getByRole('tablist')).toHaveAccessibleName('string label');
  });

  it('can be named via `aria-labelledby`', () => {
    const { getByRole } = render(
      <React.Fragment>
        <h3 id="label-id">complex name</h3>
        <Tabs.Root defaultValue={0}>
          <Tabs.List aria-labelledby="label-id">
            <Tabs.Tab value={0} />
          </Tabs.List>
        </Tabs.Root>
      </React.Fragment>,
    );

    expect(getByRole('tablist')).toHaveAccessibleName('complex name');
  });
});
