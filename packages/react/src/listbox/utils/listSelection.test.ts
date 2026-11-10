import { expect, vi, describe, it } from 'vitest';
import { ListSelection } from './listSelection';
import type { SelectionItems } from './listSelection';

const VALUES = ['a', 'b', 'c', 'd', 'e'];
const EVENT = 'event';

function setup(options: { multiple: boolean | 'opt-in'; value?: string[]; disabled?: string[] }) {
  const { multiple, disabled = [] } = options;
  let value = options.value ?? [];

  const items: SelectionItems = {
    count: VALUES.length,
    getValue: (index) => VALUES[index],
    indexOfValue: (itemValue) => VALUES.indexOf(itemValue),
    isSameValue: Object.is,
    isDisabled: (index) => disabled.includes(VALUES[index]),
    keepsDisabled: multiple !== false,
  };

  const commit = vi.fn((nextValue: string[]) => {
    value = nextValue;
  });

  const selection = new ListSelection<string>({
    getValue: () => value,
    getItems: () => items,
    getMultiple: () => multiple,
    commit,
  });

  return { selection, commit, getValue: () => value };
}

describe('ListSelection', () => {
  describe('press', () => {
    it('replaces the selection in single selection', () => {
      const { selection, getValue } = setup({ multiple: false, value: ['a'] });
      selection.press(2, {}, EVENT);
      expect(getValue()).toEqual(['c']);
    });

    it('ignores modifiers in single selection', () => {
      const { selection, getValue } = setup({ multiple: false, value: ['a'] });
      selection.press(2, { shiftKey: true, ctrlKey: true }, EVENT);
      expect(getValue()).toEqual(['c']);
    });

    it('keeps the selection when a disabled item is pressed', () => {
      const { selection, getValue } = setup({ multiple: false, value: ['a'], disabled: ['c'] });
      selection.press(2, {}, EVENT);
      expect(getValue()).toEqual(['a']);
    });

    it('toggles the item with multiple selection', () => {
      const { selection, getValue } = setup({ multiple: true, value: ['a'] });
      selection.press(2, {}, EVENT);
      expect(getValue()).toEqual(['a', 'c']);
      selection.press(0, {}, EVENT);
      expect(getValue()).toEqual(['c']);
    });

    it('replaces the selection in opt-in mode', () => {
      const { selection, getValue } = setup({ multiple: 'opt-in', value: ['a', 'b'] });
      selection.press(2, {}, EVENT);
      expect(getValue()).toEqual(['c']);
    });

    it('toggles the item in opt-in mode with Ctrl', () => {
      const { selection, getValue } = setup({ multiple: 'opt-in', value: ['a'] });
      selection.press(2, { ctrlKey: true }, EVENT);
      expect(getValue()).toEqual(['a', 'c']);
    });

    it('toggles the item in opt-in mode on touch', () => {
      const { selection, getValue } = setup({ multiple: 'opt-in', value: ['a'] });
      selection.press(2, { touch: true }, EVENT);
      expect(getValue()).toEqual(['a', 'c']);
    });

    it('reports the press as the source, with the event', () => {
      const { selection, commit } = setup({ multiple: false });
      selection.press(1, {}, EVENT);
      expect(commit).toHaveBeenCalledWith(['b'], 'press', EVENT);
    });
  });

  describe('press with Shift', () => {
    it('selects the item alone when nothing was pressed before', () => {
      const { selection, getValue } = setup({ multiple: true, value: ['a'] });
      selection.press(3, { shiftKey: true }, EVENT);
      expect(getValue()).toEqual(['d']);
    });

    it('selects the range from the last pressed item, replacing the selection', () => {
      const { selection, getValue } = setup({ multiple: true, value: ['e'] });
      selection.press(1, {}, EVENT);
      selection.press(3, { shiftKey: true }, EVENT);
      expect(getValue()).toEqual(['b', 'c', 'd']);
    });

    it('keeps the anchor, so the range can shrink and flip around it', () => {
      const { selection, getValue } = setup({ multiple: true });
      selection.press(2, {}, EVENT);
      selection.press(4, { shiftKey: true }, EVENT);
      selection.press(3, { shiftKey: true }, EVENT);
      expect(getValue()).toEqual(['c', 'd']);
      selection.press(0, { shiftKey: true }, EVENT);
      expect(getValue()).toEqual(['a', 'b', 'c']);
    });

    it('skips disabled items in the range and keeps the selected disabled ones', () => {
      const { selection, getValue } = setup({
        multiple: true,
        value: ['e'],
        disabled: ['c', 'e'],
      });
      selection.press(0, {}, EVENT);
      selection.press(3, { shiftKey: true }, EVENT);
      expect(getValue()).toEqual(['a', 'b', 'd', 'e']);
    });

    it('adds the range to the selection in opt-in mode with Ctrl', () => {
      const { selection, getValue } = setup({ multiple: 'opt-in' });
      selection.press(0, {}, EVENT);
      selection.press(3, { ctrlKey: true }, EVENT);
      selection.press(4, { shiftKey: true, ctrlKey: true }, EVENT);
      expect(getValue()).toEqual(['a', 'd', 'e']);
    });
  });

  describe('keyboard commands', () => {
    it('moveTo moves the selection and the anchor', () => {
      const { selection, getValue, commit } = setup({ multiple: 'opt-in', value: ['a'] });
      selection.moveTo(2, EVENT);
      expect(commit).toHaveBeenLastCalledWith(['c'], 'keyboard', EVENT);
      selection.press(4, { shiftKey: true }, EVENT);
      expect(getValue()).toEqual(['c', 'd', 'e']);
    });

    it('moveTo clears the selection when the item is disabled', () => {
      const { selection, getValue } = setup({ multiple: 'opt-in', value: ['a'], disabled: ['c'] });
      selection.moveTo(2, EVENT);
      expect(getValue()).toEqual([]);
    });

    it('extendTo selects from the given anchor without moving the press anchor', () => {
      const { selection, getValue } = setup({ multiple: true });
      selection.press(0, {}, EVENT);
      selection.extendTo(4, 3, EVENT);
      expect(getValue()).toEqual(['d', 'e']);
      selection.press(1, { shiftKey: true }, EVENT);
      expect(getValue()).toEqual(['a', 'b']);
    });

    it('selectRange adds to the selection and moves the anchor', () => {
      const { selection, getValue } = setup({ multiple: true, value: ['a'] });
      selection.selectRange(2, 4, 4, EVENT);
      expect(getValue()).toEqual(['a', 'c', 'd', 'e']);
      selection.press(3, { shiftKey: true }, EVENT);
      expect(getValue()).toEqual(['d', 'e']);
    });

    it('selectAll leaves disabled items as they are', () => {
      const { selection, getValue } = setup({
        multiple: true,
        value: ['b'],
        disabled: ['b', 'c'],
      });
      selection.selectAll(EVENT);
      expect(getValue()).toEqual(['a', 'b', 'd', 'e']);
    });

    it('clear keeps the selected disabled items and reports Escape as the source', () => {
      const { selection, commit } = setup({ multiple: true, value: ['a', 'b'], disabled: ['b'] });
      selection.clear(EVENT);
      expect(commit).toHaveBeenCalledWith(['b'], 'escape', EVENT);
    });
  });
});
