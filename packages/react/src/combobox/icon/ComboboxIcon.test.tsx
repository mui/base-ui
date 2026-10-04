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

  it('removes the default arrow when `children={null}` is passed alongside `render`', async () => {
    // See https://github.com/mui/base-ui/issues/4752 — `render` alone does not clear the
    // default glyph (that would change behavior for call sites using `render` only to swap
    // the tag); pairing it with `children={null}` is the documented way to opt out.
    await render(
      <Combobox.Root open>
        <Combobox.Icon render={<span data-testid="custom-icon" className="my-icon" />}>
          {null}
        </Combobox.Icon>
      </Combobox.Root>,
    );

    const icon = screen.getByTestId('custom-icon');
    expect(icon.textContent).toBe('');
  });
});
