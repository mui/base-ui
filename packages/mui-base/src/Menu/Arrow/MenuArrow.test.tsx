import * as React from 'react';
import * as Menu from '@base_ui/react/Menu';
import { createRenderer, describeConformance } from '../../../test';

describe('<Menu.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Arrow />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Menu.Root open animated={false}>
          <Menu.Positioner>
            <Menu.Popup>{node}</Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );
    },
  }));
});
