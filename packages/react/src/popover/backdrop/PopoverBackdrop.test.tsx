import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Popover.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Backdrop />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Popover.Root open>{node}</Popover.Root>);
    },
  }));
});
