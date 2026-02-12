import { expect } from 'chai';
import { getFirstFlatItem, hasNullItemLabel } from './resolveValueLabel';

describe('resolveValueLabel', () => {
  describe('getFirstFlatItem', () => {
    it('returns the first item from the first non-empty group', () => {
      const items = [
        { value: 'empty', items: [] },
        { value: 'group-1', items: [{ value: 'a', label: 'A' }] },
      ];

      expect(getFirstFlatItem(items)).to.deep.equal({ value: 'a', label: 'A' });
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

      expect(hasNullItemLabel(items)).to.equal(true);
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

      expect(hasNullItemLabel(items)).to.equal(false);
    });

    it('returns false when grouped items do not contain a null-valued item', () => {
      const items = [
        {
          value: 'group-1',
          items: [{ value: 'a', label: 'A' }],
        },
      ];

      expect(hasNullItemLabel(items)).to.equal(false);
    });
  });
});
