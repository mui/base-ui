import * as React from 'react';
import { Tabs } from '@base-ui-components/react/Tabs';
import { createRenderer, describeConformance } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { CompositeRootContext } from '../../Composite/Root/CompositeRootContext';
import { TabsRootContext } from '../Root/TabsRootContext';
import { TabsListContext } from '../TabsList/TabsListContext';

describe('<Tabs.Tab />', () => {
  const { render } = createRenderer();

  const testCompositeContext = {
    activeIndex: 0,
    onActiveIndexChange: NOOP,
  };

  const testTabsListContext: TabsListContext = {
    activateOnFocus: true,
    getTabElement: () => null,
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
    getTabIdByPanelValueOrIndex: () => '',
    getTabPanelIdByTabValueOrIndex: () => '',
    orientation: 'horizontal',
    direction: 'ltr',
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
