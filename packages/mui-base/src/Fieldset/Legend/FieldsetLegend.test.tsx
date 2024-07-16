import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Fieldset from '@base_ui/react/Fieldset';
import { describeConformance } from '../../../test/describeConformance';

describe('<Fieldset.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Fieldset.Label />, () => ({
    inheritComponent: 'span',
    refInstanceof: window.HTMLSpanElement,
    render,
  }));
});
