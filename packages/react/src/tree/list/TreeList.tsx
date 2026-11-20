'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import type { TreeItemId, FlatListEntry } from '../store/types';

import { useTreeRootContext } from '../root/TreeRootContext';
import { selectors } from '../store/selectors';
import { TreeGroupTransitionContext } from '../group-transition/TreeGroupTransitionContext';
import type { TreeGroupTransitionContextValue } from '../group-transition/TreeGroupTransitionContext';
import { TreeItemModelProvider } from '../utils/TreeItemModelProvider';
import { useTreeRootProps } from '../utils/useTreeRootProps';
import { useTreeListViewport } from './useTreeListViewport';
import { getItemIdKey } from '../utils/itemIdKey';

/**
 * Renders all tree items at once.
 * Renders a `<div>` element.
 *
 * Render a group transition after each item to animate expand/collapse transitions.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeList = React.forwardRef(function TreeList<TItem = any>(
  componentProps: TreeList.Props<TItem>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, className, render, style, ...elementProps } = componentProps;
  const store = useTreeRootContext();
  const { rootProps, rootRef, state } = useTreeRootProps(componentProps);

  const flatListEntries = useStore(store, selectors.flatListWithGroupTransitions);

  const listRef = React.useRef<HTMLDivElement | null>(null);

  useTreeListViewport(listRef);

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

  let renderChildren: React.ReactNode;
  if (isPlainList(flatListEntries)) {
    renderChildren = flatListEntries.map((itemId) => renderRow(itemId));
  } else {
    const groups = new Map<TreeItemId, Extract<FlatListEntry, { type: 'group-transition' }>>();
    for (const entry of flatListEntries) {
      if (entry.type === 'group-transition') {
        groups.set(entry.parentId, entry);
      }
    }
    renderChildren = flatListEntries.flatMap((entry) => {
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

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, rootRef, listRef],
    props: [rootProps, { children: renderChildren }, elementProps],
  });
}) as <TItem = any>(
  props: TreeList.Props<TItem> & React.RefAttributes<HTMLDivElement>,
) => React.JSX.Element;

export interface TreeListState {
  /**
   * Whether the tree is disabled.
   */
  disabled: boolean;
  /**
   * Whether the tree has no visible rows, or no item matches the filter.
   */
  empty: boolean;
}

export interface TreeListProps<TItem = any> extends Omit<
  BaseUIComponentProps<'div', TreeListState>,
  'children'
> {
  /**
   * The render function for each tree item.
   * Pass the item type to `Tree.List` to type the `item` parameter.
   */
  children: (item: TItem) => React.ReactNode;
}

export namespace TreeList {
  export type Props<TItem = any> = TreeListProps<TItem>;
  export type State = TreeListState;
}

function isPlainList(entries: (TreeItemId | FlatListEntry)[]): entries is TreeItemId[] {
  return entries.length === 0 || typeof entries[0] === 'string' || typeof entries[0] === 'number';
}
