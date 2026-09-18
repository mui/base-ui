import * as React from 'react';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, firePointer, resetBrowserPointer } from '#test-utils';

function Test() {
  return (
    <Menu.FilterProvider>
      <Menu.Root>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.FilterInput aria-label="Filter actions" />
              <Menu.FilterEmpty>No actions found.</Menu.FilterEmpty>
              <Menu.List>
                <Menu.Item disabled>Unavailable</Menu.Item>
                <Menu.Item>Rename</Menu.Item>
                <Menu.Item>Delete</Menu.Item>
              </Menu.List>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menu.FilterProvider>
  );
}

describe('filterable menu initial highlight', () => {
  beforeEach(resetBrowserPointer);
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  it('highlights the first enabled action and keeps the input in the arrow loop', async () => {
    const { user } = await render(<Test />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await act(async () => trigger.focus());
    await user.keyboard('[Enter]');

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    const rename = screen.getByRole('menuitem', { name: 'Rename' });
    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
    await waitFor(() => expect(input).toHaveFocus());
    expect(input).toHaveAttribute('aria-activedescendant', rename.id);

    await user.keyboard('[ArrowDown]');
    expect(input).toHaveAttribute('aria-activedescendant', deleteItem.id);
    await user.keyboard('[ArrowDown]');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(input).toHaveAttribute('data-highlighted');

    await user.keyboard('[ArrowUp]');
    expect(input).toHaveAttribute('aria-activedescendant', deleteItem.id);
    await user.keyboard('[ArrowUp][ArrowUp][ArrowUp]');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(input).toHaveFocus();
  });

  it('clears the initial highlight when typing and permits an empty result', async () => {
    const { user } = await render(<Test />);
    await act(async () => screen.getByRole('button', { name: 'Actions' }).focus());
    await user.keyboard('[Enter]');
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => expect(input).toHaveFocus());

    await user.keyboard('Del');
    expect(input).toHaveValue('Del');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);

    await user.keyboard('[ArrowDown]');
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('menuitem', { name: 'Delete' }).id,
    );

    await user.keyboard('x');
    expect(input).toHaveValue('Delx');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(await screen.findByText('No actions found.')).toBeVisible();
    expect(input).toHaveFocus();
  });

  it.each(['mouse', 'touch', 'pen'])(
    'leaves the input active when opened with %s',
    async (pointerType) => {
      await render(<Test />);
      const trigger = screen.getByRole('button', { name: 'Actions' });
      firePointer.down(trigger, { pointerType, timeStamp: 10 });
      fireEvent.mouseDown(trigger, { detail: 1 });
      firePointer.up(trigger, { pointerType, timeStamp: 20 });
      fireEvent.mouseUp(trigger, { detail: 1 });
      fireEvent.click(trigger, { detail: 1 });

      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      await waitFor(() => expect(input).toHaveFocus());
      expect(input).not.toHaveAttribute('aria-activedescendant');
    },
  );

  it('highlights the first action again when reopening', async () => {
    const { user } = await render(<Test />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await act(async () => trigger.focus());
    await user.keyboard('[Enter]');
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => expect(input).toHaveFocus());
    await user.keyboard('[ArrowDown][Escape]');
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.keyboard('[Enter]');

    const reopenedInput = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => expect(reopenedInput).toHaveFocus());
    expect(reopenedInput).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('menuitem', { name: 'Rename' }).id,
    );
  });
});
