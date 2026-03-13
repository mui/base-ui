'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useTreeRootContext } from '../root/TreeRootContext';
import { selectors } from '../store/selectors';
import { TreeGroupTransitionContext } from '../group-transition/TreeGroupTransitionContext';
import { TreeItemModelProvider } from '../utils/TreeItemModelProvider';

/**
 * Renders tree items with animated expand/collapse transitions.
 * Doesn't render its own HTML element.
 * Place inside `Tree.Root` instead of using a direct render function
 * to opt into group transition animations.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export function TreeAnimatedItemList(componentProps: TreeAnimatedItemList.Props) {
  const { children } = componentProps;
  const store = useTreeRootContext();

  // Signal to the store that animation is enabled
  React.useEffect(() => {
    store.set('enableGroupTransition', true);
    return () => {
      store.set('enableGroupTransition', false);
    };
  }, [store]);

  const flatListEntries = useStore(store, selectors.flatListWithGroupTransitions);

  // Build a map of parentId -> group-transition entry for quick lookup
  const groupTransitions = React.useMemo(() => {
    const map = new Map<string, { childIds: string[]; animation: 'expanding' | 'collapsing' }>();
    for (const entry of flatListEntries) {
      if (entry.type === 'group-transition') {
        map.set(entry.parentId, { childIds: entry.childIds, animation: entry.animation });
      }
    }
    return map;
  }, [flatListEntries]);

  return flatListEntries
    .filter((entry) => entry.type === 'item')
    .map((entry) => {
      if (entry.type !== 'item') {
        return null;
      }

      const groupEntry = groupTransitions.get(entry.itemId);

      let animatedChildren: React.ReactNode = null;
      let contextValue: React.ContextType<typeof TreeGroupTransitionContext> = null;

      if (groupEntry) {
        animatedChildren = groupEntry.childIds.map((childId) => (
          <TreeItemModelProvider key={childId} store={store} itemId={childId}>
            {children}
          </TreeItemModelProvider>
        ));
        contextValue = { parentId: entry.itemId, animation: groupEntry.animation };
      }

      return (
        <TreeGroupTransitionContext.Provider key={entry.itemId} value={contextValue}>
          <TreeItemModelProvider
            store={store}
            itemId={entry.itemId}
            animatedChildren={animatedChildren}
          >
            {children}
          </TreeItemModelProvider>
        </TreeGroupTransitionContext.Provider>
      );
    });
}

export interface TreeAnimatedItemListState {}

export interface TreeAnimatedItemListProps extends Omit<
  BaseUIComponentProps<'div', TreeAnimatedItemListState>,
  'children'
> {
  /**
   * The render function for each tree item.
   * Called with the item model and any animated children for expand/collapse transitions.
   *
   * @param item - The tree item model.
   * @param animatedChildren - Pre-rendered child items currently animating (expanding/collapsing).
   *   `null` when no animation is in progress for this item's children.
   *   Pass as children of `Tree.GroupTransition` to enable animated transitions.
   */
  children: (item: any, animatedChildren: React.ReactNode) => React.ReactNode;
}

export namespace TreeAnimatedItemList {
  export type Props = TreeAnimatedItemListProps;
  export type State = TreeAnimatedItemListState;
}
