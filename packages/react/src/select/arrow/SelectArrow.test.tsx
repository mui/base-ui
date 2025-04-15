import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Arrow />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Positioner anchor="trigger">{node}</Select.Positioner>
        </Select.Root>,
      );
    },
  }));
});
