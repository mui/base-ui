import * as React from 'react';
import { TextField } from '@base_ui/react/TextField';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../test/describeConformance';

describe('<TextField />', () => {
  const { render } = createRenderer();

  describeConformance(<TextField />, () => ({
    refInstanceof: window.HTMLInputElement,
    render,
  }));
});
