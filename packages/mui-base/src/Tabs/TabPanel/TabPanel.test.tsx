import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Tabs } from '@mui/base/Tabs';
import { TabsProvider, TabsProviderValue } from '@mui/base/useTabs';
import { describeConformance } from '../../../test/describeConformance';

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
  };

  describeConformance(<Tabs.Panel value="1" />, () => ({
    inheritComponent: 'div',
    render: (node) => {
      const { container, ...other } = render(
        <TabsProvider value={tabsProviderDefaultValue}>{node}</TabsProvider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLDivElement,
    skip: [
      'reactTestRenderer', // Need to be wrapped with TabsContext
    ],
  }));
});
