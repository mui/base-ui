import { expect, vi, describe, it } from 'vitest';
import { areArraysEqual } from './areArraysEqual';

describe('areArraysEqual', () => {
  it('returns true for arrays with the same elements in the same order', () => {
    expect(areArraysEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('returns false when elements differ', () => {
    expect(areArraysEqual([1, 2, 3], [1, 2, 4])).toBe(false);
  });

  it('returns false when lengths differ', () => {
    expect(areArraysEqual([1, 2, 3], [1, 2])).toBe(false);
  });

  it('returns true for the same array reference', () => {
    const arr = [1, 2, 3];
    expect(areArraysEqual(arr, arr)).toBe(true);
  });

  it('returns true for two empty arrays', () => {
    expect(areArraysEqual([], [])).toBe(true);
  });

  it('treats NaN as equal to NaN (Object.is semantics)', () => {
    expect(areArraysEqual([NaN], [NaN])).toBe(true);
  });

  it('treats 0 as different from -0 (Object.is semantics)', () => {
    expect(areArraysEqual([0], [-0])).toBe(false);
  });

  it('compares by reference by default', () => {
    expect(areArraysEqual([{ id: 1 }], [{ id: 1 }])).toBe(false);
  });

  it('uses the provided comparer', () => {
    const a = [{ id: 1 }, { id: 2 }];
    const b = [{ id: 1 }, { id: 2 }];

    expect(areArraysEqual(a, b, (x, y) => x.id === y.id)).toBe(true);
  });

  it('lets the provided comparer override Object.is semantics', () => {
    expect(areArraysEqual([0], [-0], (a, b) => a === b)).toBe(true);
  });

  it('consults the provided comparer even for the same array reference', () => {
    const arr = [1, 2, 3];
    const itemComparer = vi.fn(() => false);

    expect(areArraysEqual(arr, arr, itemComparer)).toBe(false);
    expect(itemComparer).toHaveBeenCalled();
  });
});
