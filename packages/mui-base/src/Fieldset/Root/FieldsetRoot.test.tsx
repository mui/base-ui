import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Fieldset from '@base_ui/react/Fieldset';
import { describeConformance } from '../../../test/describeConformance';

describe('<Fieldset.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Fieldset.Root />, () => ({
    inheritComponent: 'fieldset',
    refInstanceof: window.HTMLFieldSetElement,
    render,
  }));
});
