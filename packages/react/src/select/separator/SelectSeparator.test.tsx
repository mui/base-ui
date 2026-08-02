import { expect } from 'vitest';
import { Select } from '@base-ui/react/select';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Separator />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Separator />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('has role="presentation"', async () => {
    await render(<Select.Separator data-testid="separator" />);

    expect(screen.getByTestId('separator')).toHaveAttribute('role', 'presentation');
  });

  describe('prop: orientation', () => {
    ['horizontal', 'vertical'].forEach((orientation) => {
      it(orientation, async () => {
        await render(
          <Select.Separator
            orientation={orientation as Select.Separator.Props['orientation']}
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
