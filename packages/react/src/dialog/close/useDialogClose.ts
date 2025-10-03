'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useButton } from '../../use-button/useButton';
import { mergeProps } from '../../merge-props';
import type { HTMLProps } from '../../utils/types';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import type { DialogRoot } from '../root/DialogRoot';

export function useDialogClose(params: useDialogClose.Parameters): useDialogClose.ReturnValue {
  const { open, setOpen, disabled, nativeButton } = params;

  const handleClick = useEventCallback((event: React.MouseEvent) => {
    if (open) {
      setOpen(false, createChangeEventDetails('close-press', event.nativeEvent));
    }
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const getRootProps = (externalProps: HTMLProps) =>
    mergeProps({ onClick: handleClick }, externalProps, getButtonProps);

  return {
    getRootProps,
    ref: buttonRef,
  };
}

export interface UseDialogCloseParameters {
  /**
   * Whether the button is currently disabled.
   */
  disabled: boolean;
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
  /**
   * Event handler called when the dialog is opened or closed.
   */
  setOpen: (open: boolean, eventDetails: DialogRoot.ChangeEventDetails) => void;
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * Set to `false` if the rendered element is not a button (e.g. `<div>`).
   * @default true
   */
  nativeButton: boolean;
}

export interface UseDialogCloseReturnValue {
  /**
   * Resolver for the root element props.
   */
  getRootProps: (externalProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  ref: React.Ref<HTMLElement>;
}

export namespace useDialogClose {
  export type Parameters = UseDialogCloseParameters;
  export type ReturnValue = UseDialogCloseReturnValue;
}
