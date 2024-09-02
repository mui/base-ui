import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.OptionGroupLabel />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.OptionGroupLabel />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open animated={false}>
          <Select.OptionGroup>{node}</Select.OptionGroup>
        </Select.Root>,
      );
    },
  }));
});
