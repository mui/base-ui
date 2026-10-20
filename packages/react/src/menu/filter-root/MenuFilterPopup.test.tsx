import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Menu } from '@base-ui/react/menu';
import { createRenderer } from '#test-utils';

describe('<Menu.Popup /> filter input focus', () => {
  const { render } = createRenderer();

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
