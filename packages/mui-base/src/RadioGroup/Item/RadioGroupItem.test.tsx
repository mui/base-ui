import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as RadioGroup from '@base_ui/react/RadioGroup';
import { describeConformance } from '../../../test/describeConformance';

describe('<RadioGroup.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<RadioGroup.Item name="" />, () => ({
    inheritComponent: 'button',
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(<RadioGroup.Root>{node}</RadioGroup.Root>);
    },
  }));
});
