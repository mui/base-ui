'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useStore } from '@base-ui/utils/store';
import { useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';
import { FilterDropdownGroupContext } from './FilterDropdownGroupContext';
import type { State as StoreState } from '../store';

interface GroupMembership {
  ids: ReadonlySet<symbol>;
  version: number;
}

function isGroupHidden(state: StoreState, membership: GroupMembership) {
  if (state.visibleItemIds === null) {
    return false;
  }
  for (const id of membership.ids) {
    if (state.visibleItemIds.has(id)) {
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
  const itemIds = useRefWithInit(() => new Set<symbol>()).current;
  const [membershipVersion, setMembershipVersion] = React.useState(0);

  const registerItem = useStableCallback((id: symbol) => {
    itemIds.add(id);
    setMembershipVersion((version) => version + 1);
    return () => {
      itemIds.delete(id);
      setMembershipVersion((version) => version + 1);
    };
  });

  const membership = React.useMemo<GroupMembership>(
    () => ({ ids: itemIds, version: membershipVersion }),
    [itemIds, membershipVersion],
  );

  const hidden = useStore(store, isGroupHidden, membership);

  const context = React.useMemo<FilterDropdownGroupContext>(
    () => ({ registerItem }),
    [registerItem],
  );

  return { hidden, context };
}
