import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tooltip.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.Arrow />, () => ({
    refInstanceof: window.Element,
    render(node) {
      return render(
        <Tooltip.Root open>
          <Tooltip.Positioner>
            <Tooltip.Popup>{node}</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Root>,
      );
    },
  }));
});
