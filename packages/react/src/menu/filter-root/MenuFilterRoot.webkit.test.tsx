import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

// Kept in a separate file so the module mock doesn't leak into `FilterMenuRoot.test.tsx`.
vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    platform: {
      ...actual.platform,
      engine: { ...actual.platform.engine, webkit: true },
    },
  };
});

function Test() {
  return (
    <Menu.FilterRoot defaultOpen>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.FilterInput aria-label="Filter actions" />
            <Menu.FilterList>
              <Menu.Item>Apple</Menu.Item>
              <Menu.Item>Banana</Menu.Item>
            </Menu.FilterList>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.FilterRoot>
  );
}

describe('<Menu.FilterRoot /> (WebKit)', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  it('marks the active descendant selected for the WebKit compatibility path', async () => {
    const { user } = await render(<Test />);

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    const apple = screen.getByRole('menuitem', { name: 'Apple' });
    const banana = screen.getByRole('menuitem', { name: 'Banana' });
    expect(apple).toHaveAttribute('aria-selected', 'false');

    await user.keyboard('[ArrowDown]');

    expect(apple).toHaveAttribute('aria-selected', 'true');
    expect(banana).toHaveAttribute('aria-selected', 'false');
    expect(input).toHaveAttribute('aria-activedescendant', apple.id);

    await user.keyboard('[ArrowDown]');

    expect(apple).toHaveAttribute('aria-selected', 'false');
    expect(banana).toHaveAttribute('aria-selected', 'true');
  });

  it('preserves checked state on checkbox and radio items in the WebKit compatibility path', async () => {
    const { user } = await render(
      <Menu.FilterRoot defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.FilterInput aria-label="Filter actions" />
              <Menu.FilterList>
                <Menu.CheckboxItem defaultChecked>Details</Menu.CheckboxItem>
                <Menu.RadioGroup defaultValue="date">
                  <Menu.RadioItem value="date">Date</Menu.RadioItem>
                </Menu.RadioGroup>
              </Menu.FilterList>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.FilterRoot>,
    );

    const checkbox = screen.getByRole('menuitemcheckbox', { name: 'Details' });
    const radio = screen.getByRole('menuitemradio', { name: 'Date' });
    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Filter actions' })).toHaveFocus();
    });

    await user.keyboard('[ArrowDown]');
    expect(checkbox).toHaveAttribute('aria-selected', 'true');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('[ArrowDown]');
    expect(radio).toHaveAttribute('aria-selected', 'true');
    expect(radio).toHaveAttribute('aria-checked', 'true');
  });

  it('marks link items and submenu triggers selected for the WebKit compatibility path', async () => {
    const { user } = await render(
      <Menu.FilterRoot defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.FilterInput aria-label="Filter actions" />
              <Menu.FilterList>
                <Menu.LinkItem href="#docs">Documentation</Menu.LinkItem>
                <Menu.FilterSubmenuRoot>
                  <Menu.SubmenuTrigger>More actions</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.FilterList>
                          <Menu.Item>Share</Menu.Item>
                        </Menu.FilterList>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.FilterSubmenuRoot>
              </Menu.FilterList>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.FilterRoot>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    const link = screen.getByRole('menuitem', { name: 'Documentation' });
    const submenuTrigger = screen.getByRole('menuitem', { name: 'More actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    await user.keyboard('[ArrowDown]');
    expect(link).toHaveAttribute('aria-selected', 'true');
    expect(submenuTrigger).toHaveAttribute('aria-selected', 'false');
    expect(input).toHaveAttribute('aria-activedescendant', link.id);

    await user.keyboard('[ArrowDown]');
    expect(link).toHaveAttribute('aria-selected', 'false');
    expect(submenuTrigger).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', submenuTrigger.id);
  });

  it('marks items inside an opened submenu selected', async () => {
    const { user } = await render(
      <Menu.FilterRoot defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.FilterInput aria-label="Filter actions" />
              <Menu.FilterList>
                <Menu.FilterSubmenuRoot>
                  <Menu.SubmenuTrigger>More actions</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.FilterInput aria-label="Filter more actions" />
                        <Menu.FilterList>
                          <Menu.Item>Share</Menu.Item>
                        </Menu.FilterList>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.FilterSubmenuRoot>
              </Menu.FilterList>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.FilterRoot>,
    );

    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Filter actions' })).toHaveFocus();
    });
    await user.keyboard('[ArrowDown][ArrowRight]');

    const submenuInput = await screen.findByRole('searchbox', { name: 'Filter more actions' });
    await waitFor(() => {
      expect(submenuInput).toHaveFocus();
    });

    const shareItem = screen.getByRole('menuitem', { name: 'Share' });
    expect(shareItem).toHaveAttribute('aria-selected', 'false');

    await user.keyboard('[ArrowDown]');

    expect(shareItem).toHaveAttribute('aria-selected', 'true');
    expect(submenuInput).toHaveAttribute('aria-activedescendant', shareItem.id);
  });

  it('leaves plain menu items alone, which navigate with real focus', async () => {
    await render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>Apple</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    expect(screen.getByRole('menuitem', { name: 'Apple' })).not.toHaveAttribute('aria-selected');
  });
});
