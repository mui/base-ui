import * as React from 'react';
import { createMount, createRenderer } from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';
import { MenuPopupContext } from '@base_ui/react/Menu';
import { describeConformance } from '../../../test';

const dummyGetItemState = () => ({
  disabled: false,
  highlighted: false,
  selected: false,
  index: 0,
  focusable: true,
});

const testContext = {
  getItemState: dummyGetItemState,
  registerItem: () => ({ id: '', deregister: () => {} }),
};

describe('<Menu.Item />', () => {
  const mount = createMount();
  const { render } = createRenderer();

  describeConformance(<Menu.Item />, () => ({
    inheritComponent: 'li',
    render: (node) => {
      return render(
        <MenuPopupContext.Provider value={testContext}>{node}</MenuPopupContext.Provider>,
      );
    },
    mount: (node: React.ReactNode) => {
      const wrapper = mount(
        <MenuPopupContext.Provider value={testContext}>{node}</MenuPopupContext.Provider>,
      );
      return wrapper.childAt(0);
    },
    refInstanceof: window.HTMLLIElement,
    testComponentPropWith: 'span',
    skip: [
      'reactTestRenderer', // Need to be wrapped in MenuContext
    ],
  }));
});
