'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useTreeRootContext } from '../root/TreeRootContext';
import { selectors } from '../store/selectors';
import type { TreeItemModel } from '../store/types';
import { TreeGroupTransition, type TreeGroupTransitionState } from '../group-transition/TreeGroupTransition';
import { TreeItemModelProvider } from '../utils/TreeItemModelProvider';

/**
 * Renders tree items with animated expand/collapse transitions.
 * Place inside `Tree.Root` instead of using a direct render function
 * to opt into group transition animations.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export function TreeAnimatedItemList(props: TreeAnimatedItemList.Props) {
  const { children, renderGroupTransition } = props;
  const store = useTreeRootContext();

  // Signal to the store that animation is enabled
  React.useEffect(() => {
    store.set('enableGroupTransition', true);
    return () => {
      store.set('enableGroupTransition', false);
    };
  }, [store]);

  const flatListEntries = useStore(store, selectors.flatListWithGroupTransitions);

  return (
    <React.Fragment>
      {flatListEntries.map((entry) => {
        if (entry.type === 'item') {
          return (
            <TreeItemModelProvider key={entry.itemId} store={store} itemId={entry.itemId}>
              {children}
            </TreeItemModelProvider>
          );
        }

        return (
          <TreeGroupTransition
            key={`group-${entry.parentId}`}
            parentId={entry.parentId}
            animation={entry.animation}
            render={renderGroupTransition}
          >
            {entry.childIds.map((childId) => (
              <TreeItemModelProvider key={childId} store={store} itemId={childId}>
                {children}
              </TreeItemModelProvider>
            ))}
          </TreeGroupTransition>
        );
      })}
    </React.Fragment>
  );
}

export interface TreeAnimatedItemListProps {
  /**
   * The render function for each tree item.
   * Called with the item model for each visible item.
   */
  children: (item: TreeItemModel) => React.ReactNode;
  /**
   * Customizes the wrapper element rendered during expand/collapse animation.
   * Follows Base UI's render prop semantics.
   *
   * @example React element (props auto-merged via cloneElement):
   * ```tsx
   * renderGroupTransition={<div className={styles.GroupTransition} />}
   * ```
   *
   * @example Function (manual prop spreading):
   * ```tsx
   * renderGroupTransition={(props, state) => <div {...props} />}
   * ```
   */
  renderGroupTransition:
    | React.ReactElement
    | ((
        props: React.HTMLAttributes<any> & React.RefAttributes<any>,
        state: TreeGroupTransitionState,
      ) => React.ReactElement);
}

export namespace TreeAnimatedItemList {
  export type Props = TreeAnimatedItemListProps;
}
