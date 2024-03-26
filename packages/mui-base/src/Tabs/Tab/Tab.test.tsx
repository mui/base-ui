import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Tabs, TabsContext } from '@base_ui/react/Tabs';
import { TabsListProvider, TabsListProviderValue } from '@base_ui/react/useTabsList';
import { describeConformance } from '../../../test/describeConformance';

describe('<Tabs.Tab />', () => {
  const { render } = createRenderer();

  const testTabsListContext: TabsListProviderValue = {
    dispatch: () => {},
    registerItem: () => ({ id: 0, deregister: () => {} }),
    getItemIndex: () => 0,
    totalSubitemCount: 1,
    getItemState() {
      return { disabled: false, highlighted: false, selected: false, focusable: true, index: 0 };
    },
    activateOnFocus: true,
  };

  describeConformance(<Tabs.Tab value="1" />, () => ({
    inheritComponent: 'div',
    render: (node) => {
      const { container, ...other } = render(
        <TabsContext.Provider
          value={{
            value: 0,
            onSelected() {},
            registerTabIdLookup() {},
            getTabId: () => '',
            getTabPanelId: () => '',
          }}
        >
          <TabsListProvider value={testTabsListContext}>{node}</TabsListProvider>
        </TabsContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLButtonElement,
    skip: [
      'reactTestRenderer', // Need to be wrapped with TabsContext
    ],
  }));
});
