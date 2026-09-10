import { expect, describe, it } from 'vitest';
import { isRowFarFromWindow } from './usePendingScroll';

describe('isRowFarFromWindow', () => {
  const window = { firstRowIndex: 10, lastRowIndex: 20 };

  it('judges a flat list in rows', () => {
    expect(isRowFarFromWindow(15, window, undefined)).toBe(false);
    expect(isRowFarFromWindow(0, window, undefined)).toBe(false);
    expect(isRowFarFromWindow(30, window, undefined)).toBe(false);
    expect(isRowFarFromWindow(31, window, undefined)).toBe(true);
    expect(isRowFarFromWindow(-1, window, undefined)).toBe(true);
  });

  it('judges a grouped list in items, so headers add no distance', () => {
    // One item, fifty empty groups, one item: rows 0..53 hold two items. Row 53 is 52 rows past a
    // window on the first item, and one item past it.
    const itemCountBeforeRow = [0, 0, ...Array.from({ length: 50 }, () => 1), 1, 1, 2];
    expect(itemCountBeforeRow).toHaveLength(55);

    expect(isRowFarFromWindow(53, { firstRowIndex: 0, lastRowIndex: 2 }, itemCountBeforeRow)).toBe(
      false,
    );
    expect(isRowFarFromWindow(53, { firstRowIndex: 0, lastRowIndex: 2 }, undefined)).toBe(true);
  });

  it('still finds a distant item in a grouped list', () => {
    // Twenty groups of two items: item index equals rows minus headers.
    const itemCountBeforeRow: number[] = [];
    let items = 0;
    for (let group = 0; group < 20; group += 1) {
      itemCountBeforeRow.push(items, items, items + 1);
      items += 2;
    }
    itemCountBeforeRow.push(items);

    // Row 59 is item 38; a window over the first six rows ends at item 4.
    expect(isRowFarFromWindow(59, { firstRowIndex: 0, lastRowIndex: 6 }, itemCountBeforeRow)).toBe(
      true,
    );
    expect(isRowFarFromWindow(20, { firstRowIndex: 0, lastRowIndex: 6 }, itemCountBeforeRow)).toBe(
      false,
    );
  });
});
