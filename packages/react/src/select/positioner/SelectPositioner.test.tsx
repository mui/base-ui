import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Portal>{node}</Select.Portal>
        </Select.Root>,
      );
    },
  }));
});
