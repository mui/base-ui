import * as React from 'react';
import { Textarea } from '@base-ui-components/react/textarea';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../test/describeConformance';

describe('<Textarea />', () => {
  const { render } = createRenderer();

  describeConformance(<Textarea />, () => ({
    refInstanceof: window.HTMLTextAreaElement,
    render,
  }));
});
