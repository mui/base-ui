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
  expanded(v: boolean) {
    return v ? EXPANDED_HOOK : COLLAPSED_HOOK;
  },
  depth(v: number) {
    return { [TreeItemDataAttributes.depth]: String(v) };
  },
} satisfies StateAttributesMapping<TreeItem.State>;

/**
 * An individual tree item.
 * Renders a `<li>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItem = React.forwardRef(function TreeItem(
  componentProps: TreeItem.Props,
  forwardedRef: React.ForwardedRef<HTMLLIElement>,
) {
  const { className, render, clickToExpand = true, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const { itemId } = useTreeItemContext();
  const propsFromState = store.useState('itemProps', itemId);

  const { state, ...ariaProps } = propsFromState ?? {
    state: {
      expanded: false,
      expandable: false,
      selected: false,
      focused: false,
      disabled: false,
      editing: false,
      depth: 0,
    },
  };

  const element = useRenderElement('li', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        role: 'treeitem',
        ...ariaProps,
        onClick: (event: React.MouseEvent) => {
          store.itemEventHandlers.onClick(event, itemId, clickToExpand);
        },
        onFocus: (event: React.FocusEvent) => {
          store.itemEventHandlers.onFocus(event, itemId);
        },
      } as React.HTMLAttributes<HTMLLIElement>,
      elementProps,
    ],
    stateAttributesMapping,
  });

  if (propsFromState == null) {
    return null;
  }

  return element;
});

export interface TreeItemState {
  expanded: boolean;
  expandable: boolean;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  editing: boolean;
  depth: number;
}

export interface TreeItemProps extends BaseUIComponentProps<'li', TreeItemState> {
  /**
   * If `true`, clicking the item toggles expansion when no `Tree.ItemExpansionTrigger` is used.
   * @default true
   */
  clickToExpand?: boolean | undefined;
}

export namespace TreeItem {
  export type State = TreeItemState;
  export type Props = TreeItemProps;
}
