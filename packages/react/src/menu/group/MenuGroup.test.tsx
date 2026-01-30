import { screen } from '@mui/internal-test-utils';
import { expect, vi } from 'vitest';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Menu.Group />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Group />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  it('renders a div with the `group` role', async () => {
    await render(<Menu.Group />);
    expect(screen.getByRole('group')).toBeVisible();
  });

  it('calls the group keydown handler without triggering parent typeahead in an open submenu', async () => {
    const handleKeyDown = vi.fn();

    const { user } = await render(
      <Menu.Root open>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Group onKeyDown={handleKeyDown}>
                <Menu.Item>Apple</Menu.Item>
                <Menu.Item>Banana</Menu.Item>
                <Menu.SubmenuRoot open>
                  <Menu.SubmenuTrigger>More</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.Item closeOnClick={false}>Sub item</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    const parentMatchItem = screen.getByRole('menuitem', { name: 'Banana' });
    const subItem = screen.getByRole('menuitem', { name: 'Sub item' });
    expect(parentMatchItem).not.toHaveAttribute('data-highlighted');

    await user.click(subItem);
    await user.keyboard('b');

    expect(handleKeyDown).toHaveBeenCalled();
    expect(parentMatchItem).not.toHaveAttribute('data-highlighted');
  });

  it('does not bubble typeahead keydown events above the menu root from an open submenu', async () => {
    const handleGroupKeyDown = vi.fn();
    const handleRootKeyDown = vi.fn();

    const { user } = await render(
      <div onKeyDown={handleRootKeyDown}>
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Group onKeyDown={handleGroupKeyDown}>
                  <Menu.Item>Parent item</Menu.Item>
                  <Menu.SubmenuRoot open>
                    <Menu.SubmenuTrigger>More</Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.Item closeOnClick={false}>Sub item</Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.SubmenuRoot>
                </Menu.Group>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>,
    );

    const subItem = screen.getByRole('menuitem', { name: 'Sub item' });
    await user.click(subItem);
    await user.keyboard('s');

    expect(handleGroupKeyDown).toHaveBeenCalled();
    expect(handleRootKeyDown).not.toHaveBeenCalled();
  });
});
