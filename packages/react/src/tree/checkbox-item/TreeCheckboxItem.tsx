'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { TreeItemContext, useTreeItemContextOptional } from '../item/TreeItemContext';
import { TreeCheckboxItemContext } from './TreeCheckboxItemContext';
import { TreeCheckboxItemDataAttributes } from './TreeCheckboxItemDataAttributes';
import { TreeItemCssVars } from '../item/TreeItemCssVars';

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
} satisfies StateAttributesMapping<TreeCheckboxItem.State>;

/**
 * A tree item that uses toggle selection behavior with checkbox semantics.
 * Clicking toggles the item's selection without affecting other items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeCheckboxItem = React.forwardRef(function TreeCheckboxItem(
  componentProps: TreeCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, itemId: itemIdProp, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const contextItemId = useTreeItemContextOptional()?.itemId;
  const itemId = itemIdProp ?? contextItemId;

  if (itemId === undefined) {
    throw new Error(
      'Base UI: Tree.CheckboxItem requires an `itemId` prop when used in virtualized mode, ' +
        'or must be placed within a Tree.Root with a render function.',
    );
  }

  const { props: itemProps, state } = store.useState('checkboxItemPropsAndState', itemId);
  const itemIdContext = React.useMemo(() => ({ itemId }), [itemId]);

  const checkboxItemContext = React.useMemo(
    () => ({
      checked: state.checked,
      indeterminate: state.indeterminate,
      disabled: state.disabled,
    }),
    [state.checked, state.indeterminate, state.disabled],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      itemProps,
      store.checkboxItemEventHandlers,
      { style: { [TreeItemCssVars.depth]: state.depth } as React.CSSProperties },
      elementProps,
    ],
    stateAttributesMapping,
  });

  const content = (
    <TreeCheckboxItemContext.Provider value={checkboxItemContext}>
      {element}
    </TreeCheckboxItemContext.Provider>
  );

  // When itemId is provided as a prop (virtualized mode), wrap with context
  // so sub-parts (ItemLabel, ItemExpansionTrigger, etc.) can access itemId.
  if (itemIdProp != null) {
    return (
      <TreeItemContext.Provider value={itemIdContext}>
        {content}
      </TreeItemContext.Provider>
    );
  }

  return content;
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
   * The depth of the item in the tree hierarchy.
   */
  depth: number;
}

export interface TreeCheckboxItemProps extends BaseUIComponentProps<'div', TreeCheckboxItemState> {
  /**
   * The id of the item. Required when using `virtualized` on `Tree.Root`.
   * When provided, the item will set up its own context for sub-parts.
   */
  itemId?: string | undefined;
}

export namespace TreeCheckboxItem {
  export type State = TreeCheckboxItemState;
  export type Props = TreeCheckboxItemProps;
}
