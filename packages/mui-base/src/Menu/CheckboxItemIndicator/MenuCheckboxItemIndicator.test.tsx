import * as React from 'react';
import { Menu } from '@base-ui-components/react/Menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Menu.CheckboxItemIndicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.CheckboxItemIndicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Menu.Root open animated={false}>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.CheckboxItem>{node}</Menu.CheckboxItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );
    },
  }));
});
