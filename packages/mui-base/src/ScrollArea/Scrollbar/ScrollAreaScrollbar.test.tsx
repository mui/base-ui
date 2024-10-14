import * as React from 'react';
import { ScrollArea } from '@base_ui/react/ScrollArea/index.parts';
import { createRenderer } from '@mui/internal-test-utils';
import { describeConformance } from '../../../test/describeConformance';

describe('<ScrollArea.Scrollbar />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Scrollbar />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<ScrollArea.Root>{node}</ScrollArea.Root>);
    },
  }));
});
