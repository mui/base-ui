import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tooltip.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Tooltip.Root open>{node}</Tooltip.Root>);
    },
  }));
});
