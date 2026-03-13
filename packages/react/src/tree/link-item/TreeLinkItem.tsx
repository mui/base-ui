'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { selectors } from '../store/selectors';
import { TreeItemContext, useTreeItemContextOptional } from '../item/TreeItemContext';
import { TreeLinkItemDataAttributes } from './TreeLinkItemDataAttributes';
import { TreeItemCssVars } from '../item/TreeItemCssVars';

const EXPANDED_HOOK = { [TreeLinkItemDataAttributes.expanded]: '' };
const COLLAPSED_HOOK = { [TreeLinkItemDataAttributes.collapsed]: '' };
const ACTIVE_HOOK = { [TreeLinkItemDataAttributes.active]: '' };
const LINK_HOOK = { [TreeLinkItemDataAttributes.link]: '' };

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
export const TreeLinkItem = React.forwardRef(function TreeLinkItem(
  componentProps: TreeLinkItem.Props,
  forwardedRef: React.ForwardedRef<HTMLAnchorElement>,
) {
  const {
    className,
    render,
    itemId: itemIdProp,
    active = false,
    ...elementProps
  } = componentProps;

  const store = useTreeRootContext();
  const contextItemId = useTreeItemContextOptional()?.itemId;
  const itemId = itemIdProp ?? contextItemId;

  if (itemId === undefined) {
    throw new Error(
      'Base UI: Tree.LinkItem requires an `itemId` prop when used in virtualized mode, ' +
        'or must be placed within a Tree.Root with a render function.',
    );
  }

  const { props: itemProps, state: itemState } = store.useState('itemPropsAndState', itemId);
  const virtualized = useStore(store, selectors.virtualized);
  const itemIdContext = React.useMemo(() => ({ itemId }), [itemId]);

  const state: TreeLinkItem.State = React.useMemo(
    () => ({
      ...itemState,
      active,
    }),
    [itemState, active],
  );

  // In virtualized mode, auto-focus when this item mounts and it's the focused item.
  const autoFocusRef = React.useCallback(
    (element: HTMLAnchorElement | null) => {
      if (virtualized && element && state.focused) {
        element.focus();
      }
    },
    [virtualized, state.focused],
  );

  const element = useRenderElement('a', componentProps, {
    state,
    ref: [forwardedRef, autoFocusRef],
    props: [
      itemProps,
      { 'aria-current': active ? ('page' as const) : undefined },
      LINK_HOOK,
      store.linkItemEventHandlers,
      { style: { [TreeItemCssVars.depth]: state.depth } as React.CSSProperties },
      elementProps,
    ],
    stateAttributesMapping,
  });

  // When itemId is provided as a prop (virtualized mode), wrap with context
  // so sub-parts (ItemLabel, ItemExpansionTrigger, etc.) can access itemId.
  if (itemIdProp != null) {
    return (
      <TreeItemContext.Provider value={itemIdContext}>
        {element}
      </TreeItemContext.Provider>
    );
  }

  return element;
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
   * The id of the item. Required when using `virtualized` on `Tree.Root`.
   * When provided, the item will set up its own context for sub-parts.
   */
  itemId?: string | undefined;
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
