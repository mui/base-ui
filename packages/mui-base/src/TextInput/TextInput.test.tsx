import * as React from 'react';
import { TextInput } from '@base_ui/react/TextInput';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '#test-utils';

describe('<TextInput />', () => {
  const { render } = createRenderer();

  describeConformance(<TextInput />, () => ({
    refInstanceof: window.HTMLInputElement,
    render,
  }));
});
