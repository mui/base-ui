import * as React from 'react';
import { ScrollArea } from '@base_ui/react/ScrollArea';
import { describeConformance, createRenderer } from '#test-utils';

describe('<ScrollArea.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<ScrollArea.Root>{node}</ScrollArea.Root>);
    },
  }));
});
