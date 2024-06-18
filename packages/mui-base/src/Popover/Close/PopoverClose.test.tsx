import * as React from 'react';
import * as Popover from '@base_ui/react/Popover';
import { createRenderer } from '../../../test';
import { describeConformance } from '../../../test/describeConformance';

describe('<Popover.Close />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Close />, () => ({
    inheritComponent: 'button',
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <Popover.Root open animated={false}>
          <Popover.Positioner>
            <Popover.Popup>{node}</Popover.Popup>
          </Popover.Positioner>
        </Popover.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));
});
