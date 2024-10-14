import * as React from 'react';
import { Menu } from '@base_ui/react/Menu';
import { createRenderer, describeConformance } from '#test-utils';
import { MenuGroupContext } from '../Group/MenuGroupContext';

const testContext: MenuGroupContext = {
  setLabelId: () => {},
};

describe('<Menu.GroupLabel />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.GroupLabel />, () => ({
    render: (node) => {
      return render(
        <MenuGroupContext.Provider value={testContext}>{node}</MenuGroupContext.Provider>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
