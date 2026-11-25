'use client';
import type * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useTreeRootContext } from '../../tree/root/TreeRootContext';
import { useTreeItemContext } from '../../tree/item/TreeItemContext';
import { WIDGET_CONTROL_KEYS, useTreeGridCellControl } from '../utils/useTreeGridCellControl';

/**
 * Adds any focusable element inside a tree item to the item's keyboard navigation.
 * Requires `TreeGrid.Root`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tree Grid](https://base-ui.com/react/components/tree-grid)
 */
export const TreeGridCellControl = fastComponentRef(function TreeGridCellControl(
  componentProps: TreeGridCellControl.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { className, controlKeys, render, style, tabIndex, ...elementProps } = componentProps;

  const control = useTreeGridCellControl({
    part: 'CellControl',
    controlKeys,
    defaultKeys: WIDGET_CONTROL_KEYS,
  });

  const store = useTreeRootContext();
  const itemId = useTreeItemContext();
  const disabled = store.useState('isItemDisabled', itemId);

  const state: TreeGridCellControlState = { disabled };
  // Forward `disabled` to a rendered widget such as `<Switch.Root>` so it ignores
  // interaction while its item or the tree is disabled. A `<div>` has no such attribute.
  const disabledProps: React.HTMLAttributes<HTMLDivElement> & {
    disabled?: boolean | undefined;
  } = render ? { disabled } : EMPTY_OBJECT;

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, control.ref],
    props: [{ tabIndex: tabIndex ?? control.tabIndex }, disabledProps, elementProps],
  });
});

/**
 * Which keys a control inside a tree item handles itself.
 * Keys assigned to `tree` navigate the item and the tree instead.
 */
export interface TreeGridCellControlKeys {
  /**
   * Left and Right arrows. With `tree`, they move to the previous or next control,
   * and back to the item from the first control. In a text input, they move the
   * caret until it reaches the start or end of the text.
   */
  horizontal?: 'control' | 'tree' | undefined;
  /**
   * Up and Down arrows. With `tree`, they move to the previous or next item.
   */
  vertical?: 'control' | 'tree' | undefined;
  /**
   * Home and End. With `tree`, they move to the first or last control of the item.
   */
  homeEnd?: 'control' | 'tree' | undefined;
  /**
   * Escape. With `tree`, it moves focus back to the item.
   */
  escape?: 'control' | 'tree' | undefined;
}

export interface TreeGridCellControlState {
  /**
   * Whether the control's item or the tree is disabled.
   * A rendered element receives it as its `disabled` prop. A widget without that prop
   * has to read it from the state.
   */
  disabled: boolean;
}

export interface TreeGridCellControlProps extends BaseUIComponentProps<
  'div',
  TreeGridCellControlState
> {
  /**
   * Which keys the control handles itself instead of the tree.
   * By default, the control keeps every key. Assign a key group to `'tree'`
   * to let it navigate the item and the tree.
   */
  controlKeys?: TreeGridCellControlKeys | undefined;
}

export namespace TreeGridCellControl {
  export type State = TreeGridCellControlState;
  export type Props = TreeGridCellControlProps;
  export type Keys = TreeGridCellControlKeys;
}
