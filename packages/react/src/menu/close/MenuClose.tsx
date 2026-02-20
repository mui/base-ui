'use client';
import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { getCloseButtonStyle, useClosePartRegistration } from '../../utils/closePart';

/**
 * A button that closes the menu.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuClose = React.forwardRef(function MenuClose(
  componentProps: MenuClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled = false,
    nativeButton = true,
    visuallyHidden = false,
    ...elementProps
  } = componentProps;

  const { store } = useMenuRootContext();
  useClosePartRegistration(store);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: MenuClose.State = { disabled };

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      {
        style: getCloseButtonStyle(visuallyHidden),
        onClick(event) {
          store.setOpen(
            false,
            createChangeEventDetails(REASONS.closePress, event.nativeEvent, event.currentTarget),
          );
        },
      },
      elementProps,
      getButtonProps,
    ],
  });
});

export interface MenuCloseProps
  extends NativeButtonProps, BaseUIComponentProps<'button', MenuClose.State> {
  /**
   * Whether the close button should be visually hidden.
   * @default false
   */
  visuallyHidden?: boolean | undefined;
}

export interface MenuCloseState {
  /**
   * Whether the button is currently disabled.
   */
  disabled: boolean;
}

export namespace MenuClose {
  export type Props = MenuCloseProps;
  export type State = MenuCloseState;
}
