import * as React from 'react';
import { Menu } from '@base-ui-components/react/Menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Menu.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Menu.Root open animated={false}>
          {node}
        </Menu.Root>,
      );
    },
  }));
});
