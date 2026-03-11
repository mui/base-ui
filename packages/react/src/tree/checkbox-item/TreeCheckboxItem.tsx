'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import { TreeCheckboxItemContext } from './TreeCheckboxItemContext';
import { TreeCheckboxItemDataAttributes } from './TreeCheckboxItemDataAttributes';

const EXPANDED_HOOK = { [TreeCheckboxItemDataAttributes.expanded]: '' };
const COLLAPSED_HOOK = { [TreeCheckboxItemDataAttributes.collapsed]: '' };
const CHECKED_HOOK = { [TreeCheckboxItemDataAttributes.checked]: '' };
const UNCHECKED_HOOK = { [TreeCheckboxItemDataAttributes.unchecked]: '' };
const INDETERMINATE_HOOK = { [TreeCheckboxItemDataAttributes.indeterminate]: '' };

const stateAttributesMapping = {
  itemId(v: string) {
    return { [TreeCheckboxItemDataAttributes.itemId]: v };
  },
  expanded(v: boolean) {
    return v ? EXPANDED_HOOK : COLLAPSED_HOOK;
  },
  checked(v: boolean) {
    return v ? CHECKED_HOOK : null;
  },
  unchecked(v: boolean) {
    return v ? UNCHECKED_HOOK : null;
  },
  indeterminate(v: boolean) {
    return v ? INDETERMINATE_HOOK : null;
  },
  depth(v: number) {
    return { [TreeCheckboxItemDataAttributes.depth]: String(v) };
  },
} satisfies StateAttributesMapping<TreeCheckboxItem.State>;

/**
 * A tree item that uses toggle selection behavior with checkbox semantics.
 * Clicking toggles the item's selection without affecting other items.
 * Renders a `<li>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeCheckboxItem = React.forwardRef(function TreeCheckboxItem(
  componentProps: TreeCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<HTMLLIElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const { itemId } = useTreeItemContext();
  const { props: itemProps, state } = store.useState('checkboxItemPropsAndState', itemId);

  const checkboxItemContext = React.useMemo(
    () => ({
      checked: state.checked,
      indeterminate: state.indeterminate,
      disabled: state.disabled,
    }),
    [state.checked, state.indeterminate, state.disabled],
  );

  const element = useRenderElement('li', componentProps, {
    state,
    ref: forwardedRef,
    props: [itemProps, store.checkboxItemEventHandlers, elementProps],
    stateAttributesMapping,
  });

  return (
    <TreeCheckboxItemContext.Provider value={checkboxItemContext}>
      {element}
    </TreeCheckboxItemContext.Provider>
  );
});

export interface TreeCheckboxItemState {
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
   * Whether the checkbox item is currently checked.
   */
  checked: boolean;
  /**
   * Whether the checkbox item is currently unchecked.
   */
  unchecked: boolean;
  /**
   * Whether the checkbox item is in an indeterminate state.
   */
  indeterminate: boolean;
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

export interface TreeCheckboxItemProps extends BaseUIComponentProps<'li', TreeCheckboxItemState> {}

export namespace TreeCheckboxItem {
  export type State = TreeCheckboxItemState;
  export type Props = TreeCheckboxItemProps;
}
