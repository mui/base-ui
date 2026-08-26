import { expect } from 'vitest';
import { defaultItemEquality, findSelectionIndex, shouldClaimSelectedIndex } from './itemEquality';

describe('findSelectionIndex', () => {
  const items = ['a', 'b', 'c'];

  it('anchors to the first selected item in rendered order, not value order', () => {
    expect(findSelectionIndex(items, ['c', 'b'], defaultItemEquality, true)).toBe(1);
    expect(findSelectionIndex(items, ['b', 'c'], defaultItemEquality, true)).toBe(1);
  });

  it('returns null when nothing in the value array is rendered', () => {
    expect(findSelectionIndex(items, [], defaultItemEquality, true)).toBe(null);
    expect(findSelectionIndex(items, ['d'], defaultItemEquality, true)).toBe(null);
  });

  it('treats an array as a single value outside multiple mode', () => {
    const arrayValue = ['x', 'y'];
    const comparer = (itemValue: unknown, selectedValue: unknown) =>
      JSON.stringify(itemValue) === JSON.stringify(selectedValue);

    expect(
      findSelectionIndex<string | string[], string[]>(
        ['a', arrayValue],
        arrayValue,
        comparer,
        false,
      ),
    ).toBe(1);
  });
});

describe('shouldClaimSelectedIndex', () => {
  const registry = ['a', 'b', 'c'];

  function claims(index: number, selectedValues: string[], currentIndex: number | null) {
    return shouldClaimSelectedIndex(
      index,
      registry[index],
      registry,
      selectedValues,
      defaultItemEquality,
      currentIndex,
    );
  }

  it('does not claim an unselected item', () => {
    expect(claims(1, ['a', 'c'], null)).toBe(false);
  });

  it('claims when no item holds the index yet', () => {
    expect(claims(2, ['c'], null)).toBe(true);
  });

  it('claims from a later holder', () => {
    expect(claims(0, ['a', 'c'], 2)).toBe(true);
  });

  it('leaves the index with an earlier selected holder', () => {
    expect(claims(2, ['a', 'c'], 0)).toBe(false);
  });

  it('takes over from an earlier holder that is no longer selected', () => {
    // `a` held the index but has been deselected, so `b` takes it and `c` then defers.
    expect(claims(1, ['b', 'c'], 0)).toBe(true);
    expect(claims(2, ['b', 'c'], 1)).toBe(false);
  });

  it('takes over when the earlier holder has left the registry', () => {
    const sparseRegistry: string[] = [];
    sparseRegistry[1] = 'b';
    sparseRegistry[2] = 'c';

    expect(shouldClaimSelectedIndex(2, 'c', sparseRegistry, ['c'], defaultItemEquality, 0)).toBe(
      true,
    );
  });
});
