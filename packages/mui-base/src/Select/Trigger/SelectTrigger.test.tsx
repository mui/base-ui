import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    render(node) {
      return render(
        <Select.Root open animated={false}>
          {node}
        </Select.Root>,
      );
    },
  }));
});
