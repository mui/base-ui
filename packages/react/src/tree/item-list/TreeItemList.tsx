'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useTreeRootContext } from '../root/TreeRootContext';
import { selectors } from '../store/selectors';
import { TreeItemModelProvider } from '../utils/TreeItemModelProvider';

/**
 * Renders tree items from a render function.
 * Doesn't render its own HTML element.
 * Place inside `Tree.Root` to render items alongside other children like `Tree.Empty`.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export function TreeItemList(componentProps: TreeItemList.Props) {
  const { children } = componentProps;
  const store = useTreeRootContext();

  const flatItemIds = useStore(store, selectors.flatList);

  return flatItemIds.map((itemId) => (
    <TreeItemModelProvider key={itemId} store={store} itemId={itemId}>
      {children}
    </TreeItemModelProvider>
  ));
}

export interface TreeItemListState {}

export interface TreeItemListProps
  extends Omit<BaseUIComponentProps<'div', TreeItemListState>, 'children'> {
  /**
   * The render function for each tree item.
   *
   * @param item - The tree item model.
   */
  children: (item: any) => React.ReactNode;
}

export namespace TreeItemList {
  export type Props = TreeItemListProps;
  export type State = TreeItemListState;
}
