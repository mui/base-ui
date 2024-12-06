import * as React from 'react';
import { Input } from '@base-ui-components/react/input';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../test/describeConformance';

describe('<Input />', () => {
  const { render } = createRenderer();

  describeConformance(<Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render,
  }));
});
