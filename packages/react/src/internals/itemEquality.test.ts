import { expect, describe, it } from 'vitest';
import { defaultItemEquality, findSelectionIndex, resolveSelectedIndex } from './itemEquality';

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

describe('resolveSelectedIndex', () => {
  const registry = ['a', 'b', 'c'];

  function resolve(index: number, selectedValues: string[], currentIndex: number | null) {
    return resolveSelectedIndex(
      index,
      registry[index],
      registry,
      selectedValues,
      defaultItemEquality,
      currentIndex,
    );
  }

  it('does not claim an unselected item', () => {
    expect(resolve(1, ['a', 'c'], null)).toBe(null);
  });

  it('claims when no item holds the index yet', () => {
    expect(resolve(2, ['c'], null)).toBe(2);
  });

  it('claims from a later holder', () => {
    expect(resolve(0, ['a', 'c'], 2)).toBe(0);
  });

  it('leaves the index with an earlier selected holder', () => {
    expect(resolve(2, ['a', 'c'], 0)).toBe(0);
  });

  it('takes over from an earlier holder that is no longer selected', () => {
    // `a` held the index but has been deselected, so `b` takes it and `c` then defers.
    expect(resolve(0, ['b', 'c'], 0)).toBe(1);
    expect(resolve(2, ['b', 'c'], 1)).toBe(1);
  });

  it('takes over when the earlier holder has left the registry', () => {
    const sparseRegistry: string[] = [];
    sparseRegistry[1] = 'b';
    sparseRegistry[2] = 'c';

    expect(resolveSelectedIndex(2, 'c', sparseRegistry, ['c'], defaultItemEquality, 0)).toBe(2);
  });
});
