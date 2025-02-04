import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Popover.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Arrow />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Popover.Root open>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>{node}</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );
    },
  }));
});
