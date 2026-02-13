'use client';
import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { getCloseButtonStyle, useClosePartRegistration } from '../../utils/closePart';

/**
 * A button that closes the select popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectClose = React.forwardRef(function SelectClose(
  componentProps: SelectClose.Props,
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

  const { store, setOpen } = useSelectRootContext();
  useClosePartRegistration(store);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state: SelectClose.State = { disabled };

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      {
        style: getCloseButtonStyle(visuallyHidden),
        onClick(event) {
          setOpen(
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

export interface SelectCloseProps
  extends NativeButtonProps, BaseUIComponentProps<'button', SelectClose.State> {
  /**
   * Whether the close button should be visually hidden.
   * @default false
   */
  visuallyHidden?: boolean | undefined;
}

export interface SelectCloseState {
  /**
   * Whether the button is currently disabled.
   */
  disabled: boolean;
}

export namespace SelectClose {
  export type Props = SelectCloseProps;
  export type State = SelectCloseState;
}
