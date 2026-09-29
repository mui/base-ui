import { expect, describe, it } from 'vitest';
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

  it('matches the start and end of an item label', async () => {
    function TestFilter() {
      const filter = useComboboxFilter({ locale: 'en' });
      return (
        <div>
          <span data-testid="starts-match">{String(filter.startsWith('Éclair', 'ec'))}</span>
          <span data-testid="starts-inner">{String(filter.startsWith('Éclair', 'clair'))}</span>
          <span data-testid="starts-empty">{String(filter.startsWith('Éclair', ''))}</span>
          <span data-testid="starts-longer">{String(filter.startsWith('Tea', 'teapot'))}</span>
          <span data-testid="ends-match">{String(filter.endsWith('Crème brûlée', 'BRULEE'))}</span>
          <span data-testid="ends-inner">{String(filter.endsWith('Crème brûlée', 'crème'))}</span>
          <span data-testid="ends-empty">{String(filter.endsWith('Crème brûlée', ''))}</span>
          <span data-testid="ends-longer">{String(filter.endsWith('Tea', 'iced tea'))}</span>
          <span data-testid="object-item">
            {String(filter.startsWith({ label: 'Banana' }, 'ban', (item) => item.label))}
          </span>
        </div>
      );
    }

    await render(<TestFilter />);

    expect(screen.getByTestId('starts-match')).toHaveTextContent('true');
    expect(screen.getByTestId('starts-inner')).toHaveTextContent('false');
    expect(screen.getByTestId('starts-empty')).toHaveTextContent('true');
    expect(screen.getByTestId('starts-longer')).toHaveTextContent('false');
    expect(screen.getByTestId('ends-match')).toHaveTextContent('true');
    expect(screen.getByTestId('ends-inner')).toHaveTextContent('false');
    expect(screen.getByTestId('ends-empty')).toHaveTextContent('true');
    expect(screen.getByTestId('ends-longer')).toHaveTextContent('false');
    expect(screen.getByTestId('object-item')).toHaveTextContent('true');
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
