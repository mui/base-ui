import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../../test/describeConformance';

describe('<Tooltip.PopupRoot />', () => {
  const { render } = createRenderer();

  describeConformance(<Tooltip.PopupRoot />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Tooltip.Root>{node}</Tooltip.Root>);
    },
    skip: ['reactTestRenderer'],
  }));
});
