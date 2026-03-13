'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { selectors } from '../store/selectors';
import { TreeItemContext, useTreeItemContextOptional } from './TreeItemContext';
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
export const TreeItem = React.forwardRef(function TreeItem(
  componentProps: TreeItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, itemId: itemIdProp, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const contextItemId = useTreeItemContextOptional()?.itemId;
  const itemId = itemIdProp ?? contextItemId;

  if (itemId === undefined) {
    throw new Error(
      'Base UI: Tree.Item requires an `itemId` prop when used in virtualized mode, ' +
        'or must be placed within a Tree.Root with a render function.',
    );
  }

  const { props: itemProps, state } = store.useState('itemPropsAndState', itemId);
  const virtualized = useStore(store, selectors.virtualized);
  const itemIdContext = React.useMemo(() => ({ itemId }), [itemId]);

  // In virtualized mode, auto-focus when this item mounts and it's the focused item.
  // This handles the case where keyboard navigation moves to an item that wasn't
  // previously in the DOM, and the virtualizer scrolls to render it.
  const autoFocusRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      if (virtualized && element && state.focused) {
        element.focus();
      }
    },
    [virtualized, state.focused],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, autoFocusRef],
    props: [
      itemProps,
      store.itemEventHandlers,
      { style: { [TreeItemCssVars.depth]: state.depth } as React.CSSProperties },
      elementProps,
    ],
    stateAttributesMapping,
  });

  // When itemId is provided as a prop (virtualized mode), wrap with context
  // so sub-parts (ItemLabel, ItemExpansionTrigger, etc.) can access itemId.
  if (itemIdProp != null) {
    return <TreeItemContext.Provider value={itemIdContext}>{element}</TreeItemContext.Provider>;
  }

  return element;
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
   * The id of the item. Required when using `virtualized` on `Tree.Root`.
   * When provided, the item will set up its own context for sub-parts.
   */
  itemId?: string | undefined;
}

export namespace TreeItem {
  export type State = TreeItemState;
  export type Props = TreeItemProps;
}
