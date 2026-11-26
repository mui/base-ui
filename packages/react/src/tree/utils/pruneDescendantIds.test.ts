import { describe, it, expect } from 'vitest';
import type { TreeState } from '../store/types';
import { buildItemsState } from '../store/itemIndex';
import { pruneDescendantIds } from './pruneDescendantIds';

interface Item {
  id: string;
  children?: Item[];
}

const ITEMS: Item[] = [
  { id: 'a', children: [{ id: 'a1', children: [{ id: 'a1a' }] }, { id: 'a2' }] },
  { id: 'b', children: [{ id: 'b1' }] },
];

function makeState(items: Item[]): TreeState {
  const lookups = buildItemsState<Item>(items, {
    itemToId: (item) => item.id,
    itemToStringLabel: (item) => item.id,
    itemToChildren: (item) => item.children,
    isItemDisabled: () => false,
    isItemSelectionDisabled: () => false,
  });
  return lookups as unknown as TreeState;
}

describe('pruneDescendantIds', () => {
  const state = makeState(ITEMS);

  it('keeps only the topmost item when an ancestor is also present', () => {
    expect(pruneDescendantIds(new Set(['a', 'a1', 'a2']), state)).toEqual(['a']);
  });

  it('drops deep descendants of an included ancestor', () => {
    expect(pruneDescendantIds(new Set(['a', 'a1a']), state)).toEqual(['a']);
  });

  it('keeps independent subtrees', () => {
    const result = pruneDescendantIds(new Set(['a1', 'b1']), state);
    expect(new Set(result)).toEqual(new Set(['a1', 'b1']));
  });

  it('keeps siblings whose ancestors are not in the set', () => {
    const result = pruneDescendantIds(new Set(['a1', 'a2']), state);
    expect(new Set(result)).toEqual(new Set(['a1', 'a2']));
  });
});
