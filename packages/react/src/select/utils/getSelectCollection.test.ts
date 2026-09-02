import { expect, vi } from 'vitest';
import { getSelectCollection, getSelectItemLabel } from './getSelectCollection';

describe('getSelectCollection', () => {
  it('returns a flat array by identity, so the engine keeps its measurements', () => {
    const items = ['a', 'b', 'c'];
    const collection = getSelectCollection(items);

    expect(collection.problem).toBe(null);
    expect(collection.items).toBe(items);
  });

  it.each([
    ['no items', undefined, 'missing'],
    ['a record map, which has no order to window', { a: 'A', b: 'B' }, 'record'],
  ])('reports %s', (_name, items, problem) => {
    const collection = getSelectCollection(items as any);

    expect(collection.problem).toBe(problem);
    expect(collection.items).toEqual([]);
  });

  it('flattens grouped input while still reporting it, so the list renders enough to diagnose', () => {
    const collection = getSelectCollection([
      { value: 'Fruit', items: ['apple', 'pear'] },
      { value: 'Veg', items: ['leek'] },
    ] as any);

    expect(collection.problem).toBe('grouped');
    expect(collection.items).toEqual(['apple', 'pear', 'leek']);
  });
});

describe('getSelectItemLabel', () => {
  it.each([
    ['a plain string', 'apple', 'apple'],
    ['a number', 3, '3'],
    ['a labeled entry', { label: 'Apple', value: 'a' }, 'Apple'],
    ['a value-only object', { value: 'a' }, 'a'],
  ])('derives the label for %s without a callback', (_name, item, expected) => {
    expect(getSelectItemLabel(item, undefined)).toBe(expected);
  });

  it('passes the projected value to itemToStringLabel, not the row', () => {
    const itemToStringLabel = vi.fn((value: any) => `#${value}`);

    expect(getSelectItemLabel({ label: 'Apple', value: 'a' }, itemToStringLabel)).toBe('#a');
    expect(itemToStringLabel).toHaveBeenCalledWith('a');
  });

  it('passes a plain item straight through to itemToStringLabel', () => {
    const itemToStringLabel = vi.fn((value: any) => value.toUpperCase());

    expect(getSelectItemLabel('apple', itemToStringLabel)).toBe('APPLE');
  });

  // A nullish value has no label of its own, so the row's label is the only thing left to use.
  // The callback must never see the row: it is typed for a value and would throw on one.
  it.each([
    ['a null value', { label: 'None', value: null }],
    ['an undefined value', { label: 'None', value: undefined }],
  ])('falls back to the row label for %s, without calling the callback', (_name, item) => {
    const itemToStringLabel = vi.fn((value: any) => value.toUpperCase());

    expect(getSelectItemLabel(item, itemToStringLabel)).toBe('None');
    expect(itemToStringLabel).not.toHaveBeenCalled();
  });

  it('does not throw for a nullish value with a value-typed callback', () => {
    expect(() =>
      getSelectItemLabel({ label: 'None', value: null }, (value: any) => value.toUpperCase()),
    ).not.toThrow();
  });
});
