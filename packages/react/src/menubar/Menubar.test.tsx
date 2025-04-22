import * as React from 'react';
import { expect } from 'chai';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { Menubar } from '@base-ui-components/react/menubar';
import { Menu } from '@base-ui-components/react/menu';

function TestMenubar(props: Menubar.Props) {
  return (
    <Menubar {...props} style={{ maxWidth: '25vw', display: 'flex' }}>
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
    </Menubar>
  );
}

describe('<Menubar />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describeConformance(<Menubar />, () => ({
    render: (node) => {
      return render(<Menubar>{node}</Menubar>);
    },
    refInstanceof: window.HTMLDivElement,
  }));

  describe('click interactions', () => {
    it('should open the menu after clicking on its trigger', async () => {
      const { user } = await render(<TestMenubar />);

      const fileTrigger = screen.getByTestId('file-trigger');

      await user.click(fileTrigger);
      expect(screen.getByTestId('file-menu')).to.not.equal(null);

      // Click again to close the menu
      await user.click(fileTrigger);
      await waitFor(() => {
        expect(screen.queryByTestId('file-menu')).to.equal(null);
      });
    });

    it('should close the file menu when clicking outside', async () => {
      const { user } = await render(<TestMenubar />);

      const fileTrigger = screen.getByTestId('file-trigger');
      await user.click(fileTrigger);

      expect(screen.getByTestId('file-menu')).to.not.equal(null);

      // Click outside the menubar
      await user.click(document.body);
      await waitFor(() => {
        expect(screen.queryByTestId('file-menu')).to.equal(null);
      });
    });
  });

  describe('hover behavior', () => {
    it('should not open submenus on hover when no submenu is already open', async () => {
      const { user } = await render(<TestMenubar />);

      const fileTrigger = screen.getByTestId('file-trigger');

      await user.hover(fileTrigger);

      // The file menu should not be open because no submenu is already open
      expect(screen.queryByTestId('file-menu')).to.equal(null);
    });

    it('should open submenus on hover when another submenu is already open', async () => {
      const { user } = await render(<TestMenubar />);

      // First click to open the file menu
      const fileTrigger = screen.getByTestId('file-trigger');
      await user.click(fileTrigger);

      expect(screen.getByTestId('file-menu')).to.not.equal(null);

      // Now hover over the edit trigger, it should open because a submenu is already open
      expect(screen.getByTestId('edit-trigger')).to.not.equal(null);
      const editTrigger = screen.getByTestId('edit-trigger');

      await user.hover(editTrigger);

      await waitFor(() => {
        expect(screen.queryByTestId('edit-menu')).to.not.equal(null);
      });

      // The file menu should now be closed
      expect(screen.queryByTestId('file-menu')).to.equal(null);

      // Continue hovering to the view trigger
      const viewTrigger = screen.getByTestId('view-trigger');
      await user.hover(viewTrigger);

      await waitFor(() => {
        expect(screen.queryByTestId('view-menu')).to.not.equal(null);
      });

      // The edit menu should now be closed
      expect(screen.queryByTestId('edit-menu')).to.equal(null);
    });

    it('should open nested submenus on hover when parent menu is open', async () => {
      const { user } = await render(<TestMenubar />);

      // First click to open the file menu
      const fileTrigger = screen.getByTestId('file-trigger');
      await user.click(fileTrigger);

      expect(screen.getByTestId('file-menu')).to.not.equal(null);

      // Now hover over the share submenu trigger
      const shareTrigger = screen.getByTestId('share-trigger');
      await user.hover(shareTrigger);

      // The share submenu should open
      await waitFor(() => {
        expect(screen.queryByTestId('share-menu')).to.not.equal(null);
      });
    });
  });

  describe('focus behavior', () => {
    it('focuses a menubar item without immediately opening the menu', async () => {
      const { user } = await render(<TestMenubar />);

      const fileTrigger = screen.getByTestId('file-trigger');

      // Focus the file trigger without clicking or pressing a key
      await act(async () => {
        fileTrigger.focus();
      });

      // Wait to ensure focus alone doesn't cause the menu to open
      expect(screen.queryByTestId('file-menu')).to.equal(null);

      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.queryByTestId('file-menu')).to.not.equal(null);
      });
    });
  });

  describe('keyboard interactions', () => {
    it('should navigate between menubar items with arrow keys', async () => {
      const { user } = await render(<TestMenubar />);

      const fileTrigger = screen.getByTestId('file-trigger');
      const editTrigger = screen.getByTestId('edit-trigger');

      // First focus the file trigger
      await act(async () => {
        fileTrigger.focus();
      });

      // Check that file trigger has focus
      await waitFor(() => {
        expect(fileTrigger).toHaveFocus();
      });

      // Use arrow right to navigate to edit trigger
      await user.keyboard('{ArrowRight}');

      // Wait for the edit trigger to get focus
      await waitFor(() => {
        expect(editTrigger).toHaveFocus();
      });
    });

    it('should open the menu with Space key', async () => {
      const { user } = await render(<TestMenubar />);
      const fileTrigger = screen.getByTestId('file-trigger');

      // Focus the file trigger
      await act(async () => {
        fileTrigger.focus();
      });

      // Press Space key to open menu
      await user.keyboard(' ');

      // Menu should be open
      await waitFor(() => {
        expect(screen.queryByTestId('file-menu')).to.not.equal(null);
      });
    });

    it('should navigate within the menu using arrow keys', async () => {
      const { user } = await render(<TestMenubar />);
      const fileTrigger = screen.getByTestId('file-trigger');

      // Focus and open file menu
      await act(async () => {
        fileTrigger.focus();
      });
      await user.keyboard('{Enter}');

      // File menu should be open
      await waitFor(() => {
        expect(screen.queryByTestId('file-menu')).to.not.equal(null);
      });

      // First item should be focused automatically
      const firstItem = screen.getByTestId('file-item-1');
      await waitFor(() => {
        expect(firstItem).toHaveFocus();
      });

      // Navigate down to second item
      await user.keyboard('{ArrowDown}');
      const secondItem = screen.getByTestId('file-item-2');
      await waitFor(() => {
        expect(secondItem).toHaveFocus();
      });

      // Navigate down to submenu trigger
      await user.keyboard('{ArrowDown}');
      const shareTrigger = screen.getByTestId('share-trigger');
      await waitFor(() => {
        expect(shareTrigger).toHaveFocus();
      });
    });

    it('should open the submenu with right arrow key', async () => {
      const { user } = await render(<TestMenubar />);
      const fileTrigger = screen.getByTestId('file-trigger');

      // Focus and open file menu
      await act(async () => {
        fileTrigger.focus();
      });
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.queryByTestId('file-menu')).to.not.equal(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('file-item-1')).toHaveFocus();
      });

      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(screen.getByTestId('file-item-2')).toHaveFocus();
      });

      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(screen.getByTestId('share-trigger')).toHaveFocus();
      });

      // Arrow right should open submenu
      await user.keyboard('{ArrowRight}');

      // Share submenu should be open
      await waitFor(() => {
        expect(screen.queryByTestId('share-menu')).to.not.equal(null);
      });

      // First submenu item should be focused
      const submenuItem = screen.getByTestId('share-item-1');
      expect(submenuItem).toHaveFocus();
    });

    it('should close the menu with Escape key', async () => {
      const { user } = await render(<TestMenubar />);
      const fileTrigger = screen.getByTestId('file-trigger');

      // Focus and open file menu
      await act(async () => {
        fileTrigger.focus();
      });

      await user.keyboard('{Enter}');

      // Menu should be open
      await waitFor(() => {
        expect(screen.queryByTestId('file-menu')).to.not.equal(null);
      });

      // Press Escape to close
      await user.keyboard('{Escape}');

      // Menu should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('file-menu')).to.equal(null);
      });
    });

    it('should close submenu with left arrow key and return focus to submenu trigger', async () => {
      const { user } = await render(<TestMenubar />);
      const fileTrigger = screen.getByTestId('file-trigger');

      // Focus and open file menu
      await act(async () => {
        fileTrigger.focus();
      });
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.getByTestId('file-item-1')).toHaveFocus();
      });

      // Navigate to submenu trigger
      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(screen.getByTestId('file-item-2')).toHaveFocus();
      });

      await user.keyboard('{ArrowDown}');

      const shareTrigger = screen.getByTestId('share-trigger');
      await waitFor(() => {
        expect(shareTrigger).toHaveFocus();
      });

      // Open submenu
      await user.keyboard('{ArrowRight}');
      await waitFor(() => {
        expect(screen.queryByTestId('share-menu')).to.not.equal(null);
      });

      // Close submenu with left arrow
      await user.keyboard('{ArrowLeft}');

      // Submenu should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('share-menu')).to.equal(null);
      });

      // Focus should return to submenu trigger
      expect(shareTrigger).toHaveFocus();
    });

    it.skipIf(isJSDOM)(
      'should navigate between menus using left/right arrow keys when menus are open',
      async () => {
        const { user } = await render(<TestMenubar />);
        const fileTrigger = screen.getByTestId('file-trigger');

        // Focus and open file menu
        await act(async () => {
          fileTrigger.focus();
        });
        await user.keyboard('{Enter}');

        // File menu should be open
        await waitFor(() => {
          expect(screen.queryByTestId('file-menu')).to.not.equal(null);
        });

        // Navigate right to edit menu
        await user.keyboard('{ArrowRight}');

        // File menu should close, edit menu should open
        await waitFor(() => {
          expect(screen.queryByTestId('file-menu')).to.equal(null);
        });
        await waitFor(() => {
          expect(screen.queryByTestId('edit-menu')).to.not.equal(null);
        });

        // Navigate back to file menu
        await user.keyboard('{ArrowLeft}');

        // Edit menu should close, file menu should open
        await waitFor(() => {
          expect(screen.queryByTestId('edit-menu')).to.equal(null);
        });
        await waitFor(() => {
          expect(screen.queryByTestId('file-menu')).to.not.equal(null);
        });
      },
    );
  });

  describe('mixed mouse and keyboard interactions', () => {
    it('should allow keyboard navigation after opening a menu with mouse click', async () => {
      const { user } = await render(<TestMenubar />);

      // Open the menu with a mouse click
      const fileTrigger = screen.getByTestId('file-trigger');
      await user.click(fileTrigger);

      // Menu should be open
      await waitFor(() => {
        expect(screen.queryByTestId('file-menu')).to.not.equal(null);
      });

      // Navigate with keyboard
      await user.keyboard('{ArrowDown}');
      const firstItem = screen.getByTestId('file-item-1');
      await waitFor(() => {
        expect(firstItem).toHaveFocus();
      });

      // Continue navigation
      await user.keyboard('{ArrowDown}');
      const secondItem = screen.getByTestId('file-item-2');
      await waitFor(() => {
        expect(secondItem).toHaveFocus();
      });
    });

    it('should allow clicking a menu trigger then navigating to another menu with keyboard', async () => {
      const { user } = await render(<TestMenubar />);

      // Open the file menu with a mouse click
      const fileTrigger = screen.getByTestId('file-trigger');
      await user.click(fileTrigger);

      await waitFor(() => {
        expect(screen.queryByTestId('file-menu')).to.not.equal(null);
      });

      // Navigate to edit menu with keyboard
      await user.keyboard('{ArrowRight}');

      // File menu should close, edit menu should open
      await waitFor(() => {
        expect(screen.queryByTestId('file-menu')).to.equal(null);
      });
      await waitFor(() => {
        expect(screen.queryByTestId('edit-menu')).to.not.equal(null);
      });
    });
  });

  describe('prop: loop', () => {
    describe('when loop == true', () => {
      it('should loop around to the first item after the last one', async () => {
        const { user } = await render(<TestMenubar loop />);

        const firstItem = screen.getByTestId('file-trigger');
        await act(async () => {
          firstItem.focus();
        });

        await user.keyboard('{ArrowRight}');
        await user.keyboard('{ArrowRight}');

        const lastItem = screen.getByTestId('view-trigger');
        expect(lastItem).toHaveFocus();

        await user.keyboard('{ArrowRight}');
        expect(firstItem).toHaveFocus();
      });

      it('should loop around to the last item after the first one', async () => {
        const { user } = await render(<TestMenubar loop />);

        const fileTrigger = screen.getByTestId('file-trigger');
        await act(async () => {
          fileTrigger.focus();
        });
        expect(fileTrigger).toHaveFocus();

        await user.keyboard('{ArrowLeft}');
        const lastItem = screen.getByTestId('view-trigger');
        expect(lastItem).toHaveFocus();
      });
    });

    describe('when loop == false', () => {
      it('should stay on the last item when navigating beyond it', async () => {
        const { user } = await render(<TestMenubar loop={false} />);

        const fileTrigger = screen.getByTestId('file-trigger');
        await act(async () => {
          fileTrigger.focus();
        });

        await user.keyboard('{ArrowRight}');
        await waitFor(() => {
          expect(screen.queryByTestId('edit-trigger')).to.not.equal(null);
        });

        await user.keyboard('{ArrowRight}');

        const lastItem = screen.getByTestId('view-trigger');
        await waitFor(() => {
          expect(lastItem).toHaveFocus();
        });

        await user.keyboard('{ArrowRight}');
        await waitFor(() => {
          expect(lastItem).toHaveFocus();
        });
      });

      it('should stay on the first item when navigating before it', async () => {
        const { user } = await render(<TestMenubar loop={false} />);

        const firstItem = screen.getByTestId('file-trigger');
        await act(async () => {
          firstItem.focus();
        });

        await user.keyboard('{ArrowLeft}');
        expect(firstItem).toHaveFocus();
      });
    });
  });
});
