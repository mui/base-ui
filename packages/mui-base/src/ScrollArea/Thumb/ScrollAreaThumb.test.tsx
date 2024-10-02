import * as React from 'react';
import * as ScrollArea from '@base_ui/react/ScrollArea';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../../test/describeConformance';

describe('<ScrollArea.Thumb />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Thumb />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));
});
