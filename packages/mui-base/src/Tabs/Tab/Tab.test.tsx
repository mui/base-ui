import * as React from 'react';
import { Tabs } from '@base-ui-components/react/Tabs';
import { createRenderer, describeConformance } from '#test-utils';
import { TabsListProviderValue, TabsListProvider } from '../TabsList/TabsListProvider';
import { TabsRootContext } from '../Root/TabsRootContext';

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
    getTabElement: () => null,
    tabsListRef: {
      current: null,
    },
  };

  const testTabsContext: TabsRootContext = {
    value: 0,
    onSelected() {},
    registerTabIdLookup() {},
    getTabId: () => '',
    getTabPanelId: () => '',
    orientation: 'horizontal',
    direction: 'ltr',
    tabActivationDirection: 'none',
  };

  describeConformance(<Tabs.Tab value="1" />, () => ({
    render: (node) => {
      return render(
        <TabsRootContext.Provider value={testTabsContext}>
          <TabsListProvider value={testTabsListContext}>{node}</TabsListProvider>
        </TabsRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLButtonElement,
  }));
});
