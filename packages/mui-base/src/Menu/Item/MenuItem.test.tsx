import * as React from 'react';
import { FloatingRootContext } from '@floating-ui/react';
import * as Menu from '@base_ui/react/Menu';
import { MenuRootContext } from '@base_ui/react/Menu';
import { describeConformance, createRenderer } from '../../../test';

const testRootContext: MenuRootContext = {
  floatingRootContext: {} as FloatingRootContext,
  getPositionerProps: (p) => ({ ...p }),
  getTriggerProps: (p) => ({ ...p }),
  getItemProps: (p) => ({ ...p }),
  parentContext: null,
  nested: false,
  triggerElement: null,
  setTriggerElement: () => {},
  setPositionerElement: () => {},
  activeIndex: null,
  disabled: false,
  itemDomElements: { current: [] },
  itemLabels: { current: [] },
  open: true,
  setOpen: () => {},
};

describe('<Menu.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Item />, () => ({
    render: (node) => {
      return render(
        <MenuRootContext.Provider value={testRootContext}>{node}</MenuRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
