import { expect } from 'vitest';
import { createRenderer } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import { useComboboxFilter } from './useFilter';

describe('useComboboxFilter', () => {
  const { render } = createRenderer();

  it('uses default options when called without arguments', async () => {
    function TestFilter() {
      const filter = useComboboxFilter();
      return <span>{String(filter.contains('Apple', 'app'))}</span>;
    }

    await render(<TestFilter />);

    expect(screen.getByText('true')).not.toBe(null);
  });

  it('filters selected and unselected items in single and multiple modes', async () => {
    function TestFilter({ multiple }: { multiple: boolean }) {
      const filter = useComboboxFilter({ locale: 'en', multiple, value: 'Apple' });
      return (
        <div>
          <span data-testid="selected-match">{String(filter.contains('Banana', 'apple'))}</span>
          <span data-testid="item-match">{String(filter.contains('Banana', 'nan'))}</span>
        </div>
      );
    }

    const { rerender } = await render(<TestFilter multiple={false} />);

    expect(screen.getByTestId('selected-match')).toHaveTextContent('true');
    expect(screen.getByTestId('item-match')).toHaveTextContent('true');

    await rerender(<TestFilter multiple />);

    expect(screen.getByTestId('selected-match')).toHaveTextContent('false');
    expect(screen.getByTestId('item-match')).toHaveTextContent('true');
  });
});
