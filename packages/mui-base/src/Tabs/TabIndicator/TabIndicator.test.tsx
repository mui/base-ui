import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Tabs, TabsContext, TabsContextValue } from '@mui/base/Tabs';
import { TabsListProvider, TabsListProviderValue } from '@mui/base/useTabsList';
import { describeConformance } from '../../../test/describeConformance';

describe('<Tabs.Indicator />', () => {
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
    getTabElement: () => null,
    tabsListRef: {
      current: null,
    },
  };

  const testTabsContext: TabsContextValue = {
    value: 0,
    onSelected() {},
    registerTabIdLookup() {},
    getTabId: () => '',
    getTabPanelId: () => '',
    orientation: 'horizontal',
    direction: 'ltr',
  };

  describeConformance(<Tabs.Indicator />, () => ({
    inheritComponent: 'span',
    render: (node) => {
      const { container, ...other } = render(
        <TabsContext.Provider value={testTabsContext}>
          <TabsListProvider value={testTabsListContext}>{node}</TabsListProvider>
        </TabsContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLSpanElement,
    skip: [
      'reactTestRenderer', // Need to be wrapped with TabsContext
    ],
  }));
});
