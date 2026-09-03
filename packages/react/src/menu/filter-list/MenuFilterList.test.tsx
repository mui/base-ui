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

  it('supports navigation when rendered inline without popup parts', async () => {
    const { user } = await render(
      <Menu.FilterRoot inline open>
        <Menu.FilterInput aria-label="Filter fruit" />
        <Menu.FilterList data-testid="list">
          <Menu.Item>Apple</Menu.Item>
          <Menu.Item>Banana</Menu.Item>
        </Menu.FilterList>
      </Menu.FilterRoot>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
    const list = screen.getByTestId('list');
    const apple = screen.getByRole('menuitem', { name: 'Apple' });
    const banana = screen.getByRole('menuitem', { name: 'Banana' });

    await user.click(input);
    await user.keyboard('[ArrowDown]');

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-activedescendant', apple.id);
    });
    expect(input).toHaveAttribute('aria-controls', list.id);
    expect(apple).toHaveAttribute('data-highlighted', '');

    await user.hover(banana);

    await waitFor(() => {
      expect(banana).toHaveAttribute('data-highlighted', '');
    });
  });

  it('ignores Escape and outside clicks when rendered inline', async () => {
    const onOpenChange = vi.fn();
    const { user } = await render(
      <div>
        <button type="button">Outside</button>
        <Menu.FilterRoot inline open onOpenChange={onOpenChange}>
          <Menu.FilterInput aria-label="Filter fruit" />
          <Menu.FilterList>
            <Menu.Item>Apple</Menu.Item>
          </Menu.FilterList>
        </Menu.FilterRoot>
      </div>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
    await user.click(input);
    await user.keyboard('[Escape]');
    await user.click(screen.getByRole('button', { name: 'Outside' }));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('menuitem', { name: 'Apple' })).toBeVisible();
  });
});
