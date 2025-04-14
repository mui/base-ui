import * as React from 'react';
import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NavigationMenu.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.Popup />, () => ({
    refInstanceof: window.HTMLElement,
    render(node) {
      return render(
        <NavigationMenu.Root open>
          <NavigationMenu.Portal>
            <NavigationMenu.Positioner>{node}</NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu.Root>,
      );
    },
  }));
});
