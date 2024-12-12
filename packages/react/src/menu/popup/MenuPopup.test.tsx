import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Menu.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Popup />, () => ({
    render: (node) => {
      return render(
        <Menu.Root open>
          <Menu.Positioner>{node}</Menu.Positioner>
        </Menu.Root>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
