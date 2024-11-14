import * as React from 'react';
import { Tabs } from '@base-ui-components/react/Tabs';
import { createRenderer, describeConformance } from '#test-utils';
import { CompoundComponentContext } from '../../useCompound';
import { TabsRootContext } from '../Root/TabsRootContext';

describe('<Tabs.Panel />', () => {
  const { render } = createRenderer();

  const compoundContextValue = {
    getItemIndex: () => 0,
    registerItem: () => ({ id: 0, deregister: () => {} }),
    totalSubitemCount: 1,
  };

  const tabsContextDefaultValue: TabsRootContext = {
    value: '1',
    onValueChange: () => {},
    setTabMap() {},
    getTabIdByPanelValueOrIndex: () => '',
    getTabPanelIdByTabValueOrIndex: () => '',
    direction: 'ltr',
    orientation: 'horizontal',
    tabActivationDirection: 'none',
  };

  describeConformance(<Tabs.Panel value="1" />, () => ({
    render: (node) => {
      return render(
        <CompoundComponentContext.Provider value={compoundContextValue}>
          <TabsRootContext.Provider value={tabsContextDefaultValue}>
            {node}
          </TabsRootContext.Provider>
        </CompoundComponentContext.Provider>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
