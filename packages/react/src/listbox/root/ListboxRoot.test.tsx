import { expect, vi, describe, it, beforeEach } from 'vitest';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

describe('<Listbox.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describe('prop: defaultValue', () => {
    it('should select the item by default', async () => {
      await render(
        <Listbox.Root defaultValue="b">
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'a' })).not.toHaveAttribute('data-selected');
    });
  });

  describe('prop: value (controlled)', () => {
    it('should select the item matching the value', async () => {
      await render(
        <Listbox.Root value="a">
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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

      fireEvent.click(screen.getByRole('option', { name: 'b' }));

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toBe('b');
    });
  });

  describe('prop: onItemHighlighted', () => {
    function renderList(onItemHighlighted: Listbox.Root.Props<string>['onItemHighlighted']) {
      return render(
        <Listbox.Root onItemHighlighted={onItemHighlighted}>
          <Listbox.List>
            <Listbox.Item value="apple">Apple</Listbox.Item>
            <Listbox.Item value="banana">Banana</Listbox.Item>
            <Listbox.Item value="cherry">Cherry</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );
    }

    it('reports keyboard navigation with the keyboard reason', async () => {
      const handleItemHighlighted = vi.fn();
      await renderList(handleItemHighlighted);

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());
      handleItemHighlighted.mockClear();

      fireEvent.keyDown(list, { key: 'End' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'Cherry' })).toHaveAttribute('data-highlighted');
      expect(handleItemHighlighted).toHaveBeenCalledTimes(1);
      const [itemValue, eventDetails] = handleItemHighlighted.mock.calls[0];
      expect(itemValue).toBe('cherry');
      expect(eventDetails.reason).toBe('keyboard');
      expect(eventDetails.index).toBe(2);
      expect(eventDetails.event.type).toBe('keydown');
    });

    it('reports typeahead with the keyboard reason', async () => {
      const handleItemHighlighted = vi.fn();
      await renderList(handleItemHighlighted);

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());
      handleItemHighlighted.mockClear();

      fireEvent.keyDown(list, { key: 'b' });
      await flushMicrotasks();

      expect(handleItemHighlighted).toHaveBeenCalledTimes(1);
      expect(handleItemHighlighted.mock.calls[0][0]).toBe('banana');
      expect(handleItemHighlighted.mock.calls[0][1].reason).toBe('keyboard');
    });

    it('reports hovering with the pointer reason', async () => {
      const handleItemHighlighted = vi.fn();
      await renderList(handleItemHighlighted);

      await act(async () => screen.getByRole('option', { name: 'Apple' }).focus());
      handleItemHighlighted.mockClear();

      fireEvent.mouseMove(screen.getByRole('option', { name: 'Banana' }));

      expect(handleItemHighlighted).toHaveBeenCalledTimes(1);
      const [itemValue, eventDetails] = handleItemHighlighted.mock.calls[0];
      expect(itemValue).toBe('banana');
      expect(eventDetails.reason).toBe('pointer');
      expect(eventDetails.index).toBe(1);
    });

    it('reports focus leaving the list as an unhighlight', async () => {
      const handleItemHighlighted = vi.fn();
      await render(
        <div>
          <Listbox.Root onItemHighlighted={handleItemHighlighted}>
            <Listbox.List>
              <Listbox.Item value="apple">Apple</Listbox.Item>
              <Listbox.Item value="banana">Banana</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
          <button>Outside</button>
        </div>,
      );

      await act(async () => screen.getByRole('option', { name: 'Banana' }).focus());
      handleItemHighlighted.mockClear();

      await act(async () => screen.getByRole('button', { name: 'Outside' }).focus());

      expect(handleItemHighlighted).toHaveBeenCalledTimes(1);
      const [itemValue, eventDetails] = handleItemHighlighted.mock.calls[0];
      expect(itemValue).toBe(undefined);
      expect(eventDetails.reason).toBe('none');
      expect(eventDetails.index).toBe(-1);
    });

    it('reports focus without navigation with the none reason', async () => {
      const handleItemHighlighted = vi.fn();
      await renderList(handleItemHighlighted);

      await act(async () => screen.getByRole('option', { name: 'Cherry' }).focus());

      expect(handleItemHighlighted).toHaveBeenCalledTimes(1);
      expect(handleItemHighlighted.mock.calls[0][0]).toBe('cherry');
      expect(handleItemHighlighted.mock.calls[0][1].reason).toBe('none');
    });
  });

  describe('highlight', () => {
    function renderListWithOutsideButton(rootProps: Listbox.Root.Props<string> = {}) {
      return render(
        <div>
          <Listbox.Root {...rootProps}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
              <Listbox.Item value="c">c</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
          <button>Outside</button>
        </div>,
      );
    }

    it('removes the highlight when focus leaves the list and restores it when focus returns', async () => {
      const { user } = await renderListWithOutsideButton();
      const itemB = screen.getByRole('option', { name: 'b' });

      await act(async () => itemB.focus());
      expect(itemB).toHaveAttribute('data-highlighted');

      await user.keyboard('{Tab}');
      expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
      expect(itemB).not.toHaveAttribute('data-highlighted');
      expect(itemB).toHaveAttribute('tabindex', '0');

      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(itemB).toHaveFocus();
      expect(itemB).toHaveAttribute('data-highlighted');
    });

    it('removes the highlight when focus moves from an item to the list', async () => {
      await renderListWithOutsideButton();
      const itemB = screen.getByRole('option', { name: 'b' });

      await act(async () => itemB.focus());
      expect(itemB).toHaveAttribute('data-highlighted');

      await act(async () => screen.getByRole('listbox').focus());
      expect(itemB).not.toHaveAttribute('data-highlighted');
    });

    it('keeps the highlight on the focused item when the pointer leaves it', async () => {
      const { user } = await renderListWithOutsideButton();
      const itemB = screen.getByRole('option', { name: 'b' });

      await user.click(itemB);
      expect(itemB).toHaveFocus();
      expect(itemB).toHaveAttribute('data-highlighted');

      fireEvent.mouseLeave(itemB);
      await flushMicrotasks();

      expect(itemB).toHaveAttribute('data-highlighted');
    });
  });

  describe('prop: highlightItemOnHover', () => {
    function renderListWithOutsideButton(highlightItemOnHover?: boolean) {
      return render(
        <div>
          <Listbox.Root highlightItemOnHover={highlightItemOnHover}>
            <Listbox.List>
              <Listbox.Item value="a">a</Listbox.Item>
              <Listbox.Item value="b">b</Listbox.Item>
            </Listbox.List>
          </Listbox.Root>
          <button>Outside</button>
        </div>,
      );
    }

    it('moves focus and the highlight to a hovered item when focus is in the list', async () => {
      await renderListWithOutsideButton();
      const itemA = screen.getByRole('option', { name: 'a' });
      const itemB = screen.getByRole('option', { name: 'b' });

      await act(async () => itemA.focus());
      expect(itemA).toHaveAttribute('data-highlighted');

      fireEvent.mouseMove(itemB);

      expect(itemB).toHaveFocus();
      expect(itemB).toHaveAttribute('data-highlighted');
      expect(itemA).not.toHaveAttribute('data-highlighted');
    });

    it('does not take focus from a control outside the list', async () => {
      await renderListWithOutsideButton();
      const outside = screen.getByRole('button', { name: 'Outside' });
      const itemB = screen.getByRole('option', { name: 'b' });

      await act(async () => outside.focus());

      fireEvent.mouseMove(itemB);

      expect(outside).toHaveFocus();
      expect(itemB).not.toHaveAttribute('data-highlighted');
    });
  });

  describe('single selection', () => {
    it('should select an item on click and deselect previous', async () => {
      function TestComponent() {
        const [value, setValue] = React.useState<string | null>('a');
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
        <Listbox.Root multiple defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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

  describe('prop: multiple', () => {
    it('keeps the selection when plain arrow keys move focus', async () => {
      const handleValueChange = vi.fn();
      await render(
        <Listbox.Root multiple defaultValue={['a', 'b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(async () => itemB.focus());

      fireEvent.keyDown(itemB, { key: 'ArrowDown' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'c' })).toHaveAttribute('data-highlighted');
      expect(handleValueChange).not.toHaveBeenCalled();
    });
  });

  describe('prop: multiple="opt-in"', () => {
    it('should replace the selection on plain click', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a', 'b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      fireEvent.click(screen.getByRole('option', { name: 'c' }));

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['c']);
    });

    it('should toggle items on Ctrl/Cmd+Click', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a', 'b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemC = screen.getByRole('option', { name: 'c' });

      fireEvent.click(itemC, { ctrlKey: true });
      fireEvent.click(itemC, { metaKey: true });

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
      expect(handleValueChange.mock.calls[1][0]).toEqual(['a', 'b']);
    });

    function renderOptIn(
      props: Partial<Listbox.Root.Props<string, 'opt-in'>> = {},
      onValueChange = vi.fn(),
    ) {
      return render(
        <Listbox.Root multiple="opt-in" onValueChange={onValueChange} {...props}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );
    }

    it('moves the selection with focus on plain arrow keys', async () => {
      const handleValueChange = vi.fn();
      await renderOptIn({ defaultValue: ['a', 'b'] }, handleValueChange);

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(async () => itemB.focus());
      expect(itemB).toHaveAttribute('data-highlighted');

      fireEvent.keyDown(itemB, { key: 'ArrowDown' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'c' })).toHaveAttribute('data-highlighted');
      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['c']);
    });

    it.each([
      { name: 'Ctrl', modifier: { ctrlKey: true } },
      { name: 'Cmd', modifier: { metaKey: true } },
    ])('moves focus without changing the selection on $name+arrow keys', async ({ modifier }) => {
      const handleValueChange = vi.fn();
      await renderOptIn({ defaultValue: ['a'] }, handleValueChange);

      const itemA = screen.getByRole('option', { name: 'a' });
      await act(async () => itemA.focus());
      expect(itemA).toHaveAttribute('data-highlighted');

      fireEvent.keyDown(itemA, { key: 'ArrowDown', ...modifier });
      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });
      expect(itemB).toHaveAttribute('data-highlighted');
      expect(handleValueChange).not.toHaveBeenCalled();

      fireEvent.keyDown(itemB, { key: ' ', ctrlKey: true });
      fireEvent.keyUp(itemB, { key: ' ', ctrlKey: true });
      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b']);
    });

    it('keeps the selection when Home and End move focus', async () => {
      const handleValueChange = vi.fn();
      await renderOptIn({ defaultValue: ['b'] }, handleValueChange);

      const itemB = screen.getByRole('option', { name: 'b' });
      await act(async () => itemB.focus());

      fireEvent.keyDown(itemB, { key: 'End' });
      await flushMicrotasks();
      expect(screen.getByRole('option', { name: 'c' })).toHaveAttribute('data-highlighted');

      fireEvent.keyDown(screen.getByRole('option', { name: 'c' }), { key: 'Home' });
      await flushMicrotasks();
      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-highlighted');

      expect(handleValueChange).not.toHaveBeenCalled();
    });

    it('toggles items on touch tap, like multiple', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a', 'b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemC = screen.getByRole('option', { name: 'c' });
      fireEvent.pointerDown(itemC, { pointerType: 'touch' });
      fireEvent.click(itemC);

      const itemA = screen.getByRole('option', { name: 'a' });
      fireEvent.pointerDown(itemA, { pointerType: 'touch' });
      fireEvent.click(itemA);

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
      expect(handleValueChange.mock.calls[1][0]).toEqual(['b', 'c']);
    });

    it('should preserve existing selections outside the range on Ctrl+Shift+Click', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple="opt-in" defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
            <Listbox.Item value="e">e</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      fireEvent.click(screen.getByRole('option', { name: 'c' }), { ctrlKey: true });
      fireEvent.click(screen.getByRole('option', { name: 'e' }), {
        ctrlKey: true,
        shiftKey: true,
      });

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'c']);
      expect(handleValueChange.mock.calls[1][0]).toEqual(['a', 'c', 'd', 'e']);
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

    it.each([
      { name: 'multiple', multiple: true },
      { name: 'opt-in mode', multiple: 'opt-in' as const },
    ])('should set aria-multiselectable with $name', async ({ multiple }) => {
      await render(
        <Listbox.Root multiple={multiple}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('should set aria-selected on selected items', async () => {
      await render(
        <Listbox.Root defaultValue="a">
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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

      expect(handleValueChange).toHaveBeenCalledWith('b', expect.anything());
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

      expect(handleValueChange).toHaveBeenCalledWith('b', expect.anything());
    });
  });

  describe('multi-select keyboard navigation', () => {
    it('Space toggles the selection state of the focused option', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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

    it('Shift+ArrowDown selects from the focused option to the next one, replacing the rest of the selection', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={['a', 'b']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      // ArrowDown from list moves to index 1 (item b)
      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemB = screen.getByRole('option', { name: 'b' });

      // Item b is focused and becomes the anchor; Shift+ArrowDown selects b–c
      fireEvent.keyDown(itemB, { key: 'ArrowDown', shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'c']);
    });

    it('Shift+Space selects contiguous items from most recently selected to focused', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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

    it('Shift+Click replaces existing selections outside the range', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
            <Listbox.Item value="e">e</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      // Click "a" to select it
      fireEvent.click(screen.getByRole('option', { name: 'a' }));
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a']);

      // Click "e" to also toggle it on
      fireEvent.click(screen.getByRole('option', { name: 'e' }));
      expect(handleValueChange.mock.calls[1][0]).toEqual(['a', 'e']);

      // Click "c" to set the anchor
      fireEvent.click(screen.getByRole('option', { name: 'c' }));
      expect(handleValueChange.mock.calls[2][0]).toEqual(['a', 'e', 'c']);

      // Shift+Click "d" — should select range c→d only, dropping "a" and "e"
      fireEvent.click(screen.getByRole('option', { name: 'd' }), { shiftKey: true });
      expect(handleValueChange.mock.calls[3][0]).toEqual(['c', 'd']);
    });

    it('Ctrl+Shift+Home selects focused option and all options up to the first', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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
        <Listbox.Root multiple defaultValue={['a', 'b', 'c']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      fireEvent.keyDown(screen.getByRole('option', { name: 'b' }), { key: 'ArrowDown' });

      await flushMicrotasks();

      const itemC = screen.getByRole('option', { name: 'c' });
      fireEvent.keyDown(itemC, { key: 'Home', ctrlKey: true, shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toEqual(['a', 'c']);
    });

    it('ArrowDown moves focus to a disabled option', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      list.focus();
      fireEvent.keyDown(list, { key: 'ArrowDown' });

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveFocus();
    });

    it('Shift+Arrow grows and shrinks the range from where Shift was pressed', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const option = (name: string) => screen.getByRole('option', { name });
      await act(async () => option('a').focus());

      fireEvent.keyDown(option('a'), { key: 'Shift', shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('a'), { key: 'ArrowDown', shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('b'), { key: 'ArrowDown', shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('c'), { key: 'ArrowUp', shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('b'), { key: 'ArrowUp', shiftKey: true });
      await flushMicrotasks();

      expect(option('a')).toHaveAttribute('data-highlighted');
      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([
        ['a', 'b'],
        ['a', 'b', 'c'],
        ['a', 'b'],
        ['a'],
      ]);
    });

    it('Shift+Arrow starts a new range from where Shift is pressed again', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const option = (name: string) => screen.getByRole('option', { name });
      await act(async () => option('a').focus());

      fireEvent.keyDown(option('a'), { key: 'Shift', shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('a'), { key: 'ArrowDown', shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('b'), { key: 'ArrowDown' });
      await flushMicrotasks();
      fireEvent.keyDown(option('c'), { key: 'Shift', shiftKey: true });
      await flushMicrotasks();
      fireEvent.keyDown(option('c'), { key: 'ArrowDown', shiftKey: true });
      await flushMicrotasks();

      expect(handleValueChange.mock.calls.map((call) => call[0])).toEqual([
        ['a', 'b'],
        ['c', 'd'],
      ]);
    });

    it('Shift+ArrowDown focuses disabled options without selecting them', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={['a']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const itemA = screen.getByRole('option', { name: 'a' });
      await act(() => itemA.focus());
      fireEvent.keyDown(itemA, { key: 'ArrowDown', shiftKey: true });

      await flushMicrotasks();

      expect(handleValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole('option', { name: 'b' })).toHaveFocus();
    });

    it('Meta+A (Cmd+A) selects all options', async () => {
      const handleValueChange = vi.fn();

      await render(
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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
        <Listbox.Root multiple defaultValue={['d']} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
            <Listbox.Item value="d">d</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

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
      it('Shift+ArrowRight extends the selection to the next option', async () => {
        const handleValueChange = vi.fn();

        await render(
          <Listbox.Root
            multiple
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
        expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'c']);
      });

      it('Shift+ArrowDown does not select in horizontal orientation', async () => {
        const handleValueChange = vi.fn();

        await render(
          <Listbox.Root
            multiple
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
      it('Shift+ArrowLeft extends the selection to the next option in RTL', async () => {
        const handleValueChange = vi.fn();

        await render(
          <DirectionProvider direction="rtl">
            <Listbox.Root
              multiple
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
        expect(handleValueChange.mock.calls[0][0]).toEqual(['b', 'c']);
      });

      it('Ctrl+A selects all in RTL', async () => {
        const handleValueChange = vi.fn();

        await render(
          <DirectionProvider direction="rtl">
            <Listbox.Root
              multiple
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
        <Listbox.Root multiple defaultValue={[]} onValueChange={handleValueChange}>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b" disabled>
              b
            </Listbox.Item>
            <Listbox.Item value="c">c</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      fireEvent.click(screen.getByRole('option', { name: 'a' }));
      fireEvent.click(screen.getByRole('option', { name: 'c' }), { shiftKey: true });

      expect(handleValueChange).toHaveBeenCalledTimes(2);
      expect(handleValueChange.mock.calls[1][0]).toEqual(['a', 'c']);
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

      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAttribute('aria-labelledby');

      const labelId = group.getAttribute('aria-labelledby');
      const label = document.getElementById(labelId!);
      expect(label).toHaveTextContent('Fruits');
    });
  });

  describe('typeahead', () => {
    it('matches the label prop instead of the rendered text', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="apple">Apple</Listbox.Item>
            <Listbox.Item value="kiwi" label="Kiwi">
              <span>Green</span> <span>Kiwi</span>
            </Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());

      fireEvent.keyDown(list, { key: 'k' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'Green Kiwi' })).toHaveAttribute(
        'data-highlighted',
        '',
      );
    });

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

  describe('focus at the ends of the list', () => {
    it('stays on the last item when pressing ArrowDown', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Item value="a">a</Listbox.Item>
            <Listbox.Item value="b">b</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox');
      await act(async () => list.focus());

      fireEvent.keyDown(list, { key: 'End' });
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-highlighted', '');

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

      const list = screen.getByRole('listbox');
      const labelId = list.getAttribute('aria-labelledby');
      expect(labelId).not.toBeNull();

      const label = document.getElementById(labelId!);
      expect(label).toHaveTextContent('Choose one');
    });

    it('keeps the label linked when the list has its own id', async () => {
      await render(
        <Listbox.Root>
          <Listbox.Label>Artists</Listbox.Label>
          <Listbox.List id="artists">
            <Listbox.Item value="a">a</Listbox.Item>
          </Listbox.List>
        </Listbox.Root>,
      );

      const list = screen.getByRole('listbox', { name: 'Artists' });
      expect(list).toHaveAttribute('id', 'artists');
      expect(list).not.toHaveFocus();

      fireEvent.click(screen.getByText('Artists'));

      expect(list).toHaveFocus();
    });
  });

  describe('controlled value', () => {
    it('should update selection when value prop changes externally', async () => {
      function TestComponent() {
        const [value, setValue] = React.useState<string | null>('a');
        return (
          <div>
            <button type="button" onClick={() => setValue('b')}>
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

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'b' })).not.toHaveAttribute('data-selected');

      fireEvent.click(screen.getByRole('button', { name: 'switch' }));

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'a' })).not.toHaveAttribute('data-selected');
    });
  });
});
