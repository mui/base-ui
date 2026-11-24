import { expect, describe, it } from 'vitest';
import { resolveItemKeyPress, resolveListKeyCommand } from './listKeyCommand';
import type { ListKey, ListKeyContext } from './listKeyCommand';

function resolve(key: string | Partial<ListKey>, context: Partial<ListKeyContext> = {}) {
  return resolveListKeyCommand(
    {
      key: '',
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      ...(typeof key === 'string' ? { key } : key),
    },
    {
      orientation: 'vertical',
      rtl: false,
      currentIndex: 2,
      count: 5,
      multiple: false,
      mac: false,
      ...context,
    },
  );
}

describe('resolveListKeyCommand', () => {
  describe('navigation', () => {
    it.each([
      { name: 'ArrowDown moves to the next item', key: 'ArrowDown', index: 3 },
      { name: 'ArrowUp moves to the previous item', key: 'ArrowUp', index: 1 },
      { name: 'Home moves to the first item', key: 'Home', index: 0 },
      { name: 'End moves to the last item', key: 'End', index: 4 },
    ])('$name', ({ key, index }) => {
      expect(resolve(key)).toEqual({ type: 'move', index, select: false });
    });

    it.each([
      { name: 'ArrowRight moves forward', key: 'ArrowRight', rtl: false, index: 3 },
      { name: 'ArrowLeft moves backward', key: 'ArrowLeft', rtl: false, index: 1 },
      { name: 'ArrowLeft moves forward in RTL', key: 'ArrowLeft', rtl: true, index: 3 },
      { name: 'ArrowRight moves backward in RTL', key: 'ArrowRight', rtl: true, index: 1 },
    ])('$name in a horizontal list', ({ key, rtl, index }) => {
      expect(resolve(key, { orientation: 'horizontal', rtl })).toEqual({
        type: 'move',
        index,
        select: false,
      });
    });

    it.each([
      { name: 'a vertical list ignores ArrowRight', key: 'ArrowRight', orientation: 'vertical' },
      { name: 'a horizontal list ignores ArrowDown', key: 'ArrowDown', orientation: 'horizontal' },
    ] as const)('$name', ({ key, orientation }) => {
      expect(resolve(key, { orientation })).toBe(null);
    });

    it.each([
      { name: 'ArrowDown on the last item', key: 'ArrowDown', currentIndex: 4 },
      { name: 'ArrowUp on the first item', key: 'ArrowUp', currentIndex: 0 },
      { name: 'End on the last item', key: 'End', currentIndex: 4 },
      { name: 'Home on the first item', key: 'Home', currentIndex: 0 },
    ])('$name does nothing, without wrapping', ({ key, currentIndex }) => {
      expect(resolve(key, { currentIndex })).toEqual({ type: 'none' });
    });

    it('starts from the first item when no item holds the tab stop', () => {
      expect(resolve('ArrowDown', { currentIndex: null })).toEqual({
        type: 'move',
        index: 1,
        select: false,
      });
    });

    it('ignores navigation keys in an empty list', () => {
      expect(resolve('ArrowDown', { count: 0, currentIndex: null })).toBe(null);
    });

    it('ignores keys that the list does not handle', () => {
      expect(resolve('Enter')).toBe(null);
    });
  });

  describe('opt-in mode', () => {
    it('moves the selection with the arrow keys', () => {
      expect(resolve('ArrowDown', { multiple: 'opt-in' })).toEqual({
        type: 'move',
        index: 3,
        select: true,
      });
    });

    it.each([
      { key: 'Home', index: 0 },
      { key: 'End', index: 4 },
    ])('moves the selection with $key', ({ key, index }) => {
      expect(resolve(key, { multiple: 'opt-in' })).toEqual({
        type: 'move',
        index,
        select: true,
      });
    });

    it('does not move the selection with Home when each item is toggled independently', () => {
      expect(resolve('Home', { multiple: true })).toEqual({
        type: 'move',
        index: 0,
        select: false,
      });
    });

    it.each([
      { name: 'Ctrl+Arrow', modifiers: { ctrlKey: true }, mac: false },
      { name: 'Option+Arrow on macOS', modifiers: { altKey: true }, mac: true },
    ])('moves focus without selecting on $name', ({ modifiers, mac }) => {
      expect(resolve({ key: 'ArrowDown', ...modifiers }, { multiple: 'opt-in', mac })).toEqual({
        type: 'move',
        index: 3,
        select: false,
      });
    });

    it('does not move focus on Ctrl+Arrow on macOS', () => {
      expect(resolve({ key: 'ArrowDown', ctrlKey: true }, { multiple: 'opt-in', mac: true })).toBe(
        null,
      );
    });

    it('does not move focus on Ctrl+Arrow when the list selects multiple items directly', () => {
      expect(resolve({ key: 'ArrowDown', ctrlKey: true }, { multiple: true })).toBe(null);
    });
  });

  describe('multiple selection', () => {
    it.each([
      { name: 'Shift+ArrowDown extends to the next item', key: 'ArrowDown', index: 3 },
      { name: 'Shift+ArrowUp extends to the previous item', key: 'ArrowUp', index: 1 },
    ])('$name', ({ key, index }) => {
      expect(resolve({ key, shiftKey: true }, { multiple: true })).toEqual({
        type: 'extend',
        index,
      });
    });

    it('does nothing on Shift+ArrowDown on the last item', () => {
      expect(
        resolve({ key: 'ArrowDown', shiftKey: true }, { multiple: true, currentIndex: 4 }),
      ).toEqual({ type: 'none' });
    });

    it('selects from the first item to the focused one on Ctrl+Shift+Home', () => {
      expect(resolve({ key: 'Home', ctrlKey: true, shiftKey: true }, { multiple: true })).toEqual({
        type: 'selectRange',
        from: 0,
        to: 2,
        focusIndex: 0,
      });
    });

    it('selects from the focused item to the last one on Ctrl+Shift+End', () => {
      expect(resolve({ key: 'End', metaKey: true, shiftKey: true }, { multiple: true })).toEqual({
        type: 'selectRange',
        from: 2,
        to: 4,
        focusIndex: 4,
      });
    });

    it.each([
      { name: 'Ctrl+A', modifiers: { ctrlKey: true } },
      { name: 'Cmd+A', modifiers: { metaKey: true } },
    ])('selects every item on $name', ({ modifiers }) => {
      expect(resolve({ key: 'a', ...modifiers }, { multiple: true })).toEqual({
        type: 'selectAll',
      });
    });

    it('selects every item on Ctrl+A typed as an uppercase letter', () => {
      expect(resolve({ key: 'A', ctrlKey: true }, { multiple: true })).toEqual({
        type: 'selectAll',
      });
    });

    it('does nothing on Shift+ArrowDown when no item holds the tab stop', () => {
      expect(
        resolve({ key: 'ArrowDown', shiftKey: true }, { multiple: true, currentIndex: null }),
      ).toEqual({ type: 'none' });
    });

    it.each([
      { name: 'Ctrl+ArrowDown on the last item', key: 'ArrowDown', currentIndex: 4 },
      { name: 'Ctrl+ArrowUp on the first item', key: 'ArrowUp', currentIndex: 0 },
    ])('does nothing on $name in opt-in mode', ({ key, currentIndex }) => {
      expect(resolve({ key, ctrlKey: true }, { multiple: 'opt-in', currentIndex })).toEqual({
        type: 'none',
      });
    });

    it('selects every item by the physical A key on a layout without Latin letters', () => {
      expect(resolve({ key: 'ф', code: 'KeyA', ctrlKey: true }, { multiple: true })).toEqual({
        type: 'selectAll',
      });
    });

    it('does not select every item on Ctrl+Alt+A', () => {
      expect(
        resolve({ key: 'a', code: 'KeyA', ctrlKey: true, altKey: true }, { multiple: true }),
      ).toBe(null);
    });

    it.each([
      { name: 'multiple', multiple: true as const },
      { name: 'opt-in', multiple: 'opt-in' as const },
      { name: 'single', multiple: false as const },
    ])('leaves Escape alone with $name selection', ({ multiple }) => {
      expect(resolve('Escape', { multiple })).toBe(null);
    });

    it.each([
      { name: 'Ctrl+Shift+End', key: { key: 'End', ctrlKey: true, shiftKey: true } },
      { name: 'Ctrl+A', key: { key: 'a', ctrlKey: true } },
    ])('ignores $name when the list selects a single item', ({ key }) => {
      expect(resolve(key, { multiple: false })).toBe(null);
    });

    it('does nothing on Shift+ArrowDown when the list selects a single item', () => {
      expect(resolve({ key: 'ArrowDown', shiftKey: true }, { multiple: false })).toEqual({
        type: 'none',
      });
    });
  });
});

describe('resolveItemKeyPress', () => {
  const key = { key: '', shiftKey: false, ctrlKey: false, metaKey: false, altKey: false };

  it.each([
    { name: 'Space', press: { key: ' ' }, expected: { shiftKey: false, ctrlKey: false } },
    { name: 'Enter', press: { key: 'Enter' }, expected: { shiftKey: false, ctrlKey: false } },
    {
      name: 'Shift+Space',
      press: { key: ' ', shiftKey: true },
      expected: { shiftKey: true, ctrlKey: false },
    },
    {
      name: 'Ctrl+Space',
      press: { key: ' ', ctrlKey: true },
      expected: { shiftKey: false, ctrlKey: true },
    },
    {
      name: 'Cmd+Enter',
      press: { key: 'Enter', metaKey: true },
      expected: { shiftKey: false, ctrlKey: true },
    },
  ])('presses the item on $name', ({ press, expected }) => {
    expect(resolveItemKeyPress({ ...key, ...press }, { multiple: true, mac: false })).toEqual(
      expected,
    );
  });

  it('does not press the item on another key', () => {
    expect(resolveItemKeyPress({ ...key, key: 'a' }, { multiple: true, mac: false })).toBe(null);
  });

  describe('Option+Space', () => {
    const optionSpace = { ...key, key: '\u00a0', code: 'Space', altKey: true };

    it('toggles the item on macOS with multiple selection', () => {
      expect(resolveItemKeyPress(optionSpace, { multiple: 'opt-in', mac: true })).toEqual({
        shiftKey: false,
        ctrlKey: true,
      });
    });

    it.each([
      { name: 'on macOS with single selection', multiple: false as const, mac: true },
      { name: 'on other platforms', multiple: true as const, mac: false },
    ])('does not press the item $name', ({ multiple, mac }) => {
      expect(resolveItemKeyPress(optionSpace, { multiple, mac })).toBe(null);
    });
  });
});
