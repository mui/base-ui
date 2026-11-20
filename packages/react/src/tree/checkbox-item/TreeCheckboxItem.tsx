'use client';
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useRenderElement } from '../../internals/useRenderElement';
import type { TreeItemId } from '../store/types';
import { useTreeRootContext } from '../root/TreeRootContext';
import { TreeItemContext } from '../item/TreeItemContext';
import { useTreeItem } from '../utils/useTreeItem';
import type { TreeItemBaseState } from '../utils/useTreeItem';
import { checkedMapping, itemMapping, mixedMapping } from '../utils/stateAttributesMapping';
import { TreeCheckboxItemContext } from './TreeCheckboxItemContext';

const stateAttributesMapping: StateAttributesMapping<TreeCheckboxItemState> = {
  ...itemMapping,
  ...checkedMapping,
};

const mixedStateAttributesMapping: StateAttributesMapping<TreeCheckboxItemState> = {
  ...itemMapping,
  ...mixedMapping,
};

/**
 * An item that toggles its selection like a checkbox, leaving the other items selected.
 * In an action tree, render `ActionTree.ItemCheckbox` in the item instead.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeCheckboxItem = fastComponentRef(function TreeCheckboxItem(
  componentProps: TreeCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, style, itemId, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const sharedItemResponse = useTreeItem({ store, itemId, kind: 'checkbox' });
  const status = store.useState('checkboxSelectionStatus', itemId);
  const checked = status === 'checked';
  const indeterminate = status === 'indeterminate';
  const disabled = sharedItemResponse.state.disabled;

  const state: TreeCheckboxItem.State = { ...sharedItemResponse.state, checked, indeterminate };

  const context = React.useMemo(
    () => ({ checked, indeterminate, disabled }),
    [checked, indeterminate, disabled],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, sharedItemResponse.ref],
    props: [
      sharedItemResponse.props,
      // The checked state stands in for `aria-selected`. Like it, a disabled item
      // that supports selection keeps reporting it.
      sharedItemResponse.selectionSupported
        ? { 'aria-checked': indeterminate ? 'mixed' : checked }
        : undefined,
      elementProps,
    ],
    stateAttributesMapping: indeterminate ? mixedStateAttributesMapping : stateAttributesMapping,
  });

  return (
    <TreeItemContext.Provider value={itemId}>
      <TreeCheckboxItemContext.Provider value={context}>{element}</TreeCheckboxItemContext.Provider>
    </TreeItemContext.Provider>
  );
});

export interface TreeCheckboxItemState extends TreeItemBaseState {
  /**
   * Whether the item is checked.
   */
  checked: boolean;
  /**
   * Whether the item is not checked but some of its selectable descendants are.
   */
  indeterminate: boolean;
}

export interface TreeCheckboxItemProps extends BaseUIComponentProps<'div', TreeCheckboxItemState> {
  /**
   * The id of the item.
   */
  itemId: TreeItemId;
}

export namespace TreeCheckboxItem {
  export type State = TreeCheckboxItemState;
  export type Props = TreeCheckboxItemProps;
}
