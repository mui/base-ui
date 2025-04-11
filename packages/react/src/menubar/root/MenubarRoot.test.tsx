/* eslint-disable react/no-danger */
/* eslint-disable testing-library/prefer-presence-queries */
import * as React from 'react';
import { expect } from 'vitest';
import { userEvent as user } from '@vitest/browser/context';
import { render } from 'vitest-browser-react';
import { Menubar } from '@base-ui-components/react/menubar';
import { Menu } from '@base-ui-components/react/menu';
import { isJSDOM } from '#test-utils';

function TestMenubar(props: Menubar.Root.Props) {
  return (
    <Menubar.Root {...props} style={{ maxWidth: '25vw', display: 'flex' }}>
      <Menu.Root>
        <Menu.Trigger data-testid="file-trigger">File</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner data-testid="file-menu">
            <Menu.Popup>
              <Menu.Item data-testid="file-item-1">Open</Menu.Item>
              <Menu.Item data-testid="file-item-2">Save</Menu.Item>
              <Menu.Root>
                <Menu.SubmenuTrigger data-testid="share-trigger">Share</Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner data-testid="share-menu">
                    <Menu.Popup>
                      <Menu.Item data-testid="share-item-1">Email</Menu.Item>
                      <Menu.Item data-testid="share-item-2">Print</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Menu.Root>
        <Menu.Trigger data-testid="edit-trigger">Edit</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner data-testid="edit-menu">
            <Menu.Popup>
              <Menu.Item data-testid="edit-item-1">Copy</Menu.Item>
              <Menu.Item data-testid="edit-item-2">Paste</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Menu.Root>
        <Menu.Trigger data-testid="view-trigger">View</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner data-testid="view-menu">
            <Menu.Popup>
              <Menu.Item data-testid="view-item-1">Zoom In</Menu.Item>
              <Menu.Item data-testid="view-item-2">Zoom Out</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menubar.Root>
  );
}

describe.skipIf(isJSDOM)('<Menubar.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  describe('click interactions', () => {
    it('should open the menu after clicking on its trigger', async () => {
      const screen = render(<TestMenubar />);

      const fileTrigger = screen.getByTestId('file-trigger');

      await user.click(fileTrigger);
      await expect.element(screen.getByTestId('file-menu')).toBeInTheDocument();

      // Click again to close the menu
      await user.click(fileTrigger);
      await expect.element(screen.getByTestId('file-menu')).not.toBeInTheDocument();
    });

    it('should close the file menu when clicking outside', async () => {
      const screen = render(<TestMenubar />);

      const fileTrigger = screen.getByTestId('file-trigger');
      await user.click(fileTrigger);

      await expect.element(screen.getByTestId('file-menu')).toBeInTheDocument();

      // Click outside the menubar
      await user.click(document.body);
      await expect.element(screen.getByTestId('file-menu')).not.toBeInTheDocument();
    });
  });

  describe('hover behavior', () => {
    it('should not open submenus on hover when no submenu is already open', async () => {
      const screen = render(<TestMenubar />);

      const fileTrigger = screen.getByTestId('file-trigger');

      await user.hover(fileTrigger);

      // The file menu should not be open because no submenu is already open
      await expect.element(screen.getByTestId('file-menu')).not.toBeInTheDocument();
    });

    it('should open submenus on hover when another submenu is already open', async () => {
      const screen = render(<TestMenubar />);

      // First click to open the file menu
      const fileTrigger = screen.getByTestId('file-trigger');
      await user.click(fileTrigger);

      await expect.element(screen.getByTestId('file-menu')).toBeVisible();

      // Now hover over the edit trigger, it should open because a submenu is already open
      await expect.element(screen.getByTestId('edit-trigger')).toBeVisible();
      const editTrigger = screen.getByTestId('edit-trigger');

      await user.hover(editTrigger);

      await expect.element(screen.getByTestId('edit-menu')).toBeInTheDocument();

      // The file menu should now be closed
      await expect.element(screen.getByTestId('file-menu')).not.toBeInTheDocument();

      // Continue hovering to the view trigger
      const viewTrigger = screen.getByTestId('view-trigger');
      await user.hover(viewTrigger);

      await expect.element(screen.getByTestId('view-menu')).toBeInTheDocument();

      // The edit menu should now be closed
      await expect.element(screen.getByTestId('edit-menu')).not.toBeInTheDocument();
    });

    it('should open nested submenus on hover when parent menu is open', async () => {
      const screen = render(<TestMenubar />);

      // First click to open the file menu
      const fileTrigger = screen.getByTestId('file-trigger');
      await user.click(fileTrigger);

      await expect.element(screen.getByTestId('file-menu')).toBeInTheDocument();

      // Now hover over the share submenu trigger
      const shareTrigger = screen.getByTestId('share-trigger');
      await user.hover(shareTrigger);

      // The share submenu should open
      await expect.element(screen.getByTestId('share-menu')).toBeInTheDocument();
    });
  });

  describe('focus behavior', () => {
    it('focuses a menubar item without immediately opening the menu', async () => {
      const screen = render(<TestMenubar />);

      const fileTrigger = screen.getByTestId('file-trigger');

      // Focus the file trigger without clicking or pressing a key
      (fileTrigger.element() as HTMLButtonElement).focus();

      // Wait to ensure focus alone doesn't cause the menu to open
      await expect.element(screen.getByTestId('file-menu')).not.toBeInTheDocument();

      await user.keyboard('{Enter}');
      await expect.element(screen.getByTestId('file-menu')).toBeInTheDocument();
    });
  });

  describe('keyboard interactions', () => {
    it('should navigate between menubar items with arrow keys', async () => {
      const screen = render(<TestMenubar />);

      const fileTrigger = screen.getByTestId('file-trigger');
      const editTrigger = screen.getByTestId('edit-trigger');

      // First focus the file trigger
      (fileTrigger.element() as HTMLButtonElement).focus();

      // Check that file trigger has focus
      await expect.element(fileTrigger).toHaveFocus();

      // Use arrow right to navigate to edit trigger
      await user.keyboard('{ArrowRight}');

      // Wait for the edit trigger to get focus
      await expect.element(editTrigger).toHaveFocus();
    });

    it('should open menu with Space key', async () => {
      const screen = render(<TestMenubar />);
      const fileTrigger = screen.getByTestId('file-trigger');

      // Focus the file trigger
      (fileTrigger.element() as HTMLButtonElement).focus();

      // Press Space key to open menu
      await user.keyboard(' ');

      // Menu should be open
      await expect.element(screen.getByTestId('file-menu')).toBeInTheDocument();
    });

    it('should navigate within menu using arrow keys', async () => {
      const screen = render(<TestMenubar />);
      const fileTrigger = screen.getByTestId('file-trigger');

      // Focus and open file menu
      (fileTrigger.element() as HTMLButtonElement).focus();
      await user.keyboard('{Enter}');

      // File menu should be open
      await expect.element(screen.getByTestId('file-menu')).toBeInTheDocument();

      // First item should be focused automatically
      const firstItem = screen.getByTestId('file-item-1');
      await expect.element(firstItem).toHaveFocus();

      // Navigate down to second item
      await user.keyboard('{ArrowDown}');
      const secondItem = screen.getByTestId('file-item-2');
      await expect.element(secondItem).toHaveFocus();

      // Navigate down to submenu trigger
      await user.keyboard('{ArrowDown}');
      const shareTrigger = screen.getByTestId('share-trigger');
      await expect.element(shareTrigger).toHaveFocus();
    });

    it('should open submenu with right arrow key', async () => {
      const screen = render(<TestMenubar />);
      const fileTrigger = screen.getByTestId('file-trigger');

      // Focus and open file menu
      (fileTrigger.element() as HTMLButtonElement).focus();
      await user.keyboard('{Enter}');
      await expect.element(screen.getByTestId('file-menu')).toBeInTheDocument();

      // Navigate to submenu trigger
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await expect.element(screen.getByTestId('share-trigger')).toHaveFocus();

      // Arrow right should open submenu
      await user.keyboard('{ArrowRight}');

      // Share submenu should be open
      await expect.element(screen.getByTestId('share-menu')).toBeInTheDocument();

      // First submenu item should be focused
      const submenuItem = screen.getByTestId('share-item-1');
      await expect.element(submenuItem).toHaveFocus();
    });

    it('should close menu with Escape key', async () => {
      const screen = render(<TestMenubar />);
      const fileTrigger = screen.getByTestId('file-trigger');

      // Focus and open file menu
      (fileTrigger.element() as HTMLButtonElement).focus();
      await user.keyboard('{Enter}');

      // Menu should be open
      await expect.element(screen.getByTestId('file-menu')).toBeInTheDocument();

      // Press Escape to close
      await user.keyboard('{Escape}');

      // Menu should be closed
      await expect.element(screen.getByTestId('file-menu')).not.toBeInTheDocument();

      // Trigger should still have focus
      await expect.element(fileTrigger).toHaveFocus();
    });

    it('should close submenu with left arrow key and return focus to submenu trigger', async () => {
      const screen = render(<TestMenubar />);
      const fileTrigger = screen.getByTestId('file-trigger');

      // Focus and open file menu
      (fileTrigger.element() as HTMLButtonElement).focus();
      await user.keyboard('{Enter}');
      await expect.element(screen.getByTestId('file-menu')).toBeInTheDocument();

      // Navigate to submenu trigger
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      const shareTrigger = screen.getByTestId('share-trigger');
      await expect.element(shareTrigger).toHaveFocus();

      // Open submenu
      await user.keyboard('{ArrowRight}');
      await expect.element(screen.getByTestId('share-menu')).toBeInTheDocument();

      // Close submenu with left arrow
      await user.keyboard('{ArrowLeft}');

      // Submenu should be closed
      await expect.element(screen.getByTestId('share-menu')).not.toBeInTheDocument();

      // Focus should return to submenu trigger
      await expect.element(shareTrigger).toHaveFocus();
    });

    it('should navigate between menus using left/right arrow keys when menus are open', async () => {
      const screen = render(<TestMenubar />);
      const fileTrigger = screen.getByTestId('file-trigger');
      const editTrigger = screen.getByTestId('edit-trigger');

      // Focus and open file menu
      (fileTrigger.element() as HTMLButtonElement).focus();
      await user.keyboard('{Enter}');

      // File menu should be open
      await expect.element(screen.getByTestId('file-menu')).toBeInTheDocument();

      // Navigate right to edit menu
      await user.keyboard('{ArrowRight}');

      // File menu should close, edit menu should open
      await expect.element(screen.getByTestId('file-menu')).not.toBeInTheDocument();
      await expect.element(screen.getByTestId('edit-menu')).toBeInTheDocument();

      // Edit trigger should have focus
      await expect.element(editTrigger).toHaveFocus();

      // Navigate back to file menu
      await user.keyboard('{ArrowLeft}');

      // Edit menu should close, file menu should open
      await expect.element(screen.getByTestId('edit-menu')).not.toBeInTheDocument();
      await expect.element(screen.getByTestId('file-menu')).toBeInTheDocument();

      // File trigger should have focus
      await expect.element(fileTrigger).toHaveFocus();
    });
  });

  describe.todo('mixed mouse and keyboard interactions', () => {
    it('should allow keyboard navigation after opening a menu with mouse click', async () => {
      const screen = render(<TestMenubar />);

      // Open the menu with a mouse click
      const fileTrigger = screen.getByTestId('file-trigger');
      await user.click(fileTrigger);

      // Menu should be open
      await expect.element(screen.getByTestId('file-menu')).toBeInTheDocument();

      // Navigate with keyboard
      await user.keyboard('{ArrowDown}');
      const firstItem = screen.getByTestId('file-item-1');
      await expect.element(firstItem).toHaveFocus();

      // Continue navigation
      await user.keyboard('{ArrowDown}');
      const secondItem = screen.getByTestId('file-item-2');
      await expect.element(secondItem).toHaveFocus();
    });

    it('should allow clicking a menu trigger then navigating to another menu with keyboard', async () => {
      const screen = render(<TestMenubar />);

      // Open the file menu with a mouse click
      const fileTrigger = screen.getByTestId('file-trigger');
      await user.click(fileTrigger);

      // Navigate to edit menu with keyboard
      await user.keyboard('{ArrowRight}');

      // File menu should close, edit menu should open
      await expect.element(screen.getByTestId('file-menu')).not.toBeInTheDocument();
      await expect.element(screen.getByTestId('edit-menu')).toBeInTheDocument();

      // Edit trigger should have focus
      const editTrigger = screen.getByTestId('edit-trigger');
      await expect.element(editTrigger).toHaveFocus();
    });
  });

  describe('prop: loop', () => {
    describe('when loop == true', () => {
      it('should loop around to the first item after the last one', async () => {
        const screen = render(<TestMenubar loop />);

        const firstItem = screen.getByTestId('file-trigger');
        (firstItem.element() as HTMLButtonElement).focus();

        await user.keyboard('{ArrowRight}');
        await user.keyboard('{ArrowRight}');

        const lastItem = screen.getByTestId('view-trigger');
        await expect.element(lastItem).toHaveFocus();

        await user.keyboard('{ArrowRight}');
        await expect.element(firstItem).toHaveFocus();
      });

      it('should loop around to the last item after the first one', async () => {
        const screen = render(<TestMenubar loop />);

        const fileTrigger = screen.getByTestId('file-trigger');
        (fileTrigger.element() as HTMLButtonElement).focus();
        await expect.element(fileTrigger).toHaveFocus();

        await user.keyboard('{ArrowLeft}');
        const lastItem = screen.getByTestId('view-trigger');
        await expect.element(lastItem).toHaveFocus();
      });
    });

    describe('when loop == false', () => {
      it('should loop around to the first item after the last one', async () => {
        const screen = render(<TestMenubar loop={false} />);

        const fileTrigger = screen.getByTestId('file-trigger');
        (fileTrigger.element() as HTMLButtonElement).focus();

        await user.keyboard('{ArrowRight}');
        await user.keyboard('{ArrowRight}');

        const lastItem = screen.getByTestId('view-trigger');
        await expect.element(lastItem).toHaveFocus();

        await user.keyboard('{ArrowRight}');
        await expect.element(lastItem).toHaveFocus();
      });

      it('should loop around to the last item after the first one', async () => {
        const screen = render(<TestMenubar loop={false} />);

        const firstItem = screen.getByTestId('file-trigger');
        (firstItem.element() as HTMLButtonElement).focus();

        await user.keyboard('{ArrowLeft}');
        await expect.element(firstItem).toHaveFocus();
      });
    });
  });
});
