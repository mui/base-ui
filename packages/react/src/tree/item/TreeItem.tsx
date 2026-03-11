'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from './TreeItemContext';
import { TreeItemDataAttributes } from './TreeItemDataAttributes';

const EXPANDED_HOOK = { [TreeItemDataAttributes.expanded]: '' };
const COLLAPSED_HOOK = { [TreeItemDataAttributes.collapsed]: '' };

const stateAttributesMapping = {
  itemId(v: string) {
    return { [TreeItemDataAttributes.itemId]: v };
  },
  expanded(v: boolean) {
    return v ? EXPANDED_HOOK : COLLAPSED_HOOK;
  },
  depth(v: number) {
    return { [TreeItemDataAttributes.depth]: String(v) };
  },
} satisfies StateAttributesMapping<TreeItem.State>;

/**
 * An individual tree item that uses replace selection behavior.
 * Clicking selects the item and deselects others.
 * Use modifier keys (Ctrl/Cmd, Shift) for multi-select operations.
 * Renders a `<li>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItem = React.forwardRef(function TreeItem(
  componentProps: TreeItem.Props,
  forwardedRef: React.ForwardedRef<HTMLLIElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const { itemId } = useTreeItemContext();
  const { props: itemProps, state } = store.useState('itemPropsAndState', itemId);

  const element = useRenderElement('li', componentProps, {
    state,
    ref: forwardedRef,
    props: [itemProps, store.itemEventHandlers, elementProps],
    stateAttributesMapping,
  });

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
   * Whether the item's label is being edited.
   */
  editing: boolean;
  /**
   * The depth of the item in the tree hierarchy.
   */
  depth: number;
}

export interface TreeItemProps extends BaseUIComponentProps<'li', TreeItemState> {}

export namespace TreeItem {
  export type State = TreeItemState;
  export type Props = TreeItemProps;
}
