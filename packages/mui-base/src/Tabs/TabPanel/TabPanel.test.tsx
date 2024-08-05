import * as React from 'react';
import * as Tabs from '@base_ui/react/Tabs';
import { TabsProvider, TabsProviderValue } from '@base_ui/react/Tabs';
import { createRenderer, describeConformance } from '../../../test';

describe('<Tabs.Panel />', () => {
  const { render } = createRenderer();

  const tabsProviderDefaultValue: TabsProviderValue = {
    value: '1',
    onSelected: () => {},
    registerTabIdLookup() {},
    getTabId: () => '',
    getTabPanelId: () => '',
    getItemIndex: () => 0,
    registerItem: () => ({ id: 0, deregister: () => {} }),
    totalSubitemCount: 1,
    direction: 'ltr',
    orientation: 'horizontal',
    tabActivationDirection: 'none',
  };

  describeConformance(<Tabs.Panel value="1" />, () => ({
    render: (node) => {
      return render(<TabsProvider value={tabsProviderDefaultValue}>{node}</TabsProvider>);
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
