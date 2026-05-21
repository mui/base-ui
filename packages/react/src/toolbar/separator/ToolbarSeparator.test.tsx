import { expect } from 'vitest';
import { Toolbar } from '@base-ui/react/toolbar';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Toolbar.Separator />', () => {
  const { render } = createRenderer();

  describeConformance(<Toolbar.Separator />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Toolbar.Root>{node}</Toolbar.Root>);
    },
  }));

  it('has the opposite orientation from the toolbar', async () => {
    const { setProps } = await render(
      <Toolbar.Root orientation="horizontal">
        <Toolbar.Separator />
      </Toolbar.Root>,
    );

    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');

    await setProps({ orientation: 'vertical' });

    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });
});
