import * as React from 'react';
import { createMount, createRenderer } from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';
import { MenuPopupProvider } from '@base_ui/react/Menu';
import { describeConformance } from '../../../test';

const dummyGetItemState = () => ({
  disabled: false,
  highlighted: false,
  selected: false,
  index: 0,
  focusable: true,
});

const testContext = {
  dispatch: () => {},
  getItemIndex: () => 0,
  getItemProps: () => ({}),
  getItemState: dummyGetItemState,
  open: false,
  registerItem: () => ({ id: '', deregister: () => {} }),
  totalSubitemCount: 0,
};

describe('<Menu.Item />', () => {
  const mount = createMount();
  const { render } = createRenderer();

  describeConformance(<Menu.Item />, () => ({
    inheritComponent: 'li',
    render: (node) => {
      return render(<MenuPopupProvider value={testContext}>{node}</MenuPopupProvider>);
    },
    mount: (node: React.ReactNode) => {
      const wrapper = mount(<MenuPopupProvider value={testContext}>{node}</MenuPopupProvider>);
      return wrapper.childAt(0);
    },
    refInstanceof: window.HTMLLIElement,
    testComponentPropWith: 'span',
    skip: [
      'reactTestRenderer', // Need to be wrapped in MenuContext
    ],
  }));
});
