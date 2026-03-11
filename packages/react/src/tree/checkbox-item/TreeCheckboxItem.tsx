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
  const propsFromState = store.useState('itemProps', itemId);

  const {
    state: itemState,
    'aria-selected': _ariaSelected,
    ...ariaProps
  } = propsFromState ?? {
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

  const checkboxState = store.useState('checkboxProps', itemId);

  const state: TreeCheckboxItem.State = {
    itemId: itemState.itemId,
    expanded: itemState.expanded,
    expandable: itemState.expandable,
    checked: checkboxState.checked,
    unchecked: !checkboxState.checked && !checkboxState.indeterminate,
    indeterminate: checkboxState.indeterminate,
    focused: itemState.focused,
    disabled: itemState.disabled,
    editing: itemState.editing,
    depth: itemState.depth,
  };

  const checkboxItemContext = React.useMemo(
    () => ({
      checked: checkboxState.checked,
      indeterminate: checkboxState.indeterminate,
      disabled: checkboxState.disabled,
    }),
    [checkboxState.checked, checkboxState.indeterminate, checkboxState.disabled],
  );

  const element = useRenderElement('li', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        role: 'treeitem',
        ...ariaProps,
        onMouseDown: (event: React.MouseEvent) => {
          // Prevent text selection when using modifier keys for multi-select
          if (event.shiftKey || event.ctrlKey || event.metaKey || itemState.disabled) {
            event.preventDefault();
          }
        },
        onClick: (event: React.MouseEvent) => {
          store.checkboxItemEventHandlers.onClick(event, itemId);
        },
        onFocus: (event: React.FocusEvent) => {
          store.checkboxItemEventHandlers.onFocus(event, itemId);
        },
      } as React.HTMLAttributes<HTMLLIElement>,
      elementProps,
    ],
    stateAttributesMapping,
  });

  if (propsFromState == null) {
    return null;
  }

  return (
    <TreeCheckboxItemContext.Provider value={checkboxItemContext}>
      {element}
    </TreeCheckboxItemContext.Provider>
  );
});

export interface TreeCheckboxItemState {
  itemId: string;
  expanded: boolean;
  expandable: boolean;
  checked: boolean;
  unchecked: boolean;
  indeterminate: boolean;
  focused: boolean;
  disabled: boolean;
  editing: boolean;
  depth: number;
}

export interface TreeCheckboxItemProps extends BaseUIComponentProps<'li', TreeCheckboxItemState> {}

export namespace TreeCheckboxItem {
  export type State = TreeCheckboxItemState;
  export type Props = TreeCheckboxItemProps;
}
