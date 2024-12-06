import * as React from 'react';
import { expect } from 'chai';
import { act } from '@mui/internal-test-utils';
import { Tabs } from '@base-ui-components/react/tabs';
import { createRenderer, describeConformance } from '#test-utils';
import { TabsRootContext } from '../root/TabsRootContext';

describe('<Tabs.List />', () => {
  const { render } = createRenderer();

  describeConformance(<Tabs.List />, () => ({
    render: (node) => {
      return render(
        <TabsRootContext.Provider
          value={{
            value: '1',
            onValueChange: () => {},
            setTabMap() {},
            getTabElementBySelectedValue: () => null,
            getTabIdByPanelValueOrIndex: () => '',
            getTabPanelIdByTabValueOrIndex: () => '',
            direction: 'ltr',
            orientation: 'horizontal',
            tabActivationDirection: 'none',
          }}
        >
          {node}
        </TabsRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  describe('accessibility attributes', () => {
    it('sets the aria-selected attribute on the selected tab', async () => {
      const { getByText } = await render(
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

      await act(async () => {
        tab2.click();
      });

      expect(tab1).to.have.attribute('aria-selected', 'false');
      expect(tab2).to.have.attribute('aria-selected', 'true');
      expect(tab3).to.have.attribute('aria-selected', 'false');

      await act(async () => {
        tab3.click();
      });

      expect(tab1).to.have.attribute('aria-selected', 'false');
      expect(tab2).to.have.attribute('aria-selected', 'false');
      expect(tab3).to.have.attribute('aria-selected', 'true');

      await act(async () => {
        tab1.click();
      });

      expect(tab1).to.have.attribute('aria-selected', 'true');
      expect(tab2).to.have.attribute('aria-selected', 'false');
      expect(tab3).to.have.attribute('aria-selected', 'false');
    });
  });

  it('can be named via `aria-label`', async () => {
    const { getByRole } = await render(
      <Tabs.Root defaultValue={0}>
        <Tabs.List aria-label="string label">
          <Tabs.Tab value={0} />
        </Tabs.List>
      </Tabs.Root>,
    );

    expect(getByRole('tablist')).toHaveAccessibleName('string label');
  });

  it('can be named via `aria-labelledby`', async () => {
    const { getByRole } = await render(
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
