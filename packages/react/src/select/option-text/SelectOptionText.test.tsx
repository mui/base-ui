import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.OptionText />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.OptionText />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open animated={false}>
          <Select.Positioner>
            <Select.Option value="">{node}</Select.Option>
          </Select.Positioner>
        </Select.Root>,
      );
    },
  }));
});
