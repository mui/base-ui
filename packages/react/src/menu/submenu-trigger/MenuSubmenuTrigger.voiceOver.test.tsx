import * as React from 'react';
import { screen } from '@mui/internal-test-utils';
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

describe('<Menu.SubmenuTrigger /> with VoiceOver', () => {
  const { render } = createRenderer();

  it('does not expose the expanded state while the submenu is open', async () => {
    const { user } = await render(
      <Menu.Root open>
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
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    const submenuTrigger = screen.getByText('More');
    expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(submenuTrigger);
    await screen.findByTestId('submenu');

    expect(submenuTrigger).not.toHaveAttribute('aria-expanded');
    // The submenu is still discoverable through `aria-haspopup`.
    expect(submenuTrigger).toHaveAttribute('aria-haspopup', 'menu');
  });
});
