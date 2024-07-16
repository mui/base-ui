import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Field from '@base_ui/react/Field';
import { describeConformance } from '../../../test/describeConformance';

describe('<Field.Message />', () => {
  const { render } = createRenderer();

  describeConformance(<Field.Message />, () => ({
    inheritComponent: 'p',
    refInstanceof: window.HTMLParagraphElement,
    render(node) {
      return render(<Field.Root>{node}</Field.Root>);
    },
  }));
});
