import * as React from 'react';
import * as ScrollArea from '@base_ui/react/ScrollArea';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../../test/describeConformance';

describe('<ScrollArea.Corner />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Corner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));
});
