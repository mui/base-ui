import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Tabs from '@base_ui/react/Tabs';
import { TabsContext, TabsContextValue } from '@base_ui/react/Tabs';
import { describeConformance } from '../../../test/describeConformance';
import { TabsListContext, TabsListContextValue } from '../TabsList/TabsListContext';
import { IndexableMap } from '../../utils/IndexableMap';

describe('<Tabs.Tab />', () => {
  const { render } = createRenderer();

  const testTabsListContext: TabsListContextValue = {
    dispatch: () => {},
    compoundParentContext: {
      registerItem: () => ({ deregister: () => {} }),
      getRegisteredItemCount: () => 0,
    },
    state: {
      highlightedValue: null,
      items: new IndexableMap(),
      selectedValues: [],
      tabsListRef: { current: null },
      settings: {
        activateOnFocus: true,
        disabledItemsFocusable: true,
        disableListWrap: false,
        focusManagement: 'DOM',
        orientation: 'horizontal',
        direction: 'ltr',
        pageSize: 1,
        selectionMode: 'single',
      },
    },
    getTabElement: () => null,
  };

  const testTabsContext: TabsContextValue = {
    value: 0,
    onSelected() {},
    registerTabIdLookup() {},
    getTabId: () => '',
    getTabPanelId: () => '',
    orientation: 'horizontal',
    direction: 'ltr',
    tabActivationDirection: 'none',
    compoundParentContext: {
      registerItem: () => ({
        deregister: () => {},
      }),
      getRegisteredItemCount: () => 0,
    },
  };

  describeConformance(<Tabs.Tab value="1" />, () => ({
    inheritComponent: 'div',
    render: (node) => {
      const { container, ...other } = render(
        <TabsContext.Provider value={testTabsContext}>
          <TabsListContext.Provider value={testTabsListContext}>{node}</TabsListContext.Provider>
        </TabsContext.Provider>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLButtonElement,
  }));
});
