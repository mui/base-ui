import * as React from 'react';
import { Select } from '@base_ui/react/Select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open animated={false}>
          {node}
        </Select.Root>,
      );
    },
  }));
});
