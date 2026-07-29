import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { vi, describe, it, expect } from 'vitest';
import { createRenderer } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

// Kept in a separate file so the module mock doesn't leak into `MenuSubmenuTrigger.test.tsx`.
vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    platform: {
      ...actual.platform,
      screenReader: { ...actual.platform.screenReader, voiceOver: true },
    },
  };
});

function Test() {
  return (
    <Menu.Root>
      <Menu.Trigger>Open menu</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger>More</Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup data-testid="submenu">
                    <Menu.Item>Alpha</Menu.Item>
                    <Menu.Item>Beta</Menu.Item>
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

describe('<Menu.SubmenuTrigger /> with VoiceOver', () => {
  const { render } = createRenderer();

  it('omits the expanded state when the submenu is opened with ArrowRight', async () => {
    const { user } = await render(<Test />);

    await user.keyboard('[Tab]');
    await user.keyboard('[Enter]');

    const submenuTrigger = await screen.findByRole('menuitem', { name: 'More' });
    await waitFor(() => {
      expect(submenuTrigger).toHaveFocus();
    });
    expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('[ArrowRight]');

    await screen.findByTestId('submenu');
    // Focus moves into the submenu; this is the announcement VoiceOver must not talk over.
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Alpha' })).toHaveFocus();
    });

    expect(submenuTrigger).not.toHaveAttribute('aria-expanded');
    // The submenu is still discoverable through `aria-haspopup`.
    expect(submenuTrigger).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('omits the expanded state when the submenu is opened with Enter', async () => {
    const { user } = await render(<Test />);

    await user.keyboard('[Tab]');
    await user.keyboard('[Enter]');

    const submenuTrigger = await screen.findByRole('menuitem', { name: 'More' });
    await waitFor(() => {
      expect(submenuTrigger).toHaveFocus();
    });

    await user.keyboard('[Enter]');

    await screen.findByTestId('submenu');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Alpha' })).toHaveFocus();
    });

    expect(submenuTrigger).not.toHaveAttribute('aria-expanded');
  });

  it('keeps the expanded state when the submenu is opened with a pointer', async () => {
    const { user } = await render(<Test />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const submenuTrigger = await screen.findByRole('menuitem', { name: 'More' });
    await user.click(submenuTrigger);

    await screen.findByTestId('submenu');

    // Focus stays on the trigger, so there is no item announcement to talk over.
    expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
  });
});
