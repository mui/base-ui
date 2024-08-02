import * as React from 'react';
import * as Menu from '@base_ui/react/Menu';
import { MenuRootContext } from '@base_ui/react/Menu';
import { FloatingRootContext, FloatingTree } from '@floating-ui/react';
import { createRenderer, describeConformance } from '../../../test';
import { MenuPositionerContext } from '../Positioner/MenuPositionerContext';

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
  clickAndDragEnabled: false,
  setClickAndDragEnabled: () => {},
  popupRef: { current: null },
  mounted: true,
  transitionStatus: undefined,
};

const testPositionerContext: MenuPositionerContext = {
  side: 'bottom',
  alignment: 'start',
  arrowRef: { current: null },
  arrowStyles: {},
  arrowUncentered: false,
};

describe('<Menu.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Popup />, () => ({
    inheritComponent: 'div',
    render: (node) => {
      return render(
        <FloatingTree>
          <MenuRootContext.Provider value={testRootContext}>
            <MenuPositionerContext.Provider value={testPositionerContext}>
              {node}
            </MenuPositionerContext.Provider>
          </MenuRootContext.Provider>
          ,
        </FloatingTree>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
