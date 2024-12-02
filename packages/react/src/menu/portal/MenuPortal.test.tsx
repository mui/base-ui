import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Menu.Portal />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Portal />, () => ({
    refInstanceof: null,
    render(node) {
      return render(
        <Menu.Root open animated={false}>
          {node}
        </Menu.Root>,
      );
    },
  }));
});
