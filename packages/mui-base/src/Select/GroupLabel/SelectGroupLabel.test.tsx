import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Group />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.GroupLabel />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open animated={false}>
          <Select.Group>{node}</Select.Group>
        </Select.Root>,
      );
    },
  }));
});
