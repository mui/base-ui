import { expect, vi } from 'vitest';
import { FilterMenu } from '@base-ui/react/filter-menu';
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

describe('<FilterMenu.Root /> with the React 17 id fallback', () => {
  const { renderToString } = createRenderer();

  it('omits partial ids during SSR and wires relationships after hydration', async () => {
    const { hydrate } = renderToString(
      <FilterMenu.Root defaultOpen>
        <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
        <FilterMenu.Portal keepMounted>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.List>
                <FilterMenu.Item>Rename</FilterMenu.Item>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
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
      <FilterMenu.Root defaultOpen>
        <FilterMenu.Trigger>Actions</FilterMenu.Trigger>
        <FilterMenu.Portal keepMounted>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter actions" />
              <FilterMenu.List>
                <FilterMenu.SubmenuRoot>
                  <FilterMenu.SubmenuTrigger>More actions</FilterMenu.SubmenuTrigger>
                  <FilterMenu.Portal keepMounted>
                    <FilterMenu.Positioner>
                      <FilterMenu.Popup>
                        <FilterMenu.Input aria-label="Filter more actions" />
                        <FilterMenu.List>
                          <FilterMenu.Item>Share</FilterMenu.Item>
                        </FilterMenu.List>
                      </FilterMenu.Popup>
                    </FilterMenu.Positioner>
                  </FilterMenu.Portal>
                </FilterMenu.SubmenuRoot>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
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
