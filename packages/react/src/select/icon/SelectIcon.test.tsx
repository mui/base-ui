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

  it('removes the default arrow when `children={null}` is passed alongside `render`', async () => {
    // See https://github.com/mui/base-ui/issues/4752 — `render` alone does not clear the
    // default glyph (that would change behavior for call sites using `render` only to swap
    // the tag); pairing it with `children={null}` is the documented way to opt out.
    await render(
      <Select.Root open>
        <Select.Icon render={<span data-testid="custom-icon" className="my-icon" />}>
          {null}
        </Select.Icon>
      </Select.Root>,
    );

    const icon = screen.getByTestId('custom-icon');
    expect(icon.textContent).toBe('');
  });
});
