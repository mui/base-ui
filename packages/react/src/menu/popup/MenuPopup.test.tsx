import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, describeConformance, popupFocusPropsTests, wait } from '#test-utils';
import { act, fireEvent, waitFor, screen } from '@mui/internal-test-utils';
import { ToolbarRootContext } from '../../toolbar/root/ToolbarRootContext';

describe('<Menu.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.Popup />, () => ({
    render: (node) => {
      return render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>{node}</Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  it('throws when rendered outside Menu.Positioner', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Menu.Root open>
            <Menu.Popup />
          </Menu.Root>,
        ),
      ).rejects.toThrow(
        'Base UI: MenuPositionerContext is missing. MenuPositioner parts must be placed within <Menu.Positioner>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('uses an aria-label instead of the trigger label', async () => {
    await render(
      <Menu.Root open>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup aria-label="Commands" />
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    const popup = screen.getByRole('menu', { name: 'Commands' });
    expect(popup).not.toHaveAttribute('aria-labelledby');
  });

  it('uses aria-labelledby from a render element', async () => {
    await render(
      <Menu.Root open>
        <span id="commands-label">Commands</span>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup render={<section aria-labelledby="commands-label" />} />
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    expect(screen.getByRole('menu', { name: 'Commands' })).toHaveAttribute(
      'aria-labelledby',
      'commands-label',
    );
  });

  it('stops toolbar navigation keys without blocking ordinary key events', async () => {
    const onParentKeyDown = vi.fn();

    await render(
      <ToolbarRootContext.Provider value={{ disabled: false, orientation: 'horizontal' }}>
        <div onKeyDown={onParentKeyDown}>
          <Menu.Root>
            <Menu.Portal keepMounted>
              <Menu.Positioner>
                <Menu.Popup data-testid="popup" />
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </ToolbarRootContext.Provider>,
    );

    const popup = screen.getByTestId('popup');
    fireEvent(
      popup,
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }),
    );
    expect(onParentKeyDown).not.toHaveBeenCalled();

    fireEvent(popup, new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'F1' }));
    expect(onParentKeyDown).toHaveBeenCalled();
    expect(onParentKeyDown.mock.calls.every(([event]) => event.key === 'F1')).toBe(true);
  });

  it('enters the items at the list boundary when an arrow key leaves custom popup content', async () => {
    const { user } = await render(
      <Menu.Root>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <button type="button">Custom</button>
              <Menu.Item>One</Menu.Item>
              <Menu.Item>Two</Menu.Item>
              <Menu.Item>Three</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));
    const one = await screen.findByRole('menuitem', { name: 'One' });
    await act(async () => one.focus());
    await user.keyboard('[ArrowDown]');
    // Mid-list, so continuing from the highlight would reach Three instead.
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Two' })).toHaveFocus());

    await act(async () => screen.getByRole('button', { name: 'Custom' }).focus());
    await user.keyboard('[ArrowDown]');

    await waitFor(() => expect(one).toHaveFocus());
  });

  it('moves focus into the items when the boundary item is already highlighted', async () => {
    const { user } = await render(
      <Menu.Root>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <a href="#profile">Profile</a>
              <Menu.Item>One</Menu.Item>
              <Menu.Item>Two</Menu.Item>
              <Menu.Item>Three</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await act(async () => screen.getByRole('button', { name: 'Open' }).focus());
    await user.keyboard('[Enter]');

    const one = await screen.findByRole('menuitem', { name: 'One' });
    await waitFor(() => expect(one).toHaveAttribute('data-highlighted'));
    await act(async () => screen.getByRole('link', { name: 'Profile' }).focus());
    expect(one).toHaveAttribute('data-highlighted');

    await user.keyboard('[ArrowDown]');
    await waitFor(() => expect(one).toHaveFocus());

    await user.keyboard('[ArrowDown]');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Two' })).toHaveFocus());
  });

  it('moves focus into the items when the last item is already highlighted', async () => {
    const { user } = await render(
      <Menu.Root>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <a href="#profile">Profile</a>
              <Menu.Item>One</Menu.Item>
              <Menu.Item>Two</Menu.Item>
              <Menu.Item>Three</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await act(async () => screen.getByRole('button', { name: 'Open' }).focus());
    await user.keyboard('[ArrowUp]');

    const three = await screen.findByRole('menuitem', { name: 'Three' });
    await waitFor(() => expect(three).toHaveAttribute('data-highlighted'));
    await act(async () => screen.getByRole('link', { name: 'Profile' }).focus());
    expect(three).toHaveAttribute('data-highlighted');

    await user.keyboard('[ArrowUp]');
    await waitFor(() => expect(three).toHaveFocus());

    await user.keyboard('[ArrowUp]');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Two' })).toHaveFocus());
  });

  popupFocusPropsTests({
    render,
    initialFocus: false,
    createComponent: ({ children, finalFocus }) => (
      <Menu.Root>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup finalFocus={finalFocus}>
              {children}
              <Menu.Item>Close</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ),
  });

  describe('prop: finalFocus', () => {
    it('receives the interaction type of the item press that closed the menu', async () => {
      const finalFocus = vi.fn(() => true);

      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup finalFocus={finalFocus}>
                <Menu.Item>Close</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByText('Open');

      await user.click(trigger);
      const item = await screen.findByText('Close');
      fireEvent.pointerDown(item, { pointerType: 'mouse' });
      fireEvent.click(item, { detail: 1 });
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
      expect(finalFocus).toHaveBeenLastCalledWith('mouse');

      await user.keyboard('{Enter}');
      await screen.findByText('Close');
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
      expect(finalFocus).toHaveBeenLastCalledWith('keyboard');
    });

    it('receives the mouse interaction type after a drag-release item selection', async () => {
      const finalFocus = vi.fn(() => true);

      await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup finalFocus={finalFocus}>
                <Menu.Item>Close</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByText('Open');
      fireEvent.mouseDown(trigger);
      const item = await screen.findByText('Close');

      // Drag-release selection is only armed 200ms after the trigger press.
      await act(() => wait(200));
      fireEvent.mouseUp(item);

      await waitFor(() => {
        expect(screen.queryByText('Close')).toBe(null);
      });
      expect(finalFocus).toHaveBeenLastCalledWith('mouse');
    });
  });

  describe('data-instant', () => {
    function NestedMenu(props: { keepSubmenuMounted?: boolean }) {
      return (
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup data-testid="popup">
                <Menu.Item>Item</Menu.Item>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger data-testid="submenu-trigger">More</Menu.SubmenuTrigger>
                  <Menu.Portal keepMounted={props.keepSubmenuMounted}>
                    <Menu.Positioner>
                      <Menu.Popup data-testid="submenu-popup">
                        <Menu.Item>Sub item</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    it('is absent when the menu is opened with a mouse click', async () => {
      const { user } = await render(<NestedMenu />);

      await user.click(screen.getByRole('button', { name: 'Open' }));

      const popup = await screen.findByTestId('popup');
      expect(popup).not.toHaveAttribute('data-instant');
    });

    it('is "navigation" when the menu is opened with an arrow key', async () => {
      const { user } = await render(<NestedMenu />);

      const trigger = screen.getByRole('button', { name: 'Open' });
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('[ArrowDown]');

      const popup = await screen.findByTestId('popup');
      expect(popup).toHaveAttribute('data-instant', 'navigation');
    });

    it('is "navigation" when a submenu is opened with an arrow key', async () => {
      const { user } = await render(<NestedMenu />);

      await user.click(screen.getByRole('button', { name: 'Open' }));
      const submenuTrigger = await screen.findByTestId('submenu-trigger');
      await user.keyboard('[ArrowDown]');
      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(submenuTrigger).toHaveFocus();
      });

      await user.keyboard('[ArrowRight]');

      const submenuPopup = await screen.findByTestId('submenu-popup');
      expect(submenuPopup).toHaveAttribute('data-instant', 'navigation');
    });

    it('is "navigation" when a submenu is closed with an arrow key', async () => {
      const { user } = await render(<NestedMenu keepSubmenuMounted />);

      await user.click(screen.getByRole('button', { name: 'Open' }));
      const submenuTrigger = await screen.findByTestId('submenu-trigger');
      await user.keyboard('[ArrowDown]');
      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(submenuTrigger).toHaveFocus();
      });

      // Open with Enter so the close is what produces the navigation value.
      await user.keyboard('[Enter]');
      const submenuPopup = screen.getByTestId('submenu-popup');
      await waitFor(() => {
        expect(submenuPopup).toHaveAttribute('data-open');
      });
      expect(submenuPopup).toHaveAttribute('data-instant', 'click');

      await user.keyboard('[ArrowLeft]');

      await waitFor(() => {
        expect(submenuPopup).toHaveAttribute('data-closed');
      });
      expect(submenuPopup).toHaveAttribute('data-instant', 'navigation');
    });
  });
});
