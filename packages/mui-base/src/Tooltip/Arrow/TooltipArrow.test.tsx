import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../../test/describeConformance';

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
    skip: ['reactTestRenderer'],
  }));
});
