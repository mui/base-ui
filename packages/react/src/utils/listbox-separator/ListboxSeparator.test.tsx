import { expect } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { ListboxSeparator } from './ListboxSeparator';

describe('<ListboxSeparator />', () => {
  const { render } = createRenderer();

  describeConformance(<ListboxSeparator />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('has role="presentation"', async () => {
    await render(<ListboxSeparator data-testid="separator" />);

    expect(screen.getByTestId('separator')).toHaveAttribute('role', 'presentation');
  });

  describe('prop: orientation', () => {
    ['horizontal', 'vertical'].forEach((orientation) => {
      it(orientation, async () => {
        await render(
          <ListboxSeparator
            orientation={orientation as ListboxSeparator.Props['orientation']}
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
