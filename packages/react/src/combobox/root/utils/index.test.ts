import { expect, describe, it } from 'vitest';
import { getTextMatcher } from '../../../internals/filter';
import {
  createCollatorItemFilter,
  createSingleSelectionCollatorFilter,
  getComboboxPopupId,
} from './index';

describe('Combobox root utilities', () => {
  const matcher = getTextMatcher({ locale: 'en' });
  const filter = matcher.filter;

  describe('getComboboxPopupId', () => {
    it('derives an id only when the root has an id', () => {
      expect(getComboboxPopupId('fruit')).toBe('fruit-popup');
      expect(getComboboxPopupId(null)).toBe(undefined);
      expect(getComboboxPopupId(undefined)).toBe(undefined);
    });
  });

  describe('createCollatorItemFilter', () => {
    it('rejects nullish items and filters primitives and projected objects', () => {
      const primitiveFilter = createCollatorItemFilter(filter);
      const objectFilter = createCollatorItemFilter(filter, (item: { name: string }) => item.name);

      expect(primitiveFilter(null, 'app')).toBe(false);
      expect(primitiveFilter(undefined, 'app')).toBe(false);
      expect(primitiveFilter('Apple', 'app')).toBe(true);
      expect(objectFilter({ name: 'Banana' }, 'nan')).toBe(true);
    });
  });

  describe('createSingleSelectionCollatorFilter', () => {
    it('shows all items for an empty query and rejects nullish items', () => {
      const itemFilter = createSingleSelectionCollatorFilter(matcher);

      expect(itemFilter(null, 'app')).toBe(false);
      expect(itemFilter(undefined, 'app')).toBe(false);
      expect(itemFilter('Apple', '')).toBe(true);
    });

    it('shows all items when the query exactly matches the selected label', () => {
      const itemFilter = createSingleSelectionCollatorFilter(matcher, undefined, 'Apple');

      expect(itemFilter('Banana', 'apple')).toBe(true);
    });

    it('otherwise filters the current item', () => {
      const itemFilter = createSingleSelectionCollatorFilter(matcher, undefined, 'Apple');

      expect(itemFilter('Banana', 'app')).toBe(false);
      expect(itemFilter('Banana', 'nan')).toBe(true);
    });
  });
});
