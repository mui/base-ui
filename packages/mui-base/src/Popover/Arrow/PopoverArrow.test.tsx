import * as React from 'react';
import * as Popover from '@base_ui/react/Popover';
import { describeConformance } from '../../../test/describeConformance';
import { createRenderer } from '../../../test';

describe('<Popover.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Arrow />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Popover.Root open>
          <Popover.Positioner>
            <Popover.Popup>{node}</Popover.Popup>
          </Popover.Positioner>
        </Popover.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));
});
