import * as React from 'react';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { createRenderer } from '#test-utils';
import { describeConformance } from '../../../test/describeConformance';

describe('<ScrollArea.Content />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Content />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<ScrollArea.Root>{node}</ScrollArea.Root>);
    },
  }));
});
