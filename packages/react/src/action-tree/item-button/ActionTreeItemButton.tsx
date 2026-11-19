'use client';
import * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import { ACTION_CONTROL_KEYS, useActionTreeItemControl } from '../utils/useActionTreeItemControl';
import type { ActionTreeItemControlKeys } from '../item-control/ActionTreeItemControl';
import { useTreeRootContext } from '../../tree/root/TreeRootContext';
import { useTreeItemContext } from '../../tree/item/TreeItemContext';

const POPUP_TRIGGER_CONTROL_KEYS: Required<ActionTreeItemControlKeys> = {
  ...ACTION_CONTROL_KEYS,
  vertical: 'control',
};

// Popup triggers such as `<Select.Trigger>` and `<Menu.Trigger>` open with the
// vertical arrows.
function getButtonControlKeys(element: HTMLElement): Required<ActionTreeItemControlKeys> {
  const popup = element.getAttribute('aria-haspopup');
  return popup != null && popup !== 'false' ? POPUP_TRIGGER_CONTROL_KEYS : ACTION_CONTROL_KEYS;
}

/**
 * A button inside a tree item that takes part in the item's keyboard navigation.
 * Requires `ActionTree.Root`.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Action Tree](https://base-ui.com/react/components/action-tree)
 */
export const ActionTreeItemButton = fastComponentRef(function ActionTreeItemButton(
  componentProps: ActionTreeItemButton.Props,
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

  const control = useActionTreeItemControl({
    part: 'ItemButton',
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

  const state: ActionTreeItemButtonState = {
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

export interface ActionTreeItemButtonState {
  /**
   * Whether the button is disabled.
   */
  disabled: boolean;
  /**
   * Whether the button remains focusable when disabled.
   */
  focusable: boolean;
}

export interface ActionTreeItemButtonProps
  extends NativeButtonProps, BaseUIComponentProps<'button', ActionTreeItemButtonState> {
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
  controlKeys?: ActionTreeItemControlKeys | undefined;
}

export namespace ActionTreeItemButton {
  export type State = ActionTreeItemButtonState;
  export type Props = ActionTreeItemButtonProps;
}
