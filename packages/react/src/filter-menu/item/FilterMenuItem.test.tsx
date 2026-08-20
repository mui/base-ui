import { expect, vi } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';

describe('FilterMenu items', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  it('keeps focus on the input when items are pressed', async () => {
    const handleItemClick = vi.fn();
    const { user } = await render(
      <FilterMenu.Root inline open>
        <FilterMenu.Input aria-label="Filter actions" />
        <FilterMenu.List>
          <FilterMenu.Item closeOnClick={false} onClick={handleItemClick}>
            Rename
          </FilterMenu.Item>
          <FilterMenu.LinkItem href="#details">Open details</FilterMenu.LinkItem>
          <FilterMenu.CheckboxItem>Show details</FilterMenu.CheckboxItem>
          <FilterMenu.RadioGroup>
            <FilterMenu.RadioItem value="date">Sort by date</FilterMenu.RadioItem>
          </FilterMenu.RadioGroup>
        </FilterMenu.List>
      </FilterMenu.Root>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await user.click(input);

    await user.click(screen.getByRole('menuitem', { name: 'Rename' }));
    expect(input).toHaveFocus();
    expect(handleItemClick).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('menuitem', { name: 'Open details' }));
    expect(input).toHaveFocus();

    const checkboxItem = screen.getByRole('menuitemcheckbox', { name: 'Show details' });
    await user.click(checkboxItem);
    expect(input).toHaveFocus();
    expect(checkboxItem).toHaveAttribute('aria-checked', 'true');

    const radioItem = screen.getByRole('menuitemradio', { name: 'Sort by date' });
    await user.click(radioItem);
    expect(input).toHaveFocus();
    expect(radioItem).toHaveAttribute('aria-checked', 'true');
  });
});
