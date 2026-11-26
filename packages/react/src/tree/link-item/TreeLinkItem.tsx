'use client';
import type * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import type { TreeItemId } from '../store/types';
import { useTreeRootContext } from '../root/TreeRootContext';
import { TreeItemContext } from '../item/TreeItemContext';
import { TreeLinkItemContext } from './TreeLinkItemContext';
import { useTreeItem } from '../utils/useTreeItem';
import type { TreeItemBaseState } from '../utils/useTreeItem';
import { useActiveLink } from '../utils/useActiveLink';
import { itemMapping } from '../utils/stateAttributesMapping';

// Like a disabled `TreeGrid.CellLink`, a disabled item ignores the clicks that would
// follow it, including the one Enter dispatches. A middle-click opens the `href`
// through `auxclick`, not `click`.
function getDisabledLinkProps(props: React.ComponentPropsWithRef<'a'>) {
  return { ...props, onClick: preventDefault, onAuxClick: preventDefault };
}

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

/**
 * An item that links to another page. Enter and clicks follow the link.
 * In a tree grid, render `TreeGrid.CellLink` in the item instead.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeLinkItem = fastComponentRef(function TreeLinkItem(
  componentProps: TreeLinkItem.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { className, render, style, itemId, active = false, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const sharedItemResponse = useTreeItem({ store, itemId, kind: 'link' });
  const { selected, selectionSupported } = sharedItemResponse;
  useActiveLink(store, itemId, active);

  const state: TreeLinkItem.State = { ...sharedItemResponse.state, selected, active };

  const element = useRenderElement('a', componentProps, {
    state,
    ref: [forwardedRef, sharedItemResponse.ref],
    props: [
      sharedItemResponse.props,
      // See `Tree.Item`: a disabled item that supports selection keeps `aria-selected`.
      selectionSupported ? { 'aria-selected': selected } : undefined,
      elementProps,
      state.disabled ? getDisabledLinkProps : undefined,
    ],
    stateAttributesMapping: itemMapping,
  });

  return (
    <TreeItemContext.Provider value={itemId}>
      <TreeLinkItemContext.Provider value>{element}</TreeLinkItemContext.Provider>
    </TreeItemContext.Provider>
  );
});

export interface TreeLinkItemState extends TreeItemBaseState {
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * Whether the link is the current page.
   */
  active: boolean;
}

export interface TreeLinkItemProps extends BaseUIComponentProps<
  'a',
  TreeLinkItemState,
  React.ComponentPropsWithRef<'a'>
> {
  /**
   * The id of the item.
   */
  itemId: TreeItemId;
  /**
   * Whether the link is the current page.
   * Marks the item with `aria-current="page"`, and gives it the tree's tab stop
   * when no item is selected and no other item had focus.
   * @default false
   */
  active?: boolean | undefined;
}

export namespace TreeLinkItem {
  export type State = TreeLinkItemState;
  export type Props = TreeLinkItemProps;
}
