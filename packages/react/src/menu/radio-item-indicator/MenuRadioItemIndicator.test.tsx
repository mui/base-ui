import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Menu.RadioItemIndicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.RadioItemIndicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Menu.Root open animated={false}>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.RadioGroup>
                <Menu.RadioItem value="">{node}</Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );
    },
  }));
});
