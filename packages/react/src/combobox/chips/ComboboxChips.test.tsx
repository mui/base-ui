import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Combobox.Chips />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Chips />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Combobox.Root>{node}</Combobox.Root>);
    },
  }));
});
