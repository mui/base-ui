import { expect, vi, describe, it } from 'vitest';
import { Menu } from '@base-ui/react/menu';
import { screen, waitFor } from '@mui/internal-test-utils';
import userEvent from '@testing-library/user-event';
import { createRenderer } from '#test-utils';

vi.mock('@base-ui/utils/safeReact', async (importOriginal) => {
  const original = await importOriginal<typeof import('@base-ui/utils/safeReact')>();

  return {
    SafeReact: {
      ...original.SafeReact,
      captureOwnerStack: undefined,
      useId: undefined,
    },
  };
});

describe('<Menu.FilterProvider><Menu.Root/></Menu.FilterProvider> with the React 17 id fallback', () => {
  const { renderToString } = createRenderer();

  it('omits partial ids during SSR and wires relationships after hydration', async () => {
    const { hydrate } = renderToString(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal keepMounted>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.FilterList>
                  <Menu.Item>Rename</Menu.Item>
                </Menu.FilterList>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    expect(document.querySelector('[id*="undefined"]')).toBe(null);

    hydrate();

    const trigger = screen.getByRole('button', { name: 'Actions' });
    const popup = screen.getByRole('dialog');
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    const list = screen.getByRole('menu');
    const item = screen.getByRole('menuitem', { name: 'Rename' });

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-controls', popup.id);
    });
    expect(input).toHaveAttribute('aria-controls', list.id);
    // Ids come from the fallback counter, which proves `React.useId` really is unavailable here.
    expect(item.id).toMatch(/^base-ui-\d+/);
  });

  it('registers a submenu trigger after fallback ids resolve', async () => {
    const { hydrate } = renderToString(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal keepMounted>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.FilterList>
                  <Menu.FilterProvider>
                    <Menu.SubmenuRoot>
                      <Menu.SubmenuTrigger>More actions</Menu.SubmenuTrigger>
                      <Menu.Portal keepMounted>
                        <Menu.Positioner>
                          <Menu.Popup>
                            <Menu.FilterInput aria-label="Filter more actions" />
                            <Menu.FilterList>
                              <Menu.Item>Share</Menu.Item>
                            </Menu.FilterList>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.SubmenuRoot>
                  </Menu.FilterProvider>
                </Menu.FilterList>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    hydrate();
    const user = userEvent.setup();
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    await user.keyboard('[ArrowDown][ArrowRight]');

    const trigger = screen.getByRole('menuitem', { name: 'More actions' });
    const popup = await screen.findByRole('dialog', { name: 'More actions' });
    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Filter more actions' })).toHaveFocus();
    });
    expect(trigger.id).toMatch(/^base-ui-\d+/);
    expect(trigger).toHaveAttribute('aria-controls', popup.id);
  });
});
