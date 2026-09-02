import { describe, expect, it } from 'vitest';
import {
  getItemValue,
  hasNullItemLabel,
  isGroupedItems,
  isLabeledItem,
  resolveMultipleLabels,
  resolveSelectedLabel,
} from './resolveValueLabel';

describe('resolveValueLabel', () => {
  describe('isGroupedItems', () => {
    it.each([
      ['an undefined items field', [{ value: 'a', items: undefined }], false],
      ['a non-array items field', [{ value: 'a', items: 3 }], false],
      ['an array items field', [{ value: 'group', items: [] }], true],
      [
        'a list that starts with a flat item',
        [{ value: 'a' }, { value: 'group', items: [] }],
        false,
      ],
    ])('classifies %s', (_name, items, expected) => {
      expect(isGroupedItems(items)).toBe(expected);
    });
  });

  it('resolves a flat item label when the item has an unrelated items field', () => {
    const items = [{ value: 'a', label: 'A', items: 'metadata' }];

    expect(resolveSelectedLabel('a', items)).toBe('A');
  });

  describe('hasNullItemLabel', () => {
    it('returns true when grouped items contain a null-valued item with a label', () => {
      const items = [
        {
          value: 'group-1',
          items: [
            { value: 'a', label: 'A' },
            { value: null, label: 'Select' },
          ],
        },
      ];

      expect(hasNullItemLabel(items)).toBe(true);
    });

    it('returns false when grouped items contain a null-valued item without a label', () => {
      const items = [
        {
          value: 'group-1',
          items: [
            { value: null, label: null },
            { value: 'a', label: 'A' },
          ],
        },
      ];

      expect(hasNullItemLabel(items)).toBe(false);
    });

    it('returns false when grouped items do not contain a null-valued item', () => {
      const items = [
        {
          value: 'group-1',
          items: [{ value: 'a', label: 'A' }],
        },
      ];

      expect(hasNullItemLabel(items)).toBe(false);
    });

    it('supports grouped items with custom heading keys', () => {
      const items = [
        {
          heading: 'group-1',
          items: [
            { value: 'a', label: 'A' },
            { value: null, label: 'Select' },
          ],
        },
      ];

      expect(hasNullItemLabel(items)).toBe(true);
    });

    it('returns true when flat items contain a null-valued item with a label', () => {
      const items = [
        { value: 'a', label: 'A' },
        { value: null, label: 'None' },
      ];

      expect(hasNullItemLabel(items)).toBe(true);
    });

    it('returns false when flat items do not contain a null-valued item', () => {
      const items = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ];

      expect(hasNullItemLabel(items)).toBe(false);
    });

    it('returns false when items is a Record without a "null" key', () => {
      const items = {
        sans: 'Sans-serif',
        serif: 'Serif',
        mono: 'Monospace',
      };

      expect(hasNullItemLabel(items)).toBe(false);
    });

    it('returns true when items is a Record with a "null" key', () => {
      const items = {
        null: 'None',
        sans: 'Sans-serif',
        serif: 'Serif',
      };

      expect(hasNullItemLabel(items)).toBe(true);
    });

    it('returns false when items is undefined', () => {
      expect(hasNullItemLabel(undefined)).toBe(false);
    });
  });

  describe('record items with prototype member names', () => {
    it('falls back to the stringified label when the value matches an Object.prototype member', () => {
      const items = { sans: 'Sans-serif', serif: 'Serif', mono: 'Monospace' };

      expect(resolveSelectedLabel('constructor', items)).toBe('constructor');
      expect(resolveSelectedLabel('toString', items)).toBe('toString');
      expect(resolveSelectedLabel('hasOwnProperty', items)).toBe('hasOwnProperty');
      expect(resolveSelectedLabel('__proto__', items)).toBe('__proto__');
    });

    it('resolves an own key that matches an Object.prototype member', () => {
      const items = { constructor: 'Custom constructor', sans: 'Sans-serif' };

      expect(resolveSelectedLabel('constructor', items)).toBe('Custom constructor');
    });

    it('keeps resolving the null placeholder key in a record', () => {
      const items = { null: 'None', sans: 'Sans-serif' };

      expect(resolveSelectedLabel(null, items)).toBe('None');
    });

    it('falls back to the stringified label when an own key has a nullish label', () => {
      expect(resolveSelectedLabel('sans', { sans: undefined })).toBe('sans');
      expect(resolveSelectedLabel('sans', { sans: null })).toBe('sans');
    });
  });

  describe('getItemValue', () => {
    it.each([
      ['a labeled item', { label: 'A', value: 'a' }, 'a'],
      ['a labeled item with an object value', { label: 'A', value: { id: 1 } }, { id: 1 }],
      ['a labeled item with a numeric value', { label: 'A', value: 3 }, 3],
      ['a plain string', 'a', 'a'],
      ['a plain number', 3, 3],
      ['an object without a label', { value: 'a' }, { value: 'a' }],
      ['null', null, null],
      ['undefined', undefined, undefined],
    ])('projects %s', (_name, item, expected) => {
      expect(getItemValue(item)).toEqual(expected);
    });

    it('returns the value unserialized, unlike the form stringifier', () => {
      expect(getItemValue({ label: 'Three', value: 3 })).toBe(3);
      expect(getItemValue({ label: 'Three', value: 3 })).not.toBe('3');
    });

    it('does not throw on null, which `typeof` reports as an object', () => {
      expect(() => isLabeledItem(null)).not.toThrow();
      expect(isLabeledItem(null)).toBe(false);
    });
  });

  describe('label resolution over a widened items array', () => {
    // The `items` prop accepts plain values, so an array can hold entries that have no `value`
    // property at all — including `null`, which dereferencing would throw on.
    const items = [
      null,
      undefined,
      'plain',
      3,
      { label: 'Labeled', value: 'labeled' },
      { value: 'bare' },
    ];

    it.each([
      ['a null entry', null],
      ['an undefined entry', undefined],
      ['a plain string entry', 'plain'],
      ['a numeric entry', 3],
      ['a labeled entry', 'labeled'],
      ['a value absent from the array', 'missing'],
    ])('resolves %s without throwing', (_name, value) => {
      expect(() => resolveSelectedLabel(value, items as any)).not.toThrow();
    });

    it('resolves a labeled entry to its label', () => {
      expect(resolveSelectedLabel('labeled', items as any)).toBe('Labeled');
    });

    it('falls back to the value itself for a plain entry', () => {
      expect(resolveSelectedLabel('plain', items as any)).toBe('plain');
    });

    it('resolves multiple labels over the same array without throwing', () => {
      expect(() => resolveMultipleLabels(['labeled', 'plain', null], items as any)).not.toThrow();
    });
  });
});
