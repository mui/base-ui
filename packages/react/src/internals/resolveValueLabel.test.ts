import { expect } from 'vitest';
import { hasNullItemLabel, isGroupedItems, resolveSelectedLabel } from './resolveValueLabel';

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
});
