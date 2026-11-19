import { describe } from 'vitest';
import { Select } from '@base-ui/react/select';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.ScrollDownArrow />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.ScrollDownArrow keepMounted />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Positioner>{node}</Select.Positioner>
        </Select.Root>,
      );
    },
  }));
});
