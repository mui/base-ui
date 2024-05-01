import * as React from 'react';
import * as Popover from '@base_ui/react/Popover';
import { describeConformance } from '../../../test/describeConformance';
import { createRenderer } from '../../../test';

describe('<Popover.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Trigger />, () => ({
    inheritComponent: 'button',
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(<Popover.Root open>{node}</Popover.Root>);
    },
    skip: ['reactTestRenderer'],
  }));
});
