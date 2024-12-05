import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Menu.SubmenuTrigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.SubmenuTrigger />, () => ({
    render(node) {
      return render(
        <Menu.Root open animated={false}>
          <Menu.Trigger>Trigger</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Root>{node}</Menu.Root>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
