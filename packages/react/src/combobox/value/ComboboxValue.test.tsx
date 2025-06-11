import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Combobox.Value />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Value />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Combobox.Root>{node}</Combobox.Root>);
    },
  }));
});
