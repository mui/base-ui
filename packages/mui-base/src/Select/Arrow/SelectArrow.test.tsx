import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Arrow />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open animated={false} alignOptionToTrigger={false}>
          <Select.Positioner>{node}</Select.Positioner>
        </Select.Root>,
      );
    },
  }));
});
