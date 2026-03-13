'use client';
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { TreeItemContext } from '../item/TreeItemContext';
import { TreeLinkItemDataAttributes } from './TreeLinkItemDataAttributes';
import { TreeItemCssVars } from '../item/TreeItemCssVars';

const EXPANDED_HOOK = { [TreeLinkItemDataAttributes.expanded]: '' };
const COLLAPSED_HOOK = { [TreeLinkItemDataAttributes.collapsed]: '' };
const ACTIVE_HOOK = { [TreeLinkItemDataAttributes.active]: '' };
const LINK_HOOK: Record<string, string> = { [TreeLinkItemDataAttributes.link]: '' };

const stateAttributesMapping = {
  itemId(v: string) {
    return { [TreeLinkItemDataAttributes.itemId]: v };
  },
  expanded(v: boolean) {
    return v ? EXPANDED_HOOK : COLLAPSED_HOOK;
  },
  active(v: boolean) {
    return v ? ACTIVE_HOOK : null;
  },
} satisfies StateAttributesMapping<TreeLinkItem.State>;

/**
 * A tree item that acts as a navigational link.
 * Clicking navigates to the link's destination.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeLinkItem = fastComponentRef(function TreeLinkItem(
  componentProps: TreeLinkItem.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const { className, render, itemId, active = false, ...elementProps } = componentProps;

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

  const state: TreeLinkItem.State = {
    itemId,
    expanded,
    expandable,
    selected,
    focused,
    disabled,
    depth,
    active,
  };

  // In virtualized mode, auto-focus when this item mounts and it's the focused item.
  const autoFocusRef = React.useCallback(
    (element: HTMLAnchorElement | null) => {
      if (virtualized && element && focused) {
        element.focus();
      }
    },
    [virtualized, focused],
  );

  const element = useRenderElement('a', componentProps, {
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
        'aria-current': active ? ('page' as const) : undefined,

        tabIndex: isDefaultFocusable ? 0 : -1,
      },
      LINK_HOOK,
      store.linkItemEventHandlers,
      { style: { [TreeItemCssVars.depth]: depth } as React.CSSProperties },
      elementProps,
    ],
    stateAttributesMapping,
  });

  return <TreeItemContext.Provider value={itemId}>{element}</TreeItemContext.Provider>;
});

export interface TreeLinkItemState {
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
  /**
   * Whether the link represents the current page.
   */
  active: boolean;
}

export interface TreeLinkItemProps extends BaseUIComponentProps<'a', TreeLinkItemState> {
  /**
   * The id of the item.
   */
  itemId: string;
  /**
   * Whether this link represents the current page.
   * Sets `aria-current="page"` when true.
   * @default false
   */
  active?: boolean | undefined;
}

export namespace TreeLinkItem {
  export type State = TreeLinkItemState;
  export type Props = TreeLinkItemProps;
}
