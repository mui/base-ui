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
  const propsFromState = store.useState('itemProps', itemId);

  const { state, 'aria-checked': ariaChecked, ...ariaProps } = propsFromState ?? {
    state: {
      itemId: '',
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
        onMouseDown: (event: React.MouseEvent) => {
          // Prevent text selection when using modifier keys for multi-select
          if (event.shiftKey || event.ctrlKey || event.metaKey || state.disabled) {
            event.preventDefault();
          }
        },
        onClick: (event: React.MouseEvent) => {
          store.itemEventHandlers.onClick(event, itemId);
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
  itemId: string;
  expanded: boolean;
  expandable: boolean;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  editing: boolean;
  depth: number;
}

export interface TreeItemProps extends BaseUIComponentProps<'li', TreeItemState> {}

export namespace TreeItem {
  export type State = TreeItemState;
  export type Props = TreeItemProps;
}
