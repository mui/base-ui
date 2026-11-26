'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { TreeItemId, FlatListEntry } from '../store/types';
import { useTreeRootContext } from '../root/TreeRootContext';
import { selectors } from '../store/selectors';
import { TreeGroupTransitionContext } from '../group-transition/TreeGroupTransitionContext';
import type { TreeGroupTransitionContextValue } from '../group-transition/TreeGroupTransitionContext';
import { TreeItemModelProvider } from '../utils/TreeItemModelProvider';
import { getItemIdKey } from '../utils/itemIdKey';
import { TreeRowsContext } from './TreeRowsContext';

/**
 * Renders every visible row with `children`, for `Tree.List` and the parts of
 * `TreeGrid` that render rows.
 */
export function TreeRows<TItem>(props: TreeRows.Props<TItem>): React.JSX.Element {
  const { children } = props;
  const store = useTreeRootContext();

  const flatListEntries = useStore(store, selectors.flatListWithGroupTransitions);

  // Every row gets the same provider, whether or not a group animates: the list
  // switches between both layouts whenever a group starts or stops animating,
  // and a different element type at each row's position would remount the
  // entire row subtree. The row's own ID tells a `Tree.GroupTransition` which
  // row renders it.
  const renderRow = (
    itemId: TreeItemId,
    contextValue: TreeGroupTransitionContextValue = itemId,
  ) => (
    <TreeGroupTransitionContext.Provider key={getItemIdKey(itemId)} value={contextValue}>
      <TreeItemModelProvider store={store} itemId={itemId}>
        {children}
      </TreeItemModelProvider>
    </TreeGroupTransitionContext.Provider>
  );

  let rows: React.ReactNode;
  if (isPlainList(flatListEntries)) {
    rows = flatListEntries.map((itemId) => renderRow(itemId));
  } else {
    const groups = new Map<TreeItemId, Extract<FlatListEntry, { type: 'group-transition' }>>();
    for (const entry of flatListEntries) {
      if (entry.type === 'group-transition') {
        groups.set(entry.parentId, entry);
      }
    }
    rows = flatListEntries.flatMap((entry) => {
      if (entry.type !== 'item') {
        return [];
      }
      const group = groups.get(entry.itemId);
      // Shadow the parent's context so that a `Tree.GroupTransition` rendered by
      // an animating row does not consume the ancestor value and recursively
      // render the group again.
      return renderRow(
        entry.itemId,
        group
          ? {
              parentId: entry.itemId,
              animation: group.animation,
              children: group.childIds.map((childId) => renderRow(childId)),
            }
          : entry.itemId,
      );
    });
  }

  return <TreeRowsContext.Provider value={store}>{rows}</TreeRowsContext.Provider>;
}

export namespace TreeRows {
  export interface Props<TItem> {
    children: (item: TItem) => React.ReactNode;
  }
}

function isPlainList(entries: (TreeItemId | FlatListEntry)[]): entries is TreeItemId[] {
  return entries.length === 0 || typeof entries[0] === 'string' || typeof entries[0] === 'number';
}
