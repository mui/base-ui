import * as React from 'react';
import { TextArea } from '@base_ui/react/TextArea';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../test/describeConformance';

describe('<TextArea />', () => {
  const { render } = createRenderer();

  describeConformance(<TextArea />, () => ({
    refInstanceof: window.HTMLTextAreaElement,
    render,
  }));
});
