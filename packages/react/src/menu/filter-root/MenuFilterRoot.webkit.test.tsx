import * as React from 'react';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

// Kept in a separate file so the module mock doesn't leak into `MenuFilterRoot.test.tsx`.
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
    <Menu.FilterProvider>
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Input aria-label="Filter actions" />
              <Menu.List>
                <Menu.Item>Apple</Menu.Item>
                <Menu.Item>Banana</Menu.Item>
              </Menu.List>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menu.FilterProvider>
  );
}

describe('<Menu.FilterProvider><Menu.Root/></Menu.FilterProvider> (WebKit)', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  it('marks only the highlighted item while its input is focused in WebKit', async () => {
    const { user } = await render(<Test />);

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    const apple = screen.getByRole('menuitem', { name: 'Apple' });
    const banana = screen.getByRole('menuitem', { name: 'Banana' });
    expect(apple).not.toHaveAttribute('aria-selected');

    await user.keyboard('[ArrowDown]');

    expect(apple).toHaveAttribute('aria-selected', 'true');
    expect(banana).not.toHaveAttribute('aria-selected');
    expect(input).toHaveAttribute('aria-activedescendant', apple.id);

    await user.keyboard('[ArrowDown]');

    expect(apple).not.toHaveAttribute('aria-selected');
    expect(banana).toHaveAttribute('aria-selected', 'true');

    await act(async () => input.blur());
    expect(banana).not.toHaveAttribute('aria-selected');

    await act(async () => input.focus());
    expect(banana).toHaveAttribute('aria-selected', 'true');
  });

  it('preserves checked state on checkbox and radio items in WebKit', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Input aria-label="Filter actions" />
                <Menu.List>
                  <Menu.CheckboxItem defaultChecked>Details</Menu.CheckboxItem>
                  <Menu.RadioGroup defaultValue="date">
                    <Menu.RadioItem value="date">Date</Menu.RadioItem>
                  </Menu.RadioGroup>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
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

  it('marks highlighted links and submenu triggers while their input is focused in WebKit', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Input aria-label="Filter actions" />
                <Menu.List>
                  <Menu.LinkItem href="#docs">Documentation</Menu.LinkItem>
                  <Menu.FilterProvider>
                    <Menu.SubmenuRoot>
                      <Menu.SubmenuTrigger>More actions</Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner>
                          <Menu.Popup>
                            <Menu.List>
                              <Menu.Item>Share</Menu.Item>
                            </Menu.List>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                  </Menu.FilterProvider>
                  <Menu.SubmenuRoot>
                    <Menu.SubmenuTrigger>Plain submenu</Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.Item>Copy</Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.SubmenuRoot>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    const link = screen.getByRole('menuitem', { name: 'Documentation' });
    const submenuTrigger = screen.getByRole('menuitem', { name: 'More actions' });
    const plainSubmenuTrigger = screen.getByRole('menuitem', { name: 'Plain submenu' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    await user.keyboard('[ArrowDown]');
    expect(link).toHaveAttribute('aria-selected', 'true');
    expect(submenuTrigger).not.toHaveAttribute('aria-selected');
    expect(input).toHaveAttribute('aria-activedescendant', link.id);

    await user.keyboard('[ArrowDown]');
    expect(link).not.toHaveAttribute('aria-selected');
    expect(submenuTrigger).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

    expect(plainSubmenuTrigger).not.toHaveAttribute('aria-selected');
    await user.keyboard('[ArrowDown]');

    expect(submenuTrigger).not.toHaveAttribute('aria-selected');
    expect(plainSubmenuTrigger).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', plainSubmenuTrigger.id);
  });

  it('marks items inside an opened submenu while its input is focused', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Input aria-label="Filter actions" />
                <Menu.List>
                  <Menu.FilterProvider>
                    <Menu.SubmenuRoot>
                      <Menu.SubmenuTrigger>More actions</Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner>
                          <Menu.Popup>
                            <Menu.Input aria-label="Filter more actions" />
                            <Menu.List>
                              <Menu.Item>Share</Menu.Item>
                            </Menu.List>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                  </Menu.FilterProvider>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
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
    const submenuTrigger = screen.getByRole('menuitem', { name: 'More actions' });
    expect(submenuTrigger).not.toHaveAttribute('aria-selected');
    expect(shareItem).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('[ArrowUp]');
    expect(shareItem).not.toHaveAttribute('aria-selected');

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
