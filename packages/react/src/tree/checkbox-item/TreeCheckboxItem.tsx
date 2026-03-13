'use client';
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { TreeItemContext } from '../item/TreeItemContext';
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
export const TreeCheckboxItem = fastComponentRef(function TreeCheckboxItem(
  componentProps: TreeCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, itemId, ...elementProps } = componentProps;

  const store = useTreeRootContext();

  const expanded = store.useState('isItemExpanded', itemId);
  const expandable = store.useState('isItemExpandable', itemId);
  const focused = store.useState('isItemFocused', itemId);
  const disabled = store.useState('isItemDisabled', itemId);
  const canBeSelected = store.useState('canItemBeSelected', itemId);
  const checkboxStatus = store.useState('checkboxSelectionStatus', itemId);
  const isDefaultFocusable = store.useState('isItemDefaultFocusable', itemId);
  const siblingsCount = store.useState('itemSiblingsCount', itemId);
  const posInSet = store.useState('itemPositionInSet', itemId);
  const loading = store.useState('isItemLoading', itemId);
  const depth = store.useState('itemDepth', itemId);
  const virtualized = store.useState('virtualized');

  // Compute aria-checked from checkbox selection status.
  const checked = checkboxStatus === 'checked';
  const indeterminate = checkboxStatus === 'indeterminate';
  let ariaChecked: boolean | 'mixed' | undefined;
  if (!canBeSelected) {
    ariaChecked = undefined;
  } else if (checked) {
    ariaChecked = true;
  } else if (indeterminate) {
    ariaChecked = 'mixed';
  } else {
    ariaChecked = false;
  }

  const state: TreeCheckboxItem.State = {
    itemId,
    expanded,
    expandable,
    checked,
    unchecked: !checked && !indeterminate,
    indeterminate,
    focused,
    disabled,
    depth,
  };

  const checkboxItemContext = React.useMemo(
    () => ({
      checked,
      indeterminate,
      disabled,
    }),
    [checked, indeterminate, disabled],
  );

  // In virtualized mode, auto-focus when this item mounts and it's the focused item.
  const autoFocusRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      if (virtualized && element && focused) {
        element.focus();
      }
    },
    [virtualized, focused],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, autoFocusRef],
    props: [
      {
        role: 'treeitem',
        'aria-expanded': expandable ? expanded : undefined,
        'aria-checked': ariaChecked,
        'aria-level': depth + 1,
        'aria-setsize': siblingsCount,
        'aria-posinset': posInSet,
        'aria-disabled': disabled || undefined,
        'aria-busy': loading || undefined,
        tabIndex: isDefaultFocusable ? 0 : -1,
        style: { [TreeItemCssVars.depth]: depth } as React.CSSProperties,
      },
      store.checkboxItemEventHandlers,
      elementProps,
    ],
    stateAttributesMapping,
  });

  return (
    <TreeItemContext.Provider value={itemId}>
      <TreeCheckboxItemContext.Provider value={checkboxItemContext}>
        {element}
      </TreeCheckboxItemContext.Provider>
    </TreeItemContext.Provider>
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
   * The depth of the item in the tree hierarchy.
   */
  depth: number;
}

export interface TreeCheckboxItemProps extends BaseUIComponentProps<'div', TreeCheckboxItemState> {
  /**
   * The id of the item.
   */
  itemId: string;
}

export namespace TreeCheckboxItem {
  export type State = TreeCheckboxItemState;
  export type Props = TreeCheckboxItemProps;
}
