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

  it('anchors to the first selected item with a custom comparer', () => {
    const comparer = (itemValue: string, selectedValue: string) =>
      itemValue.toLowerCase() === selectedValue.toLowerCase();

    expect(findSelectionIndex(items, ['C', 'B'], comparer, true)).toBe(1);
    expect(findSelectionIndex(items, ['D'], comparer, true)).toBe(null);
  });

  it('reads the selected values once instead of rescanning them for every item', () => {
    // Nothing is selected, so the search cannot stop early and has to visit every item.
    const itemValues = Array.from({ length: 200 }, (_, i) => `item-${i}`);

    // Counting element reads rather than comparer calls: the fast path never calls the
    // comparer, so a comparison count would pass at 0 no matter how often the values are read.
    let reads = 0;
    const selectedValues = new Proxy(
      Array.from({ length: 100 }, (_, i) => `filtered-out-${i}`),
      {
        get(target, key, receiver) {
          if (typeof key === 'string' && String(Number(key)) === key) {
            reads += 1;
          }
          return Reflect.get(target, key, receiver);
        },
      },
    );

    expect(findSelectionIndex(itemValues, selectedValues, defaultItemEquality, true)).toBe(null);
    // Rescanning the selected values for every item would be 200 * 100 = 20,000 reads.
    expect(reads).toBeLessThanOrEqual(itemValues.length + selectedValues.length);
  });

  it('keeps `+0` and `-0` distinct, like `Object.is`', () => {
    expect(findSelectionIndex([-0], [0], defaultItemEquality, true)).toBe(null);
    expect(findSelectionIndex([0], [-0], defaultItemEquality, true)).toBe(null);
    expect(findSelectionIndex([-0], [-0], defaultItemEquality, true)).toBe(0);
    expect(findSelectionIndex([1, 0], [2, 0], defaultItemEquality, true)).toBe(1);

    // More than one value on each side, so the zero is matched against a real selection.
    expect(findSelectionIndex([1, -0], [2, 0], defaultItemEquality, true)).toBe(null);
    expect(findSelectionIndex([1, -0], [2, -0], defaultItemEquality, true)).toBe(1);
  });

  it('matches `NaN` and `null` against themselves', () => {
    expect(findSelectionIndex([1, NaN], [NaN], defaultItemEquality, true)).toBe(1);
    expect(findSelectionIndex(['a', null], [null], defaultItemEquality, true)).toBe(1);
  });

  it('never matches an `undefined` item or an `undefined` selected value', () => {
    expect(findSelectionIndex([undefined, 'b'], [undefined, 'b'], defaultItemEquality, true)).toBe(
      1,
    );
    expect(findSelectionIndex([undefined], [undefined], defaultItemEquality, true)).toBe(null);
  });

  it('never matches a hole left by an unmounted item', () => {
    // The registry goes sparse because `SelectItem`/`ComboboxItem` `delete` their slot on
    // unmount; the value array goes sparse only if a consumer hands one over that way.
    const sparseItems: string[] = [];
    sparseItems[2] = 'c';
    const sparseSelection: string[] = [];
    sparseSelection[1] = 'c';

    expect(findSelectionIndex(sparseItems, sparseSelection, defaultItemEquality, true)).toBe(2);
    expect(findSelectionIndex(sparseItems, [], defaultItemEquality, true)).toBe(null);
  });

  it('builds the index without consulting an own `Symbol.iterator`', () => {
    // A deliberate lock on how the index is built rather than a behaviour consumers rely on.
    // The scan this replaced went through `Array.prototype.some`, which reads by index; the
    // shorter `new Set(selectedValues)` iterates instead, which resolves a different anchor
    // for the first array below and throws outright for the second.
    const customIterator = ['b'];
    (customIterator as any)[Symbol.iterator] = function* iterate() {
      yield 'a';
    };
    expect(findSelectionIndex(['a', 'b'], customIterator, defaultItemEquality, true)).toBe(1);

    const nulledIterator = ['b'];
    (nulledIterator as any)[Symbol.iterator] = null;
    expect(findSelectionIndex(['a', 'b'], nulledIterator, defaultItemEquality, true)).toBe(1);
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
