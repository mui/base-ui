import * as React from 'react';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, firePointer, resetBrowserPointer, waitSingleFrame } from '#test-utils';

function Test(props: { autoFocus?: boolean; openOnHover?: boolean; onInputFocus?: () => void }) {
  return (
    <Menu.FilterProvider>
      <Menu.Root>
        <Menu.Trigger openOnHover={props.openOnHover} delay={0}>
          Actions
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Input
                aria-label="Filter actions"
                autoFocus={props.autoFocus}
                onFocus={props.onInputFocus}
              />
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

  describe.each([false, true])('autoFocus=%s', (autoFocus) => {
    it.each(['mouse', 'touch', 'pen'])('handles opening with %s', async (pointerType) => {
      const onInputFocus = vi.fn();
      await render(<Test autoFocus={autoFocus} onInputFocus={onInputFocus} />);
      const trigger = screen.getByRole('button', { name: 'Actions' });
      await act(async () => trigger.focus());
      firePointer.down(trigger, { pointerType, timeStamp: 10 });
      fireEvent.mouseDown(trigger, { detail: 1 });
      firePointer.up(trigger, { pointerType, timeStamp: 20 });
      fireEvent.mouseUp(trigger, { detail: 1 });
      fireEvent.click(trigger, { detail: 1 });

      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      await act(() => waitSingleFrame());
      const shouldFocus = pointerType === 'mouse' || autoFocus;
      await waitFor(() => expect(input.matches(':focus')).toBe(shouldFocus));
      expect(onInputFocus.mock.calls.length > 0).toBe(shouldFocus);
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('handles opening on hover', async () => {
      const onInputFocus = vi.fn();
      const { user } = await render(
        <Test autoFocus={autoFocus} openOnHover onInputFocus={onInputFocus} />,
      );

      await user.hover(screen.getByRole('button', { name: 'Actions' }));

      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      await act(() => waitSingleFrame());
      await waitFor(() => expect(input.matches(':focus')).toBe(autoFocus));
      expect(onInputFocus.mock.calls.length > 0).toBe(autoFocus);
    });
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
