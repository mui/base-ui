import * as React from 'react';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../test/describeConformance';
import { AspectRatio } from './AspectRatio';

describe('<AspectRatio />', () => {
  const { render } = createRenderer();

  describeConformance(<AspectRatio />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));
});
