import { expect, vi } from 'vitest';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
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

        // Item b is now focused; Shift+ArrowRight selects b (anchor) and c (target)
        fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
          key: 'ArrowRight',
          shiftKey: true,
        });

        await flushMicrotasks();

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'c']);
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

        // Item b is now focused; Shift+ArrowLeft selects b (anchor) and a (target)
        fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
          key: 'ArrowLeft',
          shiftKey: true,
        });

        await flushMicrotasks();

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'a']);
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

        // Item b is now focused; Shift+ArrowLeft selects c (next in RTL)
        fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
          key: 'ArrowLeft',
          shiftKey: true,
        });

        await flushMicrotasks();

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'c']);
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

        // Item b is now focused; Shift+ArrowRight selects a (previous in RTL)
        fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), {
          key: 'ArrowRight',
          shiftKey: true,
        });

        await flushMicrotasks();

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'a']);
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
