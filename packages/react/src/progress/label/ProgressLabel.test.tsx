import * as React from 'react';
import { Progress } from '@base-ui-components/react/progress';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Progress.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Progress.Label />, () => ({
    render: (node) => {
      return render(<Progress.Root value={40}>{node}</Progress.Root>);
    },
    refInstanceof: window.HTMLSpanElement,
  }));
});
