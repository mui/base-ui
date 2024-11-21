import * as React from 'react';
import { Menu } from '@base-ui-components/react/Menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Menu.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Arrow />, () => ({
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
