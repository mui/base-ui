import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Menu } from '@base-ui/react/menu';
import { createRenderer } from '#test-utils';

describe('<Menu.Popup /> filter input focus', () => {
  const { render } = createRenderer();

  function renderFilterMenu() {
    return render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Input aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Group>
                    <Menu.GroupLabel>Edit</Menu.GroupLabel>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.Group>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );
  }

  it('returns focus to the input when the list takes it from the input', async () => {
    await renderFilterMenu();

    const input = screen.getByRole('searchbox');
    await act(async () => input.focus());
    // A press on a group or its label focuses the list, the nearest focusable ancestor.
    await act(async () => screen.getByRole('menu').focus());

    expect(input).toHaveFocus();
  });

  it('leaves focus on the list when the input did not have it', async () => {
    await renderFilterMenu();

    const list = screen.getByRole('menu');
    // A touch open leaves the input unfocused so the on-screen keyboard stays closed.
    await act(async () => screen.getByRole('searchbox').blur());
    await act(async () => list.focus());

    expect(list).toHaveFocus();
  });

  it.each([
    ['vertical', 'ltr', 'ArrowLeft'],
    ['vertical', 'rtl', 'ArrowRight'],
    ['horizontal', 'ltr', 'ArrowUp'],
    ['horizontal', 'rtl', 'ArrowUp'],
  ] as const)('returns focus with the %s %s close key', async (orientation, direction, key) => {
    await render(
      <DirectionProvider direction={direction}>
        <Menu.FilterProvider>
          <Menu.Root defaultOpen orientation={orientation}>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Input aria-label="Filter actions" />
                  <button type="button">Extra action</button>
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      </DirectionProvider>,
    );

    const action = screen.getByRole('button', { name: 'Extra action' });
    await act(async () => action.focus());
    expect(action).toHaveFocus();
    fireEvent.keyDown(action, { key });
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });
});
