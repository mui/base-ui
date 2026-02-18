'use client';
import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { getCloseButtonStyle, useClosePartRegistration } from '../../utils/closePart';

/**
 * A button that closes the combobox popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxClose = React.forwardRef(function ComboboxClose(
  componentProps: ComboboxClose.Props,
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

  const store = useComboboxRootContext();
  useClosePartRegistration(store);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: ComboboxClose.State = { disabled };

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      {
        style: getCloseButtonStyle(visuallyHidden),
        onClick(event) {
          store.state.setOpen(
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

export interface ComboboxCloseProps
  extends NativeButtonProps, BaseUIComponentProps<'button', ComboboxClose.State> {
  /**
   * Whether the close button should be visually hidden.
   * @default false
   */
  visuallyHidden?: boolean | undefined;
}

export interface ComboboxCloseState {
  /**
   * Whether the button is currently disabled.
   */
  disabled: boolean;
}

export namespace ComboboxClose {
  export type Props = ComboboxCloseProps;
  export type State = ComboboxCloseState;
}
