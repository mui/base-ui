import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Item />, () => ({
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
