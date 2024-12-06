import * as React from 'react';
import { createRenderer, describeConformance } from '#test-utils';
import { Radio } from '@base-ui-components/react/radio';

describe('<Radio.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Radio.Indicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Radio.Root value="">{node}</Radio.Root>);
    },
  }));
});
