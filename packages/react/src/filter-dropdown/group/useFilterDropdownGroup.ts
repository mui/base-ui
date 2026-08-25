'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useFilterDropdownItemContext } from '../root/FilterDropdownRootContext';
import {
  FilterDropdownGroupContext,
  useFilterDropdownGroupContext,
} from './FilterDropdownGroupContext';
import type { State as StoreState } from '../store';
import { useItemRegistry } from '../../internals/useItemRegistry';

function isGroupHidden(state: StoreState, items: ReadonlyMap<symbol, boolean>) {
  // A group with no members hasn't been filtered out, it hasn't registered yet.
  if (state.visibleItemIds === null || items.size === 0) {
    return false;
  }
  for (const [id, retained] of items) {
    if (retained || state.visibleItemIds.has(id)) {
      return false;
    }
  }
  return true;
}

export interface UseFilterDropdownGroupReturnValue {
  /**
   * Whether the query filtered out every item in the group, so its label doesn't linger over an
   * empty section.
   */
  hidden: boolean;
  /**
   * Provider value that collects the group's items.
   */
  context: FilterDropdownGroupContext;
  /** Whether the owning dropdown presents items in a grid. */
  grid: boolean;
}

/**
 * Tracks which items belong to a group and hides the group once none of them match.
 *
 * @internal
 */
export function useFilterDropdownGroup(): UseFilterDropdownGroupReturnValue {
  const { grid, store } = useFilterDropdownItemContext();
  const parentContext = useFilterDropdownGroupContext();
  const [items, registerItem] = useItemRegistry<symbol, boolean>();
  const hidden = useStore(store, isGroupHidden, items);

  // A nested container collects its own items, so the enclosing one only ever sees this
  // registration. Report visibility upward or a group of grid rows would look empty.
  const groupId = useRefWithInit(() => Symbol('filter-dropdown-group')).current;
  const registerInParent = parentContext?.registerItem;
  useIsoLayoutEffect(
    () => registerInParent?.(groupId, !hidden),
    [registerInParent, groupId, hidden],
  );

  const context = React.useMemo<FilterDropdownGroupContext>(
    () => ({ registerItem }),
    [registerItem],
  );

  return { hidden, context, grid };
}
