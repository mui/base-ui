import * as React from 'react';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { Menu } from '@base-ui/react/menu';

describe('<Menu.FilterList />', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  it('keeps virtual focus on the input without making the list tabbable', async () => {
    const { user } = await render(
      <Menu.FilterRoot open>
        <Menu.Trigger>Fruit</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.FilterInput aria-label="Filter fruit" />
              <Menu.FilterList data-testid="list">
                <Menu.Item>Apple</Menu.Item>
                <Menu.Item>Banana</Menu.Item>
              </Menu.FilterList>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.FilterRoot>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
    const list = screen.getByTestId('list');
    const apple = screen.getByRole('menuitem', { name: 'Apple' });

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    expect(list).not.toHaveAttribute('aria-hidden');
    expect(list).toHaveAttribute('tabindex', '-1');
    expect(apple).toHaveAttribute('tabindex', '-1');
    expect(apple).not.toHaveAttribute('aria-expanded');

    await user.keyboard('[ArrowDown]');
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-activedescendant', apple.id);
    });
    expect(input).toHaveFocus();
  });

  describe('keys on a focused list', () => {
    function App(props: { onPress?: (() => void) | undefined }) {
      return (
        <Menu.FilterRoot defaultOpen>
          <Menu.Trigger>Fruit</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter fruit" />
                <Menu.FilterList data-testid="list">
                  <Menu.Item onClick={props.onPress}>Apple</Menu.Item>
                  <Menu.Item>Banana</Menu.Item>
                </Menu.FilterList>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.FilterRoot>
      );
    }

    it('replays navigation keys on the input instead of scrolling', async () => {
      await render(<App />);

      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
      const list = screen.getByTestId('list');
      const apple = screen.getByRole('menuitem', { name: 'Apple' });

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await act(async () => {
        list.focus();
      });
      expect(list).toHaveFocus();

      const scrolls = fireEvent.keyDown(list, { key: 'ArrowDown' });

      expect(scrolls).toBe(false);
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-activedescendant', apple.id);
      });
      expect(input).toHaveFocus();
    });

    it('commits the highlighted item when Enter lands on the list', async () => {
      const onPress = vi.fn();
      const { user } = await render(<App onPress={onPress} />);

      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
      const list = screen.getByTestId('list');
      const apple = screen.getByRole('menuitem', { name: 'Apple' });

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-activedescendant', apple.id);
      });

      await act(async () => {
        list.focus();
      });
      fireEvent.keyDown(list, { key: 'Enter' });

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('still closes the menu with Escape', async () => {
      await render(<App />);

      const list = screen.getByTestId('list');

      await waitFor(() => {
        expect(screen.getByRole('searchbox', { name: 'Filter fruit' })).toHaveFocus();
      });
      await act(async () => {
        list.focus();
      });
      fireEvent.keyDown(list, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });
    });

    it('hands typing keys back to the input', async () => {
      await render(<App />);

      const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
      const list = screen.getByTestId('list');

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await act(async () => {
        list.focus();
      });

      const types = fireEvent.keyDown(list, { key: 'z' });

      // Not canceled, so the native default action types into the refocused input.
      expect(types).toBe(true);
      expect(input).toHaveFocus();
    });
  });
});
