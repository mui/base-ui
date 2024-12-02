import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { FloatingRootContext, FloatingTree } from '@floating-ui/react';
import { createRenderer, describeConformance } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { MenuPositionerContext } from '../positioner/MenuPositionerContext';
import { MenuRootContext } from '../root/MenuRootContext';

const testRootContext: MenuRootContext = {
  floatingRootContext: {} as FloatingRootContext,
  getPositionerProps: (p) => ({ ...p }),
  getTriggerProps: (p) => ({ ...p }),
  getItemProps: (p) => ({ ...p }),
  parentContext: undefined,
  nested: false,
  setTriggerElement: NOOP,
  setPositionerElement: NOOP,
  activeIndex: null,
  disabled: false,
  itemDomElements: { current: [] },
  itemLabels: { current: [] },
  open: true,
  setOpen: NOOP,
  clickAndDragEnabled: false,
  setClickAndDragEnabled: NOOP,
  popupRef: { current: null },
  mounted: true,
  transitionStatus: undefined,
  typingRef: { current: false },
  dir: null,
  setDir: NOOP,
};

const testPositionerContext: MenuPositionerContext = {
  side: 'bottom',
  align: 'start',
  arrowRef: { current: null },
  arrowStyles: {},
  arrowUncentered: false,
};

describe('<Menu.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Popup />, () => ({
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
