'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import { TreeItemLabelDataAttributes } from './TreeItemLabelDataAttributes';

const stateAttributesMapping: StateAttributesMapping<TreeItemLabel.State> = {
  editing: (v) => (v ? { [TreeItemLabelDataAttributes.editing]: '' } : null),
};

/**
 * Displays the label of a tree item.
 * When the item is being edited, renders an `<input>` element; otherwise renders a `<span>`.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemLabel = React.forwardRef(function TreeItemLabel(
  componentProps: TreeItemLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, children, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const { itemId } = useTreeItemContext();
  const propsFromState = store.useState('labelProps', itemId);

  const [editingValue, setEditingValue] = React.useState('');

  // Track the label at the time editing starts
  const prevEditing = React.useRef(false);
  if (propsFromState.editing && !prevEditing.current) {
    setEditingValue(propsFromState.label);
  }
  prevEditing.current = propsFromState.editing;

  const state: TreeItemLabel.State = {
    editing: propsFromState.editing,
  };

  // Always call useRenderElement to keep hooks count stable
  const spanElement = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        children: children ?? propsFromState.label,
        onDoubleClick: () => {
          store.setEditedItem(itemId);
        },
      },
      elementProps,
    ],
    stateAttributesMapping,
  });

  if (propsFromState.editing) {
    return (
      <input
        ref={forwardedRef as React.ForwardedRef<HTMLInputElement>}
        autoFocus
        value={editingValue}
        onChange={(event) => setEditingValue(event.target.value)}
        onKeyDown={(event) => {
          // Prevent key events from bubbling to the tree root's keyboard handler
          event.stopPropagation();
          if (event.key === 'Enter') {
            store.updateItemLabel(itemId, editingValue);
            store.focusItem(itemId);
          } else if (event.key === 'Escape') {
            store.setEditedItem(null);
            store.focusItem(itemId);
          }
        }}
        {...(elementProps as React.InputHTMLAttributes<HTMLInputElement>)}
      />
    );
  }

  return spanElement;
});

export interface TreeItemLabelState {
  editing: boolean;
}

export interface TreeItemLabelProps extends BaseUIComponentProps<'span', TreeItemLabelState> {}

export namespace TreeItemLabel {
  export type State = TreeItemLabelState;
  export type Props = TreeItemLabelProps;
}
