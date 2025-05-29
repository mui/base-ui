import * as React from 'react';
import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NavigationMenu.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<NavigationMenu.Root>{node}</NavigationMenu.Root>);
    },
  }));
});
