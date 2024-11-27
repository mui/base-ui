import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.OptionIndicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.OptionIndicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Select.Root open animated={false}>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Option>{node}</Select.Option>
          </Select.Positioner>
        </Select.Root>,
      );
    },
  }));
});
