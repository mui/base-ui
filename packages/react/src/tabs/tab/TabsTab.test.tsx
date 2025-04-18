import * as React from 'react';
import { Tabs } from '@base-ui-components/react/tabs';
import { createRenderer, describeConformance } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { CompositeRootContext } from '../../composite/root/CompositeRootContext';
import { TabsRootContext } from '../root/TabsRootContext';
import { TabsListContext } from '../list/TabsListContext';

describe('<Tabs.Tab />', () => {
  const { render } = createRenderer();

  const testCompositeContext: CompositeRootContext = {
    highlightedIndex: 0,
    onHighlightedIndexChange: NOOP,
    highlightItemOnHover: false,
  };

  const testTabsListContext: TabsListContext = {
    activateOnFocus: true,
    highlightedTabIndex: 0,
    onTabActivation: NOOP,
    setHighlightedTabIndex: NOOP,
    tabsListRef: {
      current: null,
    },
  };

  const testTabsContext: TabsRootContext = {
    value: 0,
    onValueChange() {},
    setTabMap() {},
    getTabElementBySelectedValue: () => null,
    getTabIdByPanelValueOrIndex: () => '',
    getTabPanelIdByTabValueOrIndex: () => '',
    direction: 'ltr',
    orientation: 'horizontal',
    tabActivationDirection: 'none',
  };

  describeConformance(<Tabs.Tab value="1" />, () => ({
    render: (node) => {
      return render(
        <TabsRootContext.Provider value={testTabsContext}>
          <TabsListContext.Provider value={testTabsListContext}>
            <CompositeRootContext.Provider value={testCompositeContext}>
              {node}
            </CompositeRootContext.Provider>
          </TabsListContext.Provider>
        </TabsRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLButtonElement,
  }));
});
