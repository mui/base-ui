import { expect } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Combobox.Separator />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Separator />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('has role="presentation"', async () => {
    await render(<Combobox.Separator data-testid="separator" />);

    expect(screen.getByTestId('separator')).toHaveAttribute('role', 'presentation');
  });

  describe('prop: orientation', () => {
    ['horizontal', 'vertical'].forEach((orientation) => {
      it(orientation, async () => {
        await render(
          <Combobox.Separator
            orientation={orientation as Combobox.Separator.Props['orientation']}
            data-testid="separator"
          />,
        );

        const separator = screen.getByTestId('separator');
        expect(separator).toHaveAttribute('data-orientation', orientation);
        expect(separator).not.toHaveAttribute('aria-orientation');
      });
    });
  });
});
