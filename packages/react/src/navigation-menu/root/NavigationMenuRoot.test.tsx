import * as React from 'react';
import { NavigationMenu } from '@base-ui-components/react/navigation-menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<NavigationMenu.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<NavigationMenu.Root />, () => ({
    refInstanceof: window.HTMLElement,
    render(node) {
      return render(node);
    },
  }));
});
