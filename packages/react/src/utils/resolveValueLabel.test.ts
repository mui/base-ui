import { expect, vi } from 'vitest';
import { compareItemEquality } from './itemEquality';
import { hasNullItemLabel, resolveSelectedLabelString } from './resolveValueLabel';

describe('resolveValueLabel', () => {
  describe('resolveSelectedLabelString', () => {
    it('prefers a matching items label over itemToStringLabel for primitive values', () => {
      const itemToStringLabel = vi.fn(() => 'WRONG');

      expect(
        resolveSelectedLabelString(
          'b',
          [
            { value: 'a', label: 'Apple' },
            { value: 'b', label: 'Banana' },
          ],
          itemToStringLabel,
        ),
      ).toBe('Banana');
      expect(itemToStringLabel).not.toHaveBeenCalled();
    });

    it('uses custom equality when matching primitive values to item labels', () => {
      expect(
        resolveSelectedLabelString(
          'B',
          [
            { value: 'a', label: 'Apple' },
            { value: 'b', label: 'Banana' },
          ],
          undefined,
          (itemValue, value) =>
            compareItemEquality(
              String(itemValue).toLowerCase(),
              String(value).toLowerCase(),
              Object.is,
            ),
        ),
      ).toBe('Banana');
    });
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
});
