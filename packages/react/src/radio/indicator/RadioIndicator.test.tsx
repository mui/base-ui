import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Radio } from '@base-ui-components/react/radio';
import { describeConformance } from '../../../test/describeConformance';

describe('<Radio.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Radio.Indicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Radio.Root value="">{node}</Radio.Root>);
    },
  }));
});
