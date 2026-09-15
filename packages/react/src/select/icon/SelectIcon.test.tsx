import { describe, it, expect } from 'vitest';
import { Select } from '@base-ui/react/select';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Icon />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Icon />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Select.Root open>{node}</Select.Root>);
    },
  }));

  it('does not render the default arrow when `render` is a childless custom element', async () => {
    // Regression test for https://github.com/mui/base-ui/issues/4752
    await render(
      <Select.Root open>
        <Select.Icon render={<span data-testid="custom-icon" className="my-icon" />} />
      </Select.Root>,
    );

    const icon = screen.getByTestId('custom-icon');
    expect(icon.textContent).toBe('');
  });
});
