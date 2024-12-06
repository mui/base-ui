import * as React from 'react';
import { Tabs } from '@base-ui-components/react/tabs';
import { createRenderer, describeConformance } from '#test-utils';
import { TabsRootContext } from '../root/TabsRootContext';

describe('<Tabs.Panel />', () => {
  const { render } = createRenderer();

  const tabsContextDefaultValue: TabsRootContext = {
    value: '1',
    onValueChange: () => {},
    setTabMap() {},
    getTabElementBySelectedValue: () => null,
    getTabIdByPanelValueOrIndex: () => '',
    getTabPanelIdByTabValueOrIndex: () => '',
    direction: 'ltr',
    orientation: 'horizontal',
    tabActivationDirection: 'none',
  };

  describeConformance(<Tabs.Panel value="1" />, () => ({
    render: (node) => {
      return render(
        <TabsRootContext.Provider value={tabsContextDefaultValue}>{node}</TabsRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
