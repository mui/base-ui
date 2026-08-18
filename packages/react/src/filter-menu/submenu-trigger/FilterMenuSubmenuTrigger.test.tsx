import { expect } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';

describe('<FilterMenu.SubmenuTrigger />', () => {
  const { render } = createRenderer();

  it('keeps real focus on the parent input during keyboard and pointer interaction', async () => {
    const { user } = await render(
      <FilterMenu.Root open>
        <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.List>
                <FilterMenu.Item>Rename</FilterMenu.Item>
                <FilterMenu.SubmenuRoot>
                  <FilterMenu.SubmenuTrigger delay={0}>Move to folder</FilterMenu.SubmenuTrigger>
                  <FilterMenu.Portal>
                    <FilterMenu.Positioner>
                      <FilterMenu.Popup>
                        <FilterMenu.Item>Documents</FilterMenu.Item>
                      </FilterMenu.Popup>
                    </FilterMenu.Positioner>
                  </FilterMenu.Portal>
                </FilterMenu.SubmenuRoot>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    input.focus();

    // Move virtual focus onto the submenu trigger; real focus stays on the input.
    await user.keyboard('[ArrowDown][ArrowDown]');

    const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to folder' });
    expect(submenuTrigger).toHaveAttribute('tabindex', '-1');
    expect(input).toHaveFocus();

    await user.click(submenuTrigger);

    expect(input).toHaveFocus();
  });
});
