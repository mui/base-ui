import { expect } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Combobox.Row />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Row />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Combobox.Root grid>{node}</Combobox.Root>);
    },
  }));

  it('has role="row"', async () => {
    await render(
      <Combobox.Root grid>
        <Combobox.Row />
      </Combobox.Root>,
    );

    expect(screen.getByRole('row')).not.toBe(null);
  });
});
