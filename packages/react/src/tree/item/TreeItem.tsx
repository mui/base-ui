'use client';
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import type { TreeItemId } from '../store/types';

import { useTreeRootContext } from '../root/TreeRootContext';
import { TreeItemContext } from './TreeItemContext';
import { useTreeItem } from '../utils/useTreeItem';
import type { TreeItemBaseState } from '../utils/useTreeItem';
import { itemMapping } from '../utils/stateAttributesMapping';

/**
 * An individual item in a hierarchical collection. Clicking it selects it and deselects other items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItem = fastComponentRef(function TreeItem(
  componentProps: TreeItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, style, itemId, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const sharedItemResponse = useTreeItem({ store, itemId });
  const { selected, selectionSupported } = sharedItemResponse;

  const state: TreeItem.State = { ...sharedItemResponse.state, selected };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, sharedItemResponse.ref],
    props: [
      store.interaction.itemEventHandlers,
      sharedItemResponse.props,
      // Per WAI-ARIA, when selection is supported, all focusable rows must have
      // aria-selected set to true or false — a disabled row included, and a
      // *selected* disabled row above all. Only a row that cannot be selected at all
      // (`selectionMode="none"`, or `isItemSelectionDisabled`) omits it.
      selectionSupported ? { 'aria-selected': selected } : undefined,
      elementProps,
    ],
    stateAttributesMapping: itemMapping,
  });

  return <TreeItemContext.Provider value={itemId}>{element}</TreeItemContext.Provider>;
});

export interface TreeItemState extends TreeItemBaseState {
  /**
   * Whether the item is currently selected.
   */
  selected: boolean;
}

export interface TreeItemProps extends BaseUIComponentProps<'div', TreeItemState> {
  /**
   * The id of the item.
   */
  itemId: TreeItemId;
}

export namespace TreeItem {
  export type State = TreeItemState;
  export type Props = TreeItemProps;
}
