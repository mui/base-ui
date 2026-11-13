'use client';
import * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import { ACTION_CONTROL_KEYS, useTreeItemControl } from '../utils/useTreeItemControl';
import type { TreeItemControlKeys } from '../item-control/TreeItemControl';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';

const POPUP_TRIGGER_CONTROL_KEYS: Required<TreeItemControlKeys> = {
  ...ACTION_CONTROL_KEYS,
  vertical: 'control',
};

// Popup triggers such as `<Select.Trigger>` and `<Menu.Trigger>` open with the
// vertical arrows.
function getButtonControlKeys(element: HTMLElement): Required<TreeItemControlKeys> {
  const popup = element.getAttribute('aria-haspopup');
  return popup != null && popup !== 'false' ? POPUP_TRIGGER_CONTROL_KEYS : ACTION_CONTROL_KEYS;
}

/**
 * A button inside a tree item that takes part in the item's keyboard navigation.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemButton = fastComponentRef(function TreeItemButton(
  componentProps: TreeItemButton.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className,
    controlKeys,
    disabled: disabledProp = false,
    focusableWhenDisabled = true,
    nativeButton,
    render,
    style,
    tabIndex,
    ...elementProps
  } = componentProps;

  const store = useTreeRootContext();
  const itemId = useTreeItemContext();
  const disabled = store.useState('isItemDisabled', itemId) || disabledProp;

  const control = useTreeItemControl({
    controlKeys,
    defaultKeys: getButtonControlKeys,
    disabled: disabled && !focusableWhenDisabled,
  });
  const elementRef = React.useRef<HTMLButtonElement | null>(null);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled,
    native: nativeButton,
    tabIndex: tabIndex ?? control.tabIndex,
  });

  // A rendered component such as `<Menu.Trigger>` receives `disabled` and sets the
  // native attribute, which would make a focusable disabled button unreachable.
  // React leaves the attribute alone while that prop is unchanged, so keep it in
  // sync in both directions.
  useIsoLayoutEffect(() => {
    const element = elementRef.current;
    if (render && element != null && 'disabled' in element) {
      element.disabled = disabled && !focusableWhenDisabled;
    }
  }, [render, disabled, focusableWhenDisabled]);

  const state: TreeItemButtonState = {
    disabled,
    focusable: focusableWhenDisabled,
  };

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef, control.ref, elementRef],
    props: [
      elementProps,
      // Forward `disabled` to a rendered component such as `<Menu.Trigger>` so
      // it can derive its own disabled state.
      render ? { disabled } : EMPTY_OBJECT,
      getButtonProps,
    ],
  });
});

export interface TreeItemButtonState {
  /**
   * Whether the button is disabled.
   */
  disabled: boolean;
  /**
   * Whether the button remains focusable when disabled.
   */
  focusable: boolean;
}

export interface TreeItemButtonProps
  extends NativeButtonProps, BaseUIComponentProps<'button', TreeItemButtonState> {
  /**
   * Whether the button should ignore user interaction.
   * The button is also disabled while its item or the tree is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the button remains focusable when disabled.
   * @default true
   */
  focusableWhenDisabled?: boolean | undefined;
  /**
   * Which keys the button handles itself instead of the tree.
   * By default, the arrows, Home, End, and Escape navigate the tree.
   * A popup trigger keeps the Up and Down arrows so it can open its popup.
   */
  controlKeys?: TreeItemControlKeys | undefined;
}

export namespace TreeItemButton {
  export type State = TreeItemButtonState;
  export type Props = TreeItemButtonProps;
}
