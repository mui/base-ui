import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group';
import { describeConformance } from '../../../test/describeConformance';

describe('<CheckboxGroup.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<CheckboxGroup.Root />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render,
  }));
});
