import * as React from 'react';
import { Popover } from '@base_ui/react/Popover';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Popover.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <Popover.Root open animated={false}>
          {node}
        </Popover.Root>,
      );
    },
  }));
});
