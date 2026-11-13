import { describe } from 'vitest';
import { Listbox } from '@base-ui/react/listbox';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Listbox.Label />', () => {
  const { render } = createRenderer();

  describeConformance(<Listbox.Label />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Listbox.Root>{node}</Listbox.Root>);
    },
  }));
});
