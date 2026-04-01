import { expect, vi } from 'vitest';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

describe('<Listbox.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describe('prop: defaultValue', () => {
    it('should select the item by default', async () => {
      await render(
        <Listbox.Root defaultValue={['b']}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'a' })).not.toHaveAttribute('data-selected');
    });
  });

  describe('prop: value (controlled)', () => {
    it('should select the item matching the value', async () => {
      await render(
        <Listbox.Root value={['a']}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-selected', '');
    });
  });

  describe('prop: onValueChange', () => {
    it('should call onValueChange when an item is clicked', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      fireEvent.click(screen.getByRole('option', { name: 'b' }));

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['b']);
    });
  });

  describe('single selection', () => {
    it('should select an item on click and deselect previous', async () => {
      function TestComponent() {
        const [value, setValue] = React.useState<string[]>(['a']);
        return (
          <Listbox.Root value={value} onValueChange={(v) => setValue(v)}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
        );
      }

      await render(<TestComponent />);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-selected', '');

      fireEvent.click(screen.getByRole('option', { name: 'b' }));

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'a' })).not.toHaveAttribute('data-selected');
    });
  });

  describe('multiple selection', () => {
    it('should toggle items on click', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root
          selectionMode="multiple"
          defaultValue={['a']}
          onValueChange={handleValueChange}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-selected', '');

      // Add item b
      fireEvent.click(screen.getByRole('option', { name: 'b' }));

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      const firstCallValue = handleValueChange.mock.calls[0][0];
      expect(firstCallValue).toEqual(['a', 'b']);

      // Toggle item a off
      fireEvent.click(screen.getByRole('option', { name: 'a' }));

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      const secondCallValue = handleValueChange.mock.calls[1][0];
      expect(secondCallValue).toEqual(['b']);
    });
  });

  describe('explicit multiple selection', () => {
    it('should replace the selection on plain click', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root
          selectionMode="explicit-multiple"
          defaultValue={['a', 'b']}
          onValueChange={handleValueChange}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      fireEvent.click(screen.getByRole('option', { name: 'c' }));

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['c']);
    });

    it('should toggle items on Ctrl/Cmd+Click', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root
          selectionMode="explicit-multiple"
          defaultValue={['a', 'b']}
          onValueChange={handleValueChange}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const itemC = screen.getByRole('option', { name: 'c' });

      fireEvent.click(itemC, { ctrlKey: true });
      fireEvent.click(itemC, { metaKey: true });

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
      expect(handleValueChange.mock.calls[1][0]).toEqual(['a', 'b']);
    });

    it('should replace the selection on touch tap', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root
          selectionMode="explicit-multiple"
          defaultValue={['a', 'b']}
          onValueChange={handleValueChange}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const itemC = screen.getByRole('option', { name: 'c' });
      fireEvent.pointerDown(itemC, { pointerType: 'touch' });
      fireEvent.click(itemC);

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['c']);
    });
  });

  describe('ARIA attributes', () => {
    it('should render role="listbox" on the list', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should render role="option" on items', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('option', { name: 'a' })).toBeInTheDocument();
    });

    it('should set aria-multiselectable when multiple', async () => {
      await render(
        <Listbox.Root selectionMode="multiple">
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('should set aria-selected on selected items', async () => {
      await render(
        <Listbox.Root defaultValue={['a']}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('aria-selected', 'false');
    });

    it('should set aria-orientation', async () => {
      await render(
        <Listbox.Root orientation="horizontal">
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-orientation', 'horizontal');
    });
  });

  describe('keyboard navigation', () => {
    it('should move highlight with arrow keys', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');

      list.focus();

      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      expect(itemB).toHaveAttribute('data-highlighted', '');
    });

    it('should select item with Enter key', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      list.focus();

      // Navigate to item b
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      fireEvent.keyDown(itemB, { key: 'Enter' });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledWith(['b'], expect.anything());
    });

    it('should select item with Space key', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      list.focus();

      // Navigate to item b
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      fireEvent.keyDown(itemB, { key: ' ' });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledWith(['b'], expect.anything());
    });
  });

  describe('multi-select keyboard navigation', () => {
    it('Space toggles the selection state of the focused option', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root selectionMode="multiple" defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const itemA = screen.getByRole('option', { name: 'a' });
      fireEvent.click(itemA);

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a']);

      // Toggle off
      fireEvent.click(itemA);

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[1][0]).toEqual([]);
    });

    it('Space works reliably on consecutive presses', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root selectionMode="multiple" defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      // Navigate to item a
      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });

      // First Space selects b
      fireEvent.keyDown(itemB, { key: ' ' });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['b']);

      // Second Space deselects b (should not be blocked by typeahead)
      fireEvent.keyDown(itemB, { key: ' ' });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[1][0]).toEqual([]);
    });

    it('Shift+ArrowDown moves focus and toggles selection of the next option', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root
          selectionMode="multiple"
          defaultValue={['a', 'b']}
          onValueChange={handleValueChange}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      // ArrowDown from list moves to index 1 (item b)
      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });

      // Item b is focused; Shift+ArrowDown should toggle c
      fireEvent.keyDown(itemB, { key: 'ArrowDown', shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
    });

    it('Shift+ArrowUp moves focus and toggles selection of the previous option', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root
          selectionMode="multiple"
          defaultValue={['c']}
          onValueChange={handleValueChange}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      // Focus list then navigate to last item
      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'End' });

      await flushMicrotasks();

      const itemC = screen.getByRole('option', { name: 'c' });

      // Now item c is focused; Shift+ArrowUp should toggle b
      fireEvent.keyDown(itemC, { key: 'ArrowUp', shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['c', 'b']);
    });

    it('Shift+Space selects contiguous items from most recently selected to focused', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root selectionMode="multiple" defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      // Click item a to select it (sets lastSelectedIndex)
      fireEvent.click(screen.getByRole('option', { name: 'a' }));

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a']);

      // Shift+Click on item d for range selection a through d
      const itemD = screen.getByRole('option', { name: 'd' });
      fireEvent.click(itemD, { shiftKey: true });

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[1][0]).toEqual(['a', 'b', 'c', 'd']);
    });

    it('Ctrl+Shift+Home selects focused option and all options up to the first', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root selectionMode="multiple" defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      // ArrowDown from list goes to index 1, then ArrowDown to index 2 (item c)
      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      fireEvent.keyDown(itemB, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemC = screen.getByRole('option', { name: 'c' });

      // Item c is now focused; Ctrl+Shift+Home: select a, b, c
      fireEvent.keyDown(itemC, { key: 'Home', ctrlKey: true, shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
    });

    it('Ctrl+Shift+End selects focused option and all options down to the last', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root selectionMode="multiple" defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      // ArrowDown from list goes to index 1 (item b)
      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });

      // Item b is now focused; Ctrl+Shift+End: select b, c, d
      fireEvent.keyDown(itemB, { key: 'End', ctrlKey: true, shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'c', 'd']);
    });

    it('Ctrl+A selects all options', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root selectionMode="multiple" defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'a', ctrlKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
    });

    it('Ctrl+A deselects all when all are selected', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root
          selectionMode="multiple"
          defaultValue={['a', 'b', 'c']}
          onValueChange={handleValueChange}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'a', ctrlKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual([]);
    });

    it('Ctrl+A ignores disabled options', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root selectionMode="multiple" defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'a', ctrlKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'c']);
    });

    it('Ctrl+Shift+Home ignores disabled options in the selected range', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root selectionMode="multiple" defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemC = screen.getByRole('option', { name: 'c' });
      fireEvent.keyDown(itemC, { key: 'Home', ctrlKey: true, shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'c']);
    });

    it('Shift+ArrowDown adds already selected item without duplicating', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root
          selectionMode="multiple"
          defaultValue={['a', 'b']}
          onValueChange={handleValueChange}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      // ArrowDown from list goes to index 1 (item b)
      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      // Item b is focused; Shift+ArrowDown adds c to selection
      fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
        key: 'ArrowDown',
        shiftKey: true,
      });

      await flushMicrotasks();

      // c was added, existing selections preserved
      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
    });

    it('Shift+ArrowDown skips disabled options', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root
          selectionMode="multiple"
          defaultValue={['a']}
          onValueChange={handleValueChange}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'Home' });

      await flushMicrotasks();

      fireEvent.keyDown(list, { key: 'ArrowDown', shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).not.toHaveBeenCalled();
    });

    it('Meta+A (Cmd+A) selects all options', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root selectionMode="multiple" defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'a', metaKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
    });

    it('Ctrl+Shift+Home preserves existing selections outside the range', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root
          selectionMode="multiple"
          defaultValue={['d']}
          onValueChange={handleValueChange}
        >
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      // Navigate to item c: ArrowDown from list → b (index 1), ArrowDown → c (index 2)
      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), { key: 'ArrowDown' });

      await flushMicrotasks();

      // Ctrl+Shift+Home: select a, b, c; d should remain selected
      fireEvent.keyDown(screen.getByRole('option', { name: 'c' }), {
        key: 'Home',
        ctrlKey: true,
        shiftKey: true,
      });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['d', 'a', 'b', 'c']);
    });

    describe('horizontal orientation', () => {
      it('Shift+ArrowRight selects the next option', async () => {
        const handleValueChange = vi.fn();

        await render(
          <Listbox.Root
            selectionMode="multiple"
            orientation="horizontal"
            defaultValue={[]}
            onValueChange={handleValueChange}
          >
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>,
        );

        await flushMicrotasks();

        const list = screen.getByRole('listbox');
        list.focus();
        fireEvent.keyDown(list, { key: 'ArrowRight' });

        await flushMicrotasks();

        // Item b is now focused; Shift+ArrowRight toggles c
        fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
          key: 'ArrowRight',
          shiftKey: true,
        });

        await flushMicrotasks();

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange.mock.calls[0][0]).toEqual(['c']);
      });

      it('Shift+ArrowLeft selects the previous option', async () => {
        const handleValueChange = vi.fn();

        await render(
          <Listbox.Root
            selectionMode="multiple"
            orientation="horizontal"
            defaultValue={[]}
            onValueChange={handleValueChange}
          >
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>,
        );

        await flushMicrotasks();

        const list = screen.getByRole('listbox');
        list.focus();
        fireEvent.keyDown(list, { key: 'ArrowRight' });

        await flushMicrotasks();

        // Item b is now focused; Shift+ArrowLeft toggles a
        fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
          key: 'ArrowLeft',
          shiftKey: true,
        });

        await flushMicrotasks();

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange.mock.calls[0][0]).toEqual(['a']);
      });

      it('Shift+ArrowDown does not select in horizontal orientation', async () => {
        const handleValueChange = vi.fn();

        await render(
          <Listbox.Root
            selectionMode="multiple"
            orientation="horizontal"
            defaultValue={[]}
            onValueChange={handleValueChange}
          >
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>,
        );

        await flushMicrotasks();

        const list = screen.getByRole('listbox');
        list.focus();
        fireEvent.keyDown(list, { key: 'ArrowRight' });

        await flushMicrotasks();

        // Item b is now focused; Shift+ArrowDown should not trigger selection
        fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
          key: 'ArrowDown',
          shiftKey: true,
        });

        await flushMicrotasks();

        expect(handleValueChange).not.toHaveBeenCalled();
      });
    });

    describe('horizontal RTL orientation', () => {
      it('Shift+ArrowLeft selects the next option in RTL', async () => {
        const handleValueChange = vi.fn();

        await render(
          <DirectionProvider direction="rtl">
            <Listbox.Root
              selectionMode="multiple"
              orientation="horizontal"
              defaultValue={[]}
              onValueChange={handleValueChange}
            >
              <Listbox.List>
                <Listbox.Item value="a">a</Listbox.Item>
                <Listbox.Item value="b">b</Listbox.Item>
                <Listbox.Item value="c">c</Listbox.Item>
              </Listbox.List>
            </Listbox.Root>
          </DirectionProvider>,
        );

        await flushMicrotasks();

        const list = screen.getByRole('listbox');
        list.focus();
        // In RTL, ArrowLeft moves forward (next)
        fireEvent.keyDown(list, { key: 'ArrowLeft' });

        await flushMicrotasks();

        // Item b is now focused; Shift+ArrowLeft toggles c (next in RTL)
        fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
          key: 'ArrowLeft',
          shiftKey: true,
        });

        await flushMicrotasks();

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange.mock.calls[0][0]).toEqual(['c']);
      });

      it('Shift+ArrowRight selects the previous option in RTL', async () => {
        const handleValueChange = vi.fn();

        await render(
          <DirectionProvider direction="rtl">
            <Listbox.Root
              selectionMode="multiple"
              orientation="horizontal"
              defaultValue={[]}
              onValueChange={handleValueChange}
            >
              <Listbox.List>
                <Listbox.Item value="a">a</Listbox.Item>
                <Listbox.Item value="b">b</Listbox.Item>
                <Listbox.Item value="c">c</Listbox.Item>
              </Listbox.List>
            </Listbox.Root>
          </DirectionProvider>,
        );

        await flushMicrotasks();

        const list = screen.getByRole('listbox');
        list.focus();
        // In RTL, ArrowLeft moves forward (next)
        fireEvent.keyDown(list, { key: 'ArrowLeft' });

        await flushMicrotasks();

        // Item b is now focused; Shift+ArrowRight toggles a (previous in RTL)
        fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
          key: 'ArrowRight',
          shiftKey: true,
        });

        await flushMicrotasks();

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange.mock.calls[0][0]).toEqual(['a']);
      });

      it('Ctrl+A selects all in RTL', async () => {
        const handleValueChange = vi.fn();

        await render(
          <DirectionProvider direction="rtl">
            <Listbox.Root
              selectionMode="multiple"
              orientation="horizontal"
              defaultValue={[]}
              onValueChange={handleValueChange}
            >
              <Listbox.List>
                <Listbox.Item value="a">a</Listbox.Item>
                <Listbox.Item value="b">b</Listbox.Item>
                <Listbox.Item value="c">c</Listbox.Item>
              </Listbox.List>
            </Listbox.Root>
          </DirectionProvider>,
        );

        await flushMicrotasks();

        const list = screen.getByRole('listbox');
        list.focus();
        fireEvent.keyDown(list, { key: 'a', ctrlKey: true });

        await flushMicrotasks();

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
      });
    });
  });

  describe('disabled', () => {
    it('should not allow selection when disabled', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root disabled onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      fireEvent.click(screen.getByRole('option', { name: 'a' }));

      expect(handleValueChange).not.toHaveBeenCalled();
    });

    it('should not allow selection on disabled items', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a" disabled>
              a
            </Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      fireEvent.click(screen.getByRole('option', { name: 'a' }));

      expect(handleValueChange).not.toHaveBeenCalled();
    });

    it('should not include disabled items in Shift+Click ranges', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root selectionMode="multiple" defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      fireEvent.click(screen.getByRole('option', { name: 'a' }));
      fireEvent.click(screen.getByRole('option', { name: 'c' }), { shiftKey: true });

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[1][0]).toEqual(['a', 'c']);
    });

    it('should not reorder with Alt+Arrow when DragAndDropProvider is not rendered', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const itemC = screen.getByRole('option', { name: 'c' });
      await act(() => itemC.focus());
      fireEvent.keyDown(itemC, { key: 'ArrowUp', altKey: true });
      await flushMicrotasks();

      expect(screen.getAllByRole('option').map((el) => el.textContent)).toEqual(['a', 'b', 'c']);
      expect(document.activeElement).toBe(itemC);
    });

    it('should reorder relative to a disabled item with Alt+Arrow', async () => {
      const handleItemsReorder = vi.fn();

      await render(
        <Listbox.Root>
          <Listbox.DragAndDropProvider onItemsReorder={handleItemsReorder}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b" disabled>
                b
              </Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.DragAndDropProvider>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemC = screen.getByRole('option', { name: 'c' });
      fireEvent.keyDown(itemC, { key: 'ArrowUp', altKey: true });

      expect(handleItemsReorder).toHaveBeenCalledTimes(1);
      expect(handleItemsReorder.mock.calls[0][0]).toEqual({
        items: ['c'],
        referenceItem: 'b',
        edge: 'before',
        reason: 'keyboard',
      });
    });

    it('should not reorder a disabled item with Alt+Arrow', async () => {
      const handleItemsReorder = vi.fn();

      await render(
        <Listbox.Root>
          <Listbox.DragAndDropProvider onItemsReorder={handleItemsReorder}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b" disabled>
                b
              </Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.DragAndDropProvider>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(() => itemB.focus());
      fireEvent.keyDown(itemB, { key: 'ArrowDown', altKey: true });

      expect(handleItemsReorder).not.toHaveBeenCalled();
    });

    it('should allow overriding canDrag for a disabled item with Alt+Arrow', async () => {
      const handleItemsReorder = vi.fn();
      const handleCanDrag = vi.fn((item: { value: string }) => item.value === 'b');

      await render(
        <Listbox.Root>
          <Listbox.DragAndDropProvider canDrag={handleCanDrag} onItemsReorder={handleItemsReorder}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b" disabled>
                b
              </Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.DragAndDropProvider>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(() => itemB.focus());
      fireEvent.keyDown(itemB, { key: 'ArrowDown', altKey: true });

      expect(handleCanDrag).toHaveBeenCalledWith({
        value: 'b',
        index: 1,
        groupId: undefined,
        disabled: true,
      });
      expect(handleItemsReorder).toHaveBeenCalledTimes(1);
      expect(handleItemsReorder.mock.calls[0][0]).toEqual({
        items: ['b'],
        referenceItem: 'c',
        edge: 'after',
        reason: 'keyboard',
      });
    });

    it('should block keyboard reordering when canDrop returns false', async () => {
      const handleItemsReorder = vi.fn();
      const handleCanDrop = vi.fn(() => false);

      await render(
        <Listbox.Root>
          <Listbox.DragAndDropProvider canDrop={handleCanDrop} onItemsReorder={handleItemsReorder}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.DragAndDropProvider>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      fireEvent.keyDown(itemB, { key: 'ArrowDown', altKey: true });

      expect(handleCanDrop).toHaveBeenCalledWith(
        [{ value: 'b', index: 1, groupId: undefined, disabled: false }],
        { value: 'c', index: 2, groupId: undefined, disabled: false },
        'after',
      );
      expect(handleItemsReorder).not.toHaveBeenCalled();
    });

    it('should block all keyboard reordering when the listbox is disabled', async () => {
      const handleItemsReorder = vi.fn();

      await render(
        <Listbox.Root disabled>
          <Listbox.DragAndDropProvider
            canDrag={() => true}
            canDrop={() => true}
            onItemsReorder={handleItemsReorder}
          >
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.DragAndDropProvider>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(() => itemB.focus());
      fireEvent.keyDown(itemB, { key: 'ArrowDown', altKey: true });

      expect(handleItemsReorder).not.toHaveBeenCalled();
    });

    it('should keep hover highlighting working after a blocked Alt+Arrow reorder', async () => {
      await render(
        <Listbox.Root>
          <Listbox.DragAndDropProvider onItemsReorder={vi.fn()}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b" disabled>
                b
              </Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.DragAndDropProvider>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(() => itemB.focus());
      fireEvent.keyDown(itemB, { key: 'ArrowDown', altKey: true });

      const itemA = screen.getByRole('option', { name: 'a' });
      fireEvent.mouseMove(itemA);

      expect(itemA).toHaveAttribute('data-highlighted', '');
    });

    it('should support multiple consecutive keyboard reorders and preserve navigation', async () => {
      function ReorderableListbox() {
        const [items, setItems] = React.useState(['a', 'b', 'c', 'd', 'e']);

        function handleReorder(event: {
          items: string[];
          referenceItem: string;
          edge: 'before' | 'after';
        }) {
          setItems((prev) => {
            const movedValues = new Set(event.items);
            const movedItems = prev.filter((v) => movedValues.has(v));
            const rest = prev.filter((v) => !movedValues.has(v));
            const refIndex = rest.indexOf(event.referenceItem);
            rest.splice(event.edge === 'after' ? refIndex + 1 : refIndex, 0, ...movedItems);
            return rest;
          });
        }

        return (
          <Listbox.Root>
            <Listbox.DragAndDropProvider onItemsReorder={handleReorder}>
              <Listbox.List>
                {items.map((item) => (
                  <Listbox.Item key={item} value={item}>
                    {item}
                  </Listbox.Item>
                ))}
              </Listbox.List>
            </Listbox.DragAndDropProvider>
          </Listbox.Root>
        );
      }

      await render(<ReorderableListbox />);
      await flushMicrotasks();

      // Focus item 'b' (index 1)
      const itemB = screen.getByRole('option', { name: 'b' });
      await act(() => itemB.focus());
      expect(document.activeElement).toBe(itemB);

      // Move 'b' down 3 times rapidly (no flushMicrotasks between moves)
      fireEvent.keyDown(itemB, { key: 'ArrowDown', altKey: true });
      fireEvent.keyDown(itemB, { key: 'ArrowDown', altKey: true });
      fireEvent.keyDown(itemB, { key: 'ArrowDown', altKey: true });
      await flushMicrotasks();

      // After 3 moves down, 'b' should be at index 4 (a, c, d, e, b)
      const allItems = screen.getAllByRole('option');
      expect(allItems.map((el) => el.textContent)).toEqual(['a', 'c', 'd', 'e', 'b']);

      const movedItemB = screen.getByRole('option', { name: 'b' });
      expect(document.activeElement).toBe(movedItemB);

      // Now release Alt and use regular arrow keys — should still work
      fireEvent.keyDown(movedItemB, { key: 'ArrowUp' });
      await flushMicrotasks();

      expect(document.activeElement).toBe(screen.getByRole('option', { name: 'e' }));
    });

    it('should report the reordered item from onHighlightChange after keyboard reorder', async () => {
      const handleHighlightChange = vi.fn();

      function ReorderableListbox() {
        const [items, setItems] = React.useState(['a', 'b', 'c', 'd']);

        function handleReorder(event: {
          items: string[];
          referenceItem: string;
          edge: 'before' | 'after';
        }) {
          setItems((prev) => {
            const movedValues = new Set(event.items);
            const movedItems = prev.filter((v) => movedValues.has(v));
            const rest = prev.filter((v) => !movedValues.has(v));
            const refIndex = rest.indexOf(event.referenceItem);
            rest.splice(event.edge === 'after' ? refIndex + 1 : refIndex, 0, ...movedItems);
            return rest;
          });
        }

        return (
          <Listbox.Root onHighlightChange={handleHighlightChange}>
            <Listbox.DragAndDropProvider onItemsReorder={handleReorder}>
              <Listbox.List>
                {items.map((item) => (
                  <Listbox.Item key={item} value={item}>
                    {item}
                  </Listbox.Item>
                ))}
              </Listbox.List>
            </Listbox.DragAndDropProvider>
          </Listbox.Root>
        );
      }

      await render(<ReorderableListbox />);
      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(() => itemB.focus());
      expect(handleHighlightChange).toHaveBeenLastCalledWith('b', itemB);
      handleHighlightChange.mockClear();

      fireEvent.keyDown(itemB, { key: 'ArrowDown', altKey: true });
      await flushMicrotasks();

      await waitFor(() => {
        expect(handleHighlightChange).toHaveBeenCalledTimes(1);
      });

      const movedItemB = screen.getByRole('option', { name: 'b' });
      expect(handleHighlightChange).toHaveBeenCalledWith('b', movedItemB);
    });

    it('should preserve focus when keyboard reorder crosses a group boundary', async () => {
      interface Item {
        value: string;
        group: string;
      }

      function GroupedReorderableListbox() {
        const [items, setItems] = React.useState<Item[]>([
          { value: 'a', group: 'g1' },
          { value: 'b', group: 'g1' },
          { value: 'c', group: 'g2' },
          { value: 'd', group: 'g2' },
        ]);

        function handleReorder(event: {
          items: string[];
          referenceItem: string;
          edge: 'before' | 'after';
        }) {
          setItems((prev) => {
            const movedValues = new Set(event.items);
            const refItem = prev.find((i) => i.value === event.referenceItem)!;
            const movedItems = prev
              .filter((i) => movedValues.has(i.value))
              .map((i) => ({ ...i, group: refItem.group }));
            const rest = prev.filter((i) => !movedValues.has(i.value));
            const refIndex = rest.findIndex((i) => i.value === event.referenceItem);
            rest.splice(event.edge === 'after' ? refIndex + 1 : refIndex, 0, ...movedItems);
            return rest;
          });
        }

        const groups = items.reduce(
          (acc, item) => {
            if (!acc[item.group]) {
              acc[item.group] = [];
            }
            acc[item.group].push(item);
            return acc;
          },
          {} as Record<string, Item[]>,
        );

        return (
          <Listbox.Root>
            <Listbox.DragAndDropProvider onItemsReorder={handleReorder}>
              <Listbox.List>
                {Object.entries(groups).map(([groupName, groupItems]) => (
                  <Listbox.Group key={groupName}>
                    <Listbox.GroupLabel>{groupName}</Listbox.GroupLabel>
                    {groupItems.map((item) => (
                      <Listbox.Item key={item.value} value={item.value}>
                        {item.value}
                      </Listbox.Item>
                    ))}
                  </Listbox.Group>
                ))}
              </Listbox.List>
            </Listbox.DragAndDropProvider>
          </Listbox.Root>
        );
      }

      await render(<GroupedReorderableListbox />);
      await flushMicrotasks();

      // Focus item 'b' (last in group g1)
      const itemB = screen.getByRole('option', { name: 'b' });
      await act(() => itemB.focus());
      expect(document.activeElement).toBe(itemB);

      // Move 'b' down — crosses from g1 to g2
      fireEvent.keyDown(itemB, { key: 'ArrowDown', altKey: true });
      await flushMicrotasks();

      // 'b' should now be between 'c' and 'd' (in g2)
      const allItems = screen.getAllByRole('option');
      expect(allItems.map((el) => el.textContent)).toEqual(['a', 'c', 'b', 'd']);

      // Focus must still be on 'b' after crossing the group boundary
      const movedItemB = screen.getByRole('option', { name: 'b' });
      expect(document.activeElement).toBe(movedItemB);

      // Regular arrow key should still work
      fireEvent.keyDown(movedItemB, { key: 'ArrowDown' });
      await flushMicrotasks();

      expect(document.activeElement).toBe(screen.getByRole('option', { name: 'd' }));
    });

    it('should allow using canDrop to keep keyboard reordering within a group', async () => {
      const handleItemsReorder = vi.fn();

      await render(
        <Listbox.Root>
          <Listbox.DragAndDropProvider
            canDrop={(sourceItems, targetItem) =>
              sourceItems.every((item) => item.groupId === targetItem.groupId)
            }
            onItemsReorder={handleItemsReorder}
          >
            <Listbox.List>
              <Listbox.Group>
                <Listbox.GroupLabel>g1</Listbox.GroupLabel>
                <Listbox.Item value="a">a</Listbox.Item>
                <Listbox.Item value="b">b</Listbox.Item>
              </Listbox.Group>
              <Listbox.Group>
                <Listbox.GroupLabel>g2</Listbox.GroupLabel>
                <Listbox.Item value="c">c</Listbox.Item>
                <Listbox.Item value="d">d</Listbox.Item>
              </Listbox.Group>
            </Listbox.List>
          </Listbox.DragAndDropProvider>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(() => itemB.focus());
      fireEvent.keyDown(itemB, { key: 'ArrowDown', altKey: true });

      expect(handleItemsReorder).not.toHaveBeenCalled();
      expect(screen.getAllByRole('option').map((el) => el.textContent)).toEqual([
        'a',
        'b',
        'c',
        'd',
      ]);
      expect(document.activeElement).toBe(itemB);
    });
  });

  describe('groups', () => {
    it('should render groups with correct ARIA', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Group>
              <Listbox.GroupLabel>Fruits</Listbox.GroupLabel>
              <Listbox.Item value="apple">Apple</Listbox.Item>
            </Listbox.Group>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAttribute('aria-labelledby');

      const labelId = group.getAttribute('aria-labelledby');
      const label = document.getElementById(labelId!);
      expect(label).toHaveTextContent('Fruits');
    });
  });

  describe('typeahead', () => {
    it('should highlight matching item when typing', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="apple">Apple</Listbox.Item>
            <Listbox.Item value="banana">Banana</Listbox.Item>
            <Listbox.Item value="cherry">Cherry</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      list.focus();

      fireEvent.keyDown(list, { key: 'b' });

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
        'data-highlighted',
        '',
      );
    });

    it('should match multi-character typeahead', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="cherry">Cherry</Listbox.Item>
            <Listbox.Item value="chocolate">Chocolate</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      list.focus();

      // Each typed character may move focus to a new item. After 'c' matches
      // Cherry, focus moves there; 'ch' then 'cho' refine to Chocolate.
      fireEvent.keyDown(list, { key: 'c' });

      await flushMicrotasks();

      const cherry = screen.getByRole('option', { name: 'Cherry' });
      fireEvent.keyDown(cherry, { key: 'h' });

      await flushMicrotasks();

      // After 'ch', Chocolate is the first match — focus moves there
      const chocolate = screen.getByRole('option', { name: 'Chocolate' });
      fireEvent.keyDown(chocolate, { key: 'o' });

      await flushMicrotasks();

      expect(chocolate).toHaveAttribute('data-highlighted', '');
    });
  });

  describe('prop: loopFocus', () => {
    it('should wrap from last to first item when loopFocus is true (default)', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      list.focus();

      // Move to last item
      fireEvent.keyDown(list, { key: 'End' });

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-highlighted', '');

      // ArrowDown from last should wrap to first
      fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), { key: 'ArrowDown' });

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-highlighted', '');
    });

    it('should not wrap when loopFocus is false', async () => {
      await render(
        <Listbox.Root loopFocus={false}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      list.focus();

      // Move to last item
      fireEvent.keyDown(list, { key: 'End' });

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-highlighted', '');

      // ArrowDown from last should stay on last
      fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), { key: 'ArrowDown' });

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-highlighted', '');
    });
  });

  describe('label', () => {
    it('should wire aria-labelledby from Listbox.Label to Listbox.List', async () => {
      await render(
        <Listbox.Root>
          <Listbox.Label>Choose one</Listbox.Label>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const list = screen.getByRole('listbox');
      const labelId = list.getAttribute('aria-labelledby');
      expect(labelId).not.toBeNull();

      const label = document.getElementById(labelId!);
      expect(label).toHaveTextContent('Choose one');
    });
  });

  describe('controlled value', () => {
    it('should update selection when value prop changes externally', async () => {
      function TestComponent() {
        const [value, setValue] = React.useState<string[]>(['a']);
        return (
          <div>
            <button type="button" onClick={() => setValue(['b'])}>
              switch
            </button>
            <Listbox.Root value={value} onValueChange={(v) => setValue(v)}>
              <Listbox.List>
                <Listbox.Item value="a">a</Listbox.Item>
                <Listbox.Item value="b">b</Listbox.Item>
              </Listbox.List>
            </Listbox.Root>
          </div>
        );
      }

      await render(<TestComponent />);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'b' })).not.toHaveAttribute('data-selected');

      fireEvent.click(screen.getByRole('button', { name: 'switch' }));

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'a' })).not.toHaveAttribute('data-selected');
    });
  });

  describe('form integration', () => {
    it('should render hidden input with value', async () => {
      await render(
        <Listbox.Root name="fruit" defaultValue={['apple']}>
          <Listbox.List>
            <Listbox.Item value="apple">Apple</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const hiddenInput = document.querySelector('input[name="fruit"]') as HTMLInputElement;
      expect(hiddenInput).not.toBeNull();
      expect(hiddenInput.value).toBe('apple');
    });

    it('should render multiple hidden inputs for multi-select', async () => {
      await render(
        <Listbox.Root selectionMode="multiple" name="fruits" defaultValue={['apple', 'banana']}>
          <Listbox.List>
            <Listbox.Item value="apple">Apple</Listbox.Item>
            <Listbox.Item value="banana">Banana</Listbox.Item>
            <Listbox.Item value="cherry">Cherry</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      await flushMicrotasks();

      const hiddenInputs = document.querySelectorAll(
        'input[name="fruits"]',
      ) as NodeListOf<HTMLInputElement>;
      expect(hiddenInputs.length).toBe(2);

      const values = Array.from(hiddenInputs).map((input) => input.value);
      expect(values).toEqual(['apple', 'banana']);
    });
  });
});
