import { describe, it, expect } from 'vitest';
import type { TreeState } from '../store/types';
import { buildItemsState } from '../store/itemIndex';
import { sortIdsByTreeOrder } from './sortIdsByTreeOrder';

interface Item {
  id: string;
  children?: Item[];
}

// Preorder of this tree: a, a1, a2, a3, b, b1, c
const ITEMS: Item[] = [
  { id: 'a', children: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }] },
  { id: 'b', children: [{ id: 'b1' }] },
  { id: 'c' },
];

function makeState(items: Item[]): TreeState {
  const lookups = buildItemsState<Item>(items, {
    itemToId: (item) => item.id,
    itemToStringLabel: (item) => item.id,
    itemToChildren: (item) => item.children,
    isItemDisabled: () => false,
    isItemSelectionDisabled: () => false,
  });
  // The util only reads the lookup tables, so a lookup-only state is sufficient.
  return lookups as unknown as TreeState;
}

describe('sortIdsByTreeOrder', () => {
  const state = makeState(ITEMS);

  it('sorts reversed input back into tree order', () => {
    expect(sortIdsByTreeOrder(['a3', 'a1'], state)).toEqual(['a1', 'a3']);
  });

  it('sorts ids spanning multiple parents into preorder', () => {
    expect(sortIdsByTreeOrder(['c', 'a', 'b1', 'a2'], state)).toEqual(['a', 'a2', 'b1', 'c']);
  });

  it('orders a parent before its own descendants', () => {
    expect(sortIdsByTreeOrder(['a1', 'a'], state)).toEqual(['a', 'a1']);
  });

  it('does not depend on expansion state (collapsed items still order correctly)', () => {
    // The fixture has no expanded items, yet siblings under a collapsed parent
    // still sort by their sibling index.
    expect(sortIdsByTreeOrder(['b1', 'a3', 'a1'], state)).toEqual(['a1', 'a3', 'b1']);
  });
});
