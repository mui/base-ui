import * as React from 'react';
import { TextInput } from '@base-ui-components/react/text-input';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../test/describeConformance';

describe('<TextInput />', () => {
  const { render } = createRenderer();

  describeConformance(<TextInput />, () => ({
    refInstanceof: window.HTMLInputElement,
    render,
  }));
});
