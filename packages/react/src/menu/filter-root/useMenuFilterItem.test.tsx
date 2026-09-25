import { expect, vi, describe, beforeEach, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

describe('filtered Menu items', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  it('keeps focus on the input when items are pressed', async () => {
    const handleItemClick = vi.fn();
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Input aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item closeOnClick={false} onClick={handleItemClick}>
                    Rename
                  </Menu.Item>
                  <Menu.LinkItem href="#details">Open details</Menu.LinkItem>
                  <Menu.CheckboxItem>Show details</Menu.CheckboxItem>
                  <Menu.RadioGroup>
                    <Menu.RadioItem value="date">Sort by date</Menu.RadioItem>
                  </Menu.RadioGroup>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
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
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Input aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>
                      {'Re'}
                      {'name'}
                    </Menu.Item>
                    <Menu.Item>Delete</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      const input = screen.getByRole('searchbox', { name: 'Filter actions' });

      // Hide it, so its DOM node goes away and only the children remain as a text source.
      await user.type(input, 'del');
      await waitFor(() => {
        expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
      });

      fireEvent.change(input, { target: { value: 'rena' } });

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
      });
      expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBe(null);
    });

    it('keeps the rendered text of a hidden item whose children render different text', async () => {
      const translations: Record<string, string> = { Rename: 'Zmień nazwę', Delete: 'Usuń' };
      function Translate(props: { children: string }) {
        return translations[props.children];
      }

      function Test(props: { value: string; tick: number }) {
        return (
          <Menu.FilterProvider value={props.value}>
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup data-tick={props.tick}>
                    <Menu.Input aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>
                        <Translate>Rename</Translate>
                      </Menu.Item>
                      <Menu.Item>
                        <Translate>Delete</Translate>
                      </Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
        );
      }

      const { setProps } = await render(<Test value="" tick={0} />);

      await setProps({ value: 'usu', tick: 0 });
      expect(screen.queryByRole('menuitem', { name: 'Zmień nazwę' })).toBe(null);

      // Re-render the hidden item with the same children.
      await setProps({ value: 'usu', tick: 1 });

      await setProps({ value: 'zmie', tick: 1 });
      expect(screen.getByRole('menuitem', { name: 'Zmień nazwę' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'Usuń' })).toBe(null);
    });

    it('matches the new children of an item that changed while it was filtered out', async () => {
      function Test(props: { value: string; label: string }) {
        return (
          <Menu.FilterProvider value={props.value}>
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Input aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>{props.label}</Menu.Item>
                      <Menu.Item>Delete</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
        );
      }

      const { setProps } = await render(<Test value="" label="Rename" />);

      await setProps({ value: 'del', label: 'Rename' });
      await setProps({ value: 'del', label: 'Duplicate' });
      await setProps({ value: 'dup', label: 'Duplicate' });

      expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toBeVisible();
    });
  });

  describe('disabled items', () => {
    let onDisabledClick = vi.fn();
    beforeEach(() => {
      onDisabledClick = vi.fn();
    });

    function DisabledItemMenu() {
      return (
        <Menu.FilterProvider>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Input aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.Item disabled onClick={onDisabledClick}>
                      Archive
                    </Menu.Item>
                    <Menu.Item>Delete</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
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
