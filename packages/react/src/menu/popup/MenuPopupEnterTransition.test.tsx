import { expect } from 'vitest';
import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@mui/internal-test-utils';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, isJSDOM } from '#test-utils';

/**
 * Records whether an element ever carries `[data-starting-style]`, which is what drives the enter
 * transition. Polls per frame because the attribute is only present for a single frame.
 */
function trackStartingStyle(testId: string) {
  let seen = false;
  let sampling = true;

  function sample() {
    if (document.querySelector(`[data-testid="${testId}"][data-starting-style]`)) {
      seen = true;
    }
    if (sampling) {
      requestAnimationFrame(sample);
    }
  }
  requestAnimationFrame(sample);

  return {
    stop() {
      sampling = false;
      return seen;
    },
  };
}

describe.skipIf(isJSDOM)('Menu enter transition', () => {
  const { render } = createRenderer();

  it('plays the enter transition for a submenu that is open when its parent opens', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const submenuTracker = trackStartingStyle('submenu-popup');

    await render(
      <Menu.Root>
        <Menu.Trigger>Trigger</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup data-testid="menu-popup">
              <Menu.Item>Item</Menu.Item>
              <Menu.SubmenuRoot defaultOpen>
                <Menu.SubmenuTrigger>Submenu</Menu.SubmenuTrigger>
                <Menu.Portal>
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
      </Menu.Root>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Trigger' }));

    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).not.toBe(null);
    });
    await waitFor(() => {
      expect(submenuTracker.stop()).toBe(true);
    });
  });

  it('does not play the enter transition for a menu that is open on the first render', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const menuTracker = trackStartingStyle('menu-popup');

    await render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Trigger</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup data-testid="menu-popup">
              <Menu.Item>Item</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('menu-popup')).not.toBe(null);
    });

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(menuTracker.stop()).toBe(false);
  });

  it('plays the enter transition for a submenu opened by the user', async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

    const submenuTracker = trackStartingStyle('submenu-popup');

    await render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Trigger</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup data-testid="menu-popup">
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger>Submenu</Menu.SubmenuTrigger>
                <Menu.Portal>
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
      </Menu.Root>,
    );

    await userEvent.click(screen.getByRole('menuitem', { name: 'Submenu' }));

    await waitFor(() => {
      expect(screen.queryByTestId('submenu-popup')).not.toBe(null);
    });
    await waitFor(() => {
      expect(submenuTracker.stop()).toBe(true);
    });
  });
});
