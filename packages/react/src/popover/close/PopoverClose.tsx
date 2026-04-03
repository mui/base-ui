'use client';
import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useClosePartRegistration } from '../../utils/closePart';

/**
 * A button that closes the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverClose = React.forwardRef(function PopoverClose(
  componentProps: PopoverClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled = false,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;

  const { buttonRef, getButtonProps } = useButton({
    disabled,
    focusableWhenDisabled: false,
    native: nativeButton,
  });

  const { store } = usePopoverRootContext();
  useClosePartRegistration();

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    props: [
      {
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

  return element;
});

export interface PopoverCloseState {}

export interface PopoverCloseProps
  extends NativeButtonProps, BaseUIComponentProps<'button', PopoverCloseState> {}

export namespace PopoverClose {
  export type State = PopoverCloseState;
  export type Props = PopoverCloseProps;
}
