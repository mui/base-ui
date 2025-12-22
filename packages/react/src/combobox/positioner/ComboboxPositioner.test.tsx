import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Combobox.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Combobox.Root open>
          <Combobox.Portal>{node}</Combobox.Portal>
        </Combobox.Root>,
      );
    },
  }));
});
