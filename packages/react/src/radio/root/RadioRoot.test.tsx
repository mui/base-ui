import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Radio } from '@base-ui-components/react/radio';
import { describeConformance } from '../../../test/describeConformance';

describe('<Radio.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Radio.Root value="" />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render,
  }));
});
