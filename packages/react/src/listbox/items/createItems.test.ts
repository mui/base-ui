import { expect, vi, describe, it } from 'vitest';
import { Listbox } from '@base-ui/react/listbox';

describe('Listbox.createItems', () => {
  const fruits = [
    { id: 'apple', name: 'Apple' },
    { id: 'banana', name: 'Banana' },
  ];

  describe('get', () => {
    it('returns the item with a value', () => {
      const items = Listbox.createItems(fruits, {
        getValue: (fruit) => fruit.id,
        getLabel: (fruit) => fruit.name,
      });

      expect(items.get('banana')).toBe(fruits[1]);
    });

    it('derives the values on the first lookup, not when the collection is created', () => {
      const getValue = vi.fn((fruit: (typeof fruits)[number]) => fruit.id);
      const items = Listbox.createItems(fruits, { getValue, getLabel: (fruit) => fruit.name });
      expect(getValue).not.toHaveBeenCalled();

      items.get('apple');
      items.get('banana');

      expect(getValue).toHaveBeenCalledTimes(fruits.length);
    });
  });
});
