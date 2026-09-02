import * as React from 'react';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { expect, vi, describe, beforeEach, it } from 'vitest';
import { createRenderer, resetBrowserPointer } from '#test-utils';
import { FilterMenu } from '@base-ui/react/filter-menu';

describe('<FilterMenu.List />', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  it('supports navigation when rendered inline without popup parts', async () => {
    const { user } = await render(
      <FilterMenu.Root inline open>
        <FilterMenu.Input aria-label="Filter fruit" />
        <FilterMenu.List data-testid="list">
          <FilterMenu.Item>Apple</FilterMenu.Item>
          <FilterMenu.Item>Banana</FilterMenu.Item>
        </FilterMenu.List>
      </FilterMenu.Root>,
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

  it('keeps virtual focus on the input without making the list tabbable', async () => {
    const { user } = await render(
      <FilterMenu.Root open>
        <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
        <FilterMenu.Portal>
          <FilterMenu.Positioner>
            <FilterMenu.Popup>
              <FilterMenu.Input aria-label="Filter fruit" />
              <FilterMenu.List data-testid="list">
                <FilterMenu.Item>Apple</FilterMenu.Item>
                <FilterMenu.Item>Banana</FilterMenu.Item>
              </FilterMenu.List>
            </FilterMenu.Popup>
          </FilterMenu.Positioner>
        </FilterMenu.Portal>
      </FilterMenu.Root>,
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
        <FilterMenu.Root defaultOpen>
          <FilterMenu.Trigger>Fruit</FilterMenu.Trigger>
          <FilterMenu.Portal>
            <FilterMenu.Positioner>
              <FilterMenu.Popup>
                <FilterMenu.Input aria-label="Filter fruit" />
                <FilterMenu.List data-testid="list">
                  <FilterMenu.Item onClick={props.onPress}>Apple</FilterMenu.Item>
                  <FilterMenu.Item>Banana</FilterMenu.Item>
                </FilterMenu.List>
              </FilterMenu.Popup>
            </FilterMenu.Positioner>
          </FilterMenu.Portal>
        </FilterMenu.Root>
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

  it('ignores Escape and outside clicks when rendered inline', async () => {
    const onOpenChange = vi.fn();
    const { user } = await render(
      <div>
        <button type="button">Outside</button>
        <FilterMenu.Root inline open onOpenChange={onOpenChange}>
          <FilterMenu.Input aria-label="Filter fruit" />
          <FilterMenu.List>
            <FilterMenu.Item>Apple</FilterMenu.Item>
          </FilterMenu.List>
        </FilterMenu.Root>
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
