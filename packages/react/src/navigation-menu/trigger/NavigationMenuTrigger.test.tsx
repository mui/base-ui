import * as React from 'react';
import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NavigationMenu.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item>{node}</NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>,
      );
    },
  }));
});
