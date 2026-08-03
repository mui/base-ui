import { expect } from 'vitest';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Combobox } from '@base-ui/react/combobox';
import { Select } from '@base-ui/react/select';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { ListboxSeparator } from './ListboxSeparator';

describe('<ListboxSeparator />', () => {
  const { render } = createRenderer();

  describeConformance(<ListboxSeparator />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('has role="presentation" and defaults to horizontal', async () => {
    await render(<ListboxSeparator data-testid="separator" />);

    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('role', 'presentation');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    expect(separator).not.toHaveAttribute('aria-orientation');
  });

  describe('prop: orientation', () => {
    it('vertical', async () => {
      await render(<ListboxSeparator orientation="vertical" data-testid="separator" />);

      const separator = screen.getByTestId('separator');
      expect(separator).toHaveAttribute('data-orientation', 'vertical');
      expect(separator).not.toHaveAttribute('aria-orientation');
    });
  });

  describe.each([
    ['Autocomplete.Separator', <Autocomplete.Separator data-testid="separator" />],
    ['Combobox.Separator', <Combobox.Separator data-testid="separator" />],
    ['Select.Separator', <Select.Separator data-testid="separator" />],
  ])('%s', (_, separator) => {
    it('exposes the listbox separator behavior', async () => {
      await render(separator);

      expect(screen.getByTestId('separator')).toHaveAttribute('role', 'presentation');
    });
  });
});
