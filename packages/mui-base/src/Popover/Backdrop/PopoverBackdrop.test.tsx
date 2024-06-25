import * as React from 'react';
import * as Popover from '@base_ui/react/Popover';
import { describeConformance } from '../../../test/describeConformance';
import { createRenderer } from '../../../test';

describe('<Popover.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Backdrop />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Popover.Root open animated={false}>
          {node}
        </Popover.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));
});
