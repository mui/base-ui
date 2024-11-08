import * as React from 'react';
import { createRenderer, describeConformance } from '#test-utils';
import { ScrollArea } from '@base_ui/react/ScrollArea';

describe('<ScrollArea.Thumb />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Thumb />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <ScrollArea.Root>
          <ScrollArea.Scrollbar>{node}</ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      );
    },
  }));
});
