import { expect, vi, describe, beforeEach, it } from 'vitest';
import { screen, waitFor } from '@mui/internal-test-utils';
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

  describe('item text resolution', () => {
    it('matches an item whose children are an array while it is filtered out', async () => {
      const { user } = await render(
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>
                    {'Re'}
                    {'name'}
                  </FilterMenu.Item>
                  <FilterMenu.Item>Delete</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });

      // Hide it, so its DOM node goes away and only the children remain as a text source.
      await user.type(input, 'del');
      await waitFor(() => {
        expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
      });

      await user.clear(input);
      await user.type(input, 'rena');

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
      });
      expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBe(null);
    });
  });

  describe('disabled items', () => {
    let onDisabledClick = vi.fn();
    beforeEach(() => {
      onDisabledClick = vi.fn();
    });

    function DisabledItemMenu() {
      return (
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter actions" />
                <FilterMenu.List>
                  <FilterMenu.Item>Rename</FilterMenu.Item>
                  <FilterMenu.Item disabled onClick={onDisabledClick}>
                    Archive
                  </FilterMenu.Item>
                  <FilterMenu.Item>Delete</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>
      );
    }

    it('keeps a disabled item reachable with the arrow keys', async () => {
      const { user } = await render(<DisabledItemMenu />);

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('[ArrowDown][ArrowDown]');

      // Menus keep disabled items discoverable rather than skipping them.
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('menuitem', { name: 'Archive' }).id,
      );
    });

    it('does not activate a highlighted disabled item with Enter', async () => {
      const { user } = await render(<DisabledItemMenu />);

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('[ArrowDown][ArrowDown][Enter]');

      expect(onDisabledClick).not.toHaveBeenCalled();
      expect(screen.getByRole('menu')).toBeVisible();
    });
  });
});
