'use client';
import type * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { WIDGET_CONTROL_KEYS, useTreeItemControl } from '../utils/useTreeItemControl';

/**
 * Adds any focusable element inside a tree item to the item's keyboard navigation.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemControl = fastComponentRef(function TreeItemControl(
  componentProps: TreeItemControl.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { className, controlKeys, render, style, tabIndex, ...elementProps } = componentProps;

  const control = useTreeItemControl({ controlKeys, defaultKeys: WIDGET_CONTROL_KEYS });

  return useRenderElement('div', componentProps, {
    state: {},
    ref: [forwardedRef, control.ref],
    props: [{ tabIndex: tabIndex ?? control.tabIndex }, elementProps],
  });
});

/**
 * Which keys a control inside a tree item handles itself.
 * Keys assigned to `tree` navigate the item and the tree instead.
 */
export interface TreeItemControlKeys {
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

export interface TreeItemControlState {}

export interface TreeItemControlProps extends BaseUIComponentProps<'div', TreeItemControlState> {
  /**
   * Which keys the control handles itself instead of the tree.
   * By default, the control keeps every key. Assign a key group to `'tree'`
   * to let it navigate the item and the tree.
   */
  controlKeys?: TreeItemControlKeys | undefined;
}

export namespace TreeItemControl {
  export type State = TreeItemControlState;
  export type Props = TreeItemControlProps;
  export type Keys = TreeItemControlKeys;
}
