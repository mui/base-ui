import { describe, it, expect } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Combobox.Icon />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Icon />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Combobox.Root open>{node}</Combobox.Root>);
    },
  }));

  it('does not render the default arrow when `render` is a childless custom element', async () => {
    // Regression test for https://github.com/mui/base-ui/issues/4752
    await render(
      <Combobox.Root open>
        <Combobox.Icon render={<span data-testid="custom-icon" className="my-icon" />} />
      </Combobox.Root>,
    );

    const icon = screen.getByTestId('custom-icon');
    expect(icon.textContent).toBe('');
  });
});
