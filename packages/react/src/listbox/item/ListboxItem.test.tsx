import { describe } from 'vitest';
import { Listbox } from '@base-ui/react/listbox';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Listbox.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<Listbox.Item value="a" />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Listbox.Root>
          <Listbox.List>{node}</Listbox.List>
        </Listbox.Root>,
      );
    },
  }));
});
