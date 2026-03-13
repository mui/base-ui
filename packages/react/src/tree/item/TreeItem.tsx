'use client';
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { TreeItemContext } from './TreeItemContext';
import { TreeItemDataAttributes } from './TreeItemDataAttributes';
import { TreeItemCssVars } from './TreeItemCssVars';

const EXPANDED_HOOK = { [TreeItemDataAttributes.expanded]: '' };
const COLLAPSED_HOOK = { [TreeItemDataAttributes.collapsed]: '' };

const stateAttributesMapping = {
  itemId(v: string) {
    return { [TreeItemDataAttributes.itemId]: v };
  },
  expanded(v: boolean) {
    return v ? EXPANDED_HOOK : COLLAPSED_HOOK;
  },
} satisfies StateAttributesMapping<TreeItem.State>;

/**
 * An individual tree item that uses replace selection behavior.
 * Clicking selects the item and deselects others.
 * Use modifier keys (Ctrl/Cmd, Shift) for multi-select operations.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItem = fastComponentRef(function TreeItem(
  componentProps: TreeItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, itemId, ...elementProps } = componentProps;

  const store = useTreeRootContext();

  const expanded = store.useState('isItemExpanded', itemId);
  const expandable = store.useState('isItemExpandable', itemId);
  const selected = store.useState('isItemSelected', itemId);
  const focused = store.useState('isItemFocused', itemId);
  const disabled = store.useState('isItemDisabled', itemId);
  const canBeSelected = store.useState('canItemBeSelected', itemId);
  const selectionDisabled = store.useState('isSelectionDisabled');
  const isDefaultFocusable = store.useState('isItemDefaultFocusable', itemId);
  const siblingsCount = store.useState('itemSiblingsCount', itemId);
  const posInSet = store.useState('itemPositionInSet', itemId);
  const loading = store.useState('isItemLoading', itemId);
  const depth = store.useState('itemDepth', itemId);
  const virtualized = store.useState('virtualized');

  const state: TreeItem.State = {
    itemId,
    expanded,
    expandable,
    selected,
    focused,
    disabled,
    depth,
  };

  // In virtualized mode, auto-focus when this item mounts and it's the focused item.
  const autoFocusRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      if (virtualized && element && focused) {
        element.focus();
      }
    },
    [virtualized, focused],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, autoFocusRef],
    props: [
      {
        role: 'treeitem',
        'aria-expanded': expandable ? expanded : undefined,
        // Per WAI-ARIA, when selection is supported, all focusable treeitems
        // must have aria-selected set to true or false.
        // Only omit it entirely when the tree doesn't support selection at all.
        'aria-selected': selectionDisabled || !canBeSelected ? undefined : selected,
        'aria-level': depth + 1,
        'aria-setsize': siblingsCount,
        'aria-posinset': posInSet,
        'aria-disabled': disabled || undefined,
        'aria-busy': loading || undefined,
        tabIndex: isDefaultFocusable ? 0 : -1,
        style: { [TreeItemCssVars.depth]: depth } as React.CSSProperties,
      },
      store.itemEventHandlers,
      elementProps,
    ],
    stateAttributesMapping,
  });

  return <TreeItemContext.Provider value={itemId}>{element}</TreeItemContext.Provider>;
});

export interface TreeItemState {
  /**
   * The id of the item.
   */
  itemId: string;
  /**
   * Whether the item is currently expanded.
   */
  expanded: boolean;
  /**
   * Whether the item has children and can be expanded.
   */
  expandable: boolean;
  /**
   * Whether the item is currently selected.
   */
  selected: boolean;
  /**
   * Whether the item is currently focused.
   */
  focused: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * The depth of the item in the tree hierarchy.
   */
  depth: number;
}

export interface TreeItemProps extends BaseUIComponentProps<'div', TreeItemState> {
  /**
   * The id of the item.
   */
  itemId: string;
}

export namespace TreeItem {
  export type State = TreeItemState;
  export type Props = TreeItemProps;
}
