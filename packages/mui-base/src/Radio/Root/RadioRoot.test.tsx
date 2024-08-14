import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Radio from '@base_ui/react/Radio';
import { describeConformance } from '../../../test/describeConformance';

describe('<Radio.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Radio.Root value="" />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render,
  }));
});
