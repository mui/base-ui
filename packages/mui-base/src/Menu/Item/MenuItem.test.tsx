import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';
import {
  MenuPopupContext,
  MenuPopupContextValue,
  MenuRootContext,
  MenuRootContextValue,
} from '@base_ui/react/Menu';
import { describeConformance } from '../../../test';
import { IndexableMap } from '../../utils/IndexableMap';

const dummyGetItemState = () => ({
  disabled: false,
  highlighted: false,
  selected: false,
  index: 0,
  focusable: true,
});

const testRootContext: MenuRootContextValue = {
  dispatch: () => {},
  popupId: '',
  triggerElement: null,
  registerPopup: () => {},
  registerTrigger: () => {},
  state: {
    items: new IndexableMap(),
    highlightedValue: null,
    selectedValues: [],
    open: true,
    listboxRef: { current: null },
    changeReason: null,
    settings: {
      disabledItemsFocusable: false,
      disableListWrap: false,
      focusManagement: 'DOM',
      orientation: 'horizontal-ltr',
      pageSize: 1,
      selectionMode: 'none',
    },
  },
};

const testPopupContext: MenuPopupContextValue = {
  getItemState: dummyGetItemState,
  registerItem: () => ({ id: '', deregister: () => {} }),
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
    skip: [
      'reactTestRenderer', // Need to be wrapped in MenuContext
    ],
  }));
});
