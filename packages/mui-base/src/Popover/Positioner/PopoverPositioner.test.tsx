import * as React from 'react';
import * as Popover from '@base_ui/react/Popover';
import { createRenderer } from '../../../test';
import { describeConformance } from '../../../test/describeConformance';

describe('<Popover.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Popover.Root open animated={false}>
          {node}
        </Popover.Root>,
      );
    },
  }));
});
