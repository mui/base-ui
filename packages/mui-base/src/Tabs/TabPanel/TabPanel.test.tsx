import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Tabs from '@base_ui/react/Tabs';
import { TabsContext, TabsContextValue } from '@base_ui/react/Tabs';
import { describeConformance } from '../../../test/describeConformance';

describe('<Tabs.Panel />', () => {
  const { render } = createRenderer();

  const tabsProviderDefaultValue: TabsContextValue = {
    value: '1',
    onSelected: () => {},
    registerTabIdLookup() {},
    getTabId: () => '',
    getTabPanelId: () => '',
    direction: 'ltr',
    orientation: 'horizontal',
    tabActivationDirection: 'none',
    compoundParentContext: {
      registerItem: () => ({ deregister: () => {}, index: 0 }),
      getRegisteredItemCount: () => 0,
    },
  };

  describeConformance(<Tabs.Panel value="1" />, () => ({
    inheritComponent: 'div',
    render: (node) => {
      const { container, ...other } = render(
        <TabsContext.Provider value={tabsProviderDefaultValue}>{node}</TabsContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
