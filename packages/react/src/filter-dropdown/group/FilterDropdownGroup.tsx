'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFilterDropdownPopupContext } from '../popup/FilterDropdownPopupContext';
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

/**
 * @internal
 */
export const FilterDropdownGroup = React.forwardRef(function FilterDropdownGroup(
  componentProps: FilterDropdownGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;
  const { store } = useFilterDropdownPopupContext();
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

  // The whole group hides when the query filters out every item in it, so its label doesn't
  // linger over an empty section.
  const hidden = useStore(store, isGroupHidden, membership);

  const contextValue: FilterDropdownGroupContext = React.useMemo(
    () => ({ registerItem }),
    [registerItem],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{ hidden: hidden || undefined }, elementProps],
  });

  return (
    <FilterDropdownGroupContext.Provider value={contextValue}>
      {element}
    </FilterDropdownGroupContext.Provider>
  );
});

export interface FilterDropdownGroupProps extends BaseUIComponentProps<'div', {}> {}

export namespace FilterDropdownGroup {
  export type Props = FilterDropdownGroupProps;
}
