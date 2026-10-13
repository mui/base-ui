import * as React from 'react';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Menu } from '@base-ui/react/menu';
import {
  createRenderer,
  firePointer,
  isJSDOM,
  resetBrowserPointer,
  waitSingleFrame,
} from '#test-utils';

function Test(props: { openOnHover?: boolean; onInputFocus?: () => void }) {
  return (
    <Menu.FilterProvider>
      <Menu.Root>
        <Menu.Trigger openOnHover={props.openOnHover} delay={0}>
          Actions
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Input aria-label="Filter actions" onFocus={props.onInputFocus} />
              <Menu.Empty>No actions found.</Menu.Empty>
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

  // iOS VoiceOver presses with a touch whose contact is under a pixel and carries no pressure.
  function pressLikeIOSVoiceOver(element: HTMLElement) {
    const init = { pointerType: 'touch', width: 0.333, height: 0.333, pressure: 0 };
    firePointer.down(element, { ...init, timeStamp: 10 });
    fireEvent.mouseDown(element, { detail: 1 });
    firePointer.up(element, { ...init, timeStamp: 20 });
    fireEvent.mouseUp(element, { detail: 1 });
    fireEvent.click(element, { detail: 1 });
  }

  it.skipIf(isJSDOM)(
    'focuses a submenu input when a screen reader press opens the submenu',
    async () => {
      await render(
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterProvider>
                  <Menu.SubmenuRoot>
                    <Menu.SubmenuTrigger openOnHover={false}>Move to</Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.Input aria-label="Filter destinations" />
                          <Menu.List>
                            <Menu.Item>Documents</Menu.Item>
                          </Menu.List>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.SubmenuRoot>
                </Menu.FilterProvider>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      pressLikeIOSVoiceOver(screen.getByRole('menuitem', { name: 'Move to' }));

      const input = await screen.findByRole('searchbox', { name: 'Filter destinations' });
      await waitFor(() => expect(input).toHaveFocus());
    },
  );

  it.skipIf(isJSDOM)(
    'does not focus the input when an item is tapped after a touch open',
    async () => {
      const onInputFocus = vi.fn();
      await render(<Test onInputFocus={onInputFocus} />);
      const trigger = screen.getByRole('button', { name: 'Actions' });
      const touch = { pointerType: 'touch' };
      firePointer.down(trigger, { ...touch, timeStamp: 10 });
      fireEvent.mouseDown(trigger, { detail: 1 });
      firePointer.up(trigger, { ...touch, timeStamp: 20 });
      fireEvent.mouseUp(trigger, { detail: 1 });
      fireEvent.click(trigger, { detail: 1 });

      const item = await screen.findByRole('menuitem', { name: 'Rename' });
      await act(() => waitSingleFrame());

      // A tap fires compatibility mouse events, including a `mousemove`, before its `mousedown`.
      firePointer.down(item, { ...touch, timeStamp: 30 });
      firePointer.up(item, { ...touch, timeStamp: 40 });
      fireEvent.mouseOver(item);
      fireEvent.mouseMove(item);
      await act(() => waitSingleFrame());

      expect(screen.getByRole('searchbox', { name: 'Filter actions' })).not.toHaveFocus();
      expect(onInputFocus).not.toHaveBeenCalled();
    },
  );

  it('does not focus the input when opened on hover', async () => {
    const onInputFocus = vi.fn();
    const { user } = await render(<Test openOnHover onInputFocus={onInputFocus} />);

    await user.hover(screen.getByRole('button', { name: 'Actions' }));

    const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
    await act(() => waitSingleFrame());
    expect(input).not.toHaveFocus();
    expect(onInputFocus).not.toHaveBeenCalled();
  });

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
