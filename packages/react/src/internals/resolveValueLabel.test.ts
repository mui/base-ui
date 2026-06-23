import * as React from 'react';
import { expect } from 'vitest';
import {
  findItemIndexByValue,
  hasNullItemLabel,
  resolveLabelString,
  resolveRenderedValue,
  resolveSelectedLabel,
} from './resolveValueLabel';
import { defaultItemEquality } from './itemEquality';

describe('resolveValueLabel', () => {
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

  describe('findItemIndexByValue', () => {
    it('matches a primitive value against a labeled item by its inferred value', () => {
      const items = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ];

      expect(findItemIndexByValue(items, 'b', defaultItemEquality)).toBe(1);
    });

    it('matches a whole `{ value, label }` value against the full item', () => {
      const items = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ];

      expect(findItemIndexByValue(items, items[1], defaultItemEquality)).toBe(1);
    });

    it('matches an inner object value shaped like a labeled item by the item value', () => {
      const inner = { value: 'ca', label: 'Canada' };
      const items = [
        { value: { value: 'us', label: 'United States' }, label: 'US' },
        { value: inner, label: 'CA' },
      ];

      // `inner` looks like a `{ value, label }` item but is an item *value*, so it must
      // match by the inferred item value rather than being treated as a whole item.
      expect(findItemIndexByValue(items, inner, defaultItemEquality)).toBe(1);
    });

    it('only hands whole items to a whole-item comparator', () => {
      const items = [
        { value: { id: 1 }, label: 'One' },
        { value: { id: 2 }, label: 'Two' },
      ];
      const seen: any[] = [];
      const comparator = (a: any, b: any) => {
        seen.push(a);
        // Reads `a.value.id`; would throw if handed an inferred inner value.
        return a.value.id === b.value.id;
      };

      expect(findItemIndexByValue(items, items[1], comparator)).toBe(1);
      expect(seen.every((item) => item && 'label' in item)).toBe(true);
    });

    it('returns -1 when a labeled-shaped value matches neither a whole item nor an inferred value', () => {
      const items = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ];

      expect(findItemIndexByValue(items, { value: 'z', label: 'Z' }, defaultItemEquality)).toBe(-1);
    });

    it('matches a falsy primitive value (0) against a labeled item', () => {
      const items = [
        { value: 0, label: 'Zero' },
        { value: 1, label: 'One' },
      ];

      expect(findItemIndexByValue(items, 0, defaultItemEquality)).toBe(0);
    });
  });

  describe('resolveLabelString', () => {
    const items = [
      { value: 1, label: 'Apple' },
      { value: 2, label: 'Banana' },
    ];

    it('resolves a primitive selected value to its item label string', () => {
      expect(resolveLabelString(2, items)).toBe('Banana');
    });

    it('coerces a numeric label to a string', () => {
      expect(resolveLabelString('a', [{ value: 'a', label: 5 }])).toBe('5');
    });

    it('returns an empty string for a boolean label', () => {
      expect(resolveLabelString('a', [{ value: 'a', label: true as any }])).toBe('');
    });

    it('falls back to stringifying the value when the label is a non-text ReactNode', () => {
      const jsxLabel = React.createElement('b', null, 'Apple');
      expect(resolveLabelString(1, [{ value: 1, label: jsxLabel }])).toBe('1');
    });

    it('prefers itemToStringLabel over item labels', () => {
      expect(resolveLabelString(2, items, () => 'Custom')).toBe('Custom');
    });

    it('falls back to stringifying the value when no item matches', () => {
      expect(resolveLabelString(99, items)).toBe('99');
    });
  });

  describe('resolveSelectedLabel', () => {
    it('matches a primitive value against a labeled item by its inferred value', () => {
      const items = [
        { value: 'a', label: 'Apple' },
        { value: 'b', label: 'Banana' },
      ];

      expect(resolveSelectedLabel('b', items)).toBe('Banana');
    });

    it('prefers an explicit label on an object value', () => {
      expect(
        resolveSelectedLabel({ value: 'x', label: 'Explicit' }, [{ value: 'x', label: 'Item' }]),
      ).toBe('Explicit');
    });

    it('resolves the label using a custom equality comparer', () => {
      const items = [
        { value: { id: 1 }, label: 'One' },
        { value: { id: 2 }, label: 'Two' },
      ];
      const isItemEqualToValue = (itemValue: any, value: any) => itemValue.id === value.id;

      expect(resolveSelectedLabel({ id: 2 }, items, undefined, isItemEqualToValue)).toBe('Two');
    });
  });

  describe('resolveRenderedValue', () => {
    it('returns the registered rendered value when present', () => {
      expect(resolveRenderedValue('rendered', { value: 'a', label: 'A' }, false)).toBe('rendered');
    });

    it('infers the value from a labeled item for an unregistered non-virtualized slot', () => {
      expect(resolveRenderedValue(undefined, { value: 'a', label: 'A' }, false)).toBe('a');
    });

    it('returns a primitive candidate unchanged for an unregistered non-virtualized slot', () => {
      expect(resolveRenderedValue(undefined, 'a', false)).toBe('a');
    });

    it('keeps the whole item for an unregistered virtualized slot', () => {
      const item = { value: 'a', label: 'A' };
      expect(resolveRenderedValue(undefined, item, true)).toBe(item);
    });
  });
});
