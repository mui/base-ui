import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Field } from '@base_ui/react/Field';
import { describeConformance } from '#test-utils';

describe('<Field.Control />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Control />, () => ({
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(<Field.Root>{node}</Field.Root>);
    },
  }));
});
