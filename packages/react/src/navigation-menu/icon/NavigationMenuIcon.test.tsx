import * as React from 'react';
import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NavigationMenu.Icon />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.Icon />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<NavigationMenu.Root>{node}</NavigationMenu.Root>);
    },
  }));
});
