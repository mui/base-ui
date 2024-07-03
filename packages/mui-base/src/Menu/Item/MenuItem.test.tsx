import * as React from 'react';
import { FloatingRootContext } from '@floating-ui/react';
import * as Menu from '@base_ui/react/Menu';
import { MenuPopupContext, MenuPopupContextValue, MenuRootContext } from '@base_ui/react/Menu';
import { describeConformance, createRenderer } from '../../../test';
import { IndexableMap } from '../../utils/IndexableMap';

const testRootContext: MenuRootContext = {
  dispatch: () => {},
  state: {
    items: new IndexableMap(),
    highlightedValue: null,
    selectedValues: [],
    open: true,
    popupId: '',
    triggerElement: null,
    positionerElement: null,
    hasNestedMenuOpen: false,
    clickAndDragging: false,
    settings: {
      disabledItemsFocusable: false,
      disableListWrap: false,
      focusManagement: 'DOM',
      orientation: 'horizontal',
      direction: 'ltr',
      pageSize: 1,
      selectionMode: 'none',
    },
  },
  floatingRootContext: {} as FloatingRootContext,
  getPositionerProps: (p) => ({ ...p }),
  getTriggerProps: (p) => ({ ...p }),
  getItemProps: (p) => ({ ...p }),
  parentContext: null,
  topmostContext: null,
  isNested: false,
};

const testPopupContext: MenuPopupContextValue = {
  compoundParentContext: {
    registerItem: () => ({ deregister: () => {}, index: 0 }),
    getRegisteredItemCount: () => 0,
  },
};

describe('<Menu.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Item />, () => ({
    render: (node) => {
      return render(
        <MenuRootContext.Provider value={testRootContext}>
          <MenuPopupContext.Provider value={testPopupContext}>{node}</MenuPopupContext.Provider>
        </MenuRootContext.Provider>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
