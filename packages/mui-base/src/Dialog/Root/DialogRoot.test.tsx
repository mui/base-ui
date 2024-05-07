import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import * as Dialog from '@base_ui/react/Dialog';
import { describeConformance } from '../../../test/describeConformance';

describe('<Dialog.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Root />, () => ({
    render,
    skip: ['refForwarding', 'className', 'propsSpread'],
  }));
});
