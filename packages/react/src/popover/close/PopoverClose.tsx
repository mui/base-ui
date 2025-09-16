'use client';
import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';

/**
 * A button that closes the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverClose = React.forwardRef(function PopoverClose(
  props: PopoverClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, disabled = false, nativeButton = true, ...elementProps } = props;

  const { buttonRef, getButtonProps } = useButton({
    disabled,
    focusableWhenDisabled: false,
    native: nativeButton,
  });

  const { setOpen } = usePopoverRootContext();

  const element = useRenderElement('button', props, {
    ref: [forwardedRef, buttonRef],
    props: [
      {
        onClick(event) {
          setOpen(false, createBaseUIEventDetails('close-press', event.nativeEvent));
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
});

export namespace PopoverClose {
  export interface State {}

  export interface Props extends NativeButtonProps, BaseUIComponentProps<'button', State> {}
}
