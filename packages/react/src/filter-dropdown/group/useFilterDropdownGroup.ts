'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useStore } from '@base-ui/utils/store';
import { useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';
import { FilterDropdownGroupContext } from './FilterDropdownGroupContext';
import type { State as StoreState } from '../store';

interface GroupMembership {
  items: ReadonlyMap<symbol, boolean>;
  version: number;
}

function isGroupHidden(state: StoreState, membership: GroupMembership) {
  // A group with no members hasn't been filtered out, it hasn't registered yet.
  if (state.visibleItemIds === null || membership.items.size === 0) {
    return false;
  }
  for (const [id, retained] of membership.items) {
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
}

/**
 * Tracks which items belong to a group and hides the group once none of them match.
 *
 * @internal
 */
export function useFilterDropdownGroup(): UseFilterDropdownGroupReturnValue {
  const { store } = useFilterDropdownRootContext();
  const items = useRefWithInit(() => new Map<symbol, boolean>()).current;
  const [membershipVersion, setMembershipVersion] = React.useState(0);

  const registerItem = useStableCallback((id: symbol, retained: boolean) => {
    items.set(id, retained);
    setMembershipVersion((version) => version + 1);
    return () => {
      items.delete(id);
      setMembershipVersion((version) => version + 1);
    };
  });

  const membership = React.useMemo<GroupMembership>(
    () => ({ items, version: membershipVersion }),
    [items, membershipVersion],
  );

  const hidden = useStore(store, isGroupHidden, membership);

  const context = React.useMemo<FilterDropdownGroupContext>(
    () => ({ registerItem }),
    [registerItem],
  );

  return { hidden, context };
}
