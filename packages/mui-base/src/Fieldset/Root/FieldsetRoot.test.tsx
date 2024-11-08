import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { Fieldset } from '@base_ui/react/Fieldset';
import { describeConformance } from '#test-utils';

describe('<Fieldset.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Fieldset.Root />, () => ({
    inheritComponent: 'fieldset',
    refInstanceof: window.HTMLFieldSetElement,
    render,
  }));
});
