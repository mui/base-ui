import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Field from '@base_ui/react/Field';
import { describeConformance } from '../../../test/describeConformance';

describe('<Field.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Label />, () => ({
    inheritComponent: 'label',
    refInstanceof: window.HTMLLabelElement,
    render(node) {
      return render(<Field.Root>{node}</Field.Root>);
    },
  }));
});
