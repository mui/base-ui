'use client';
import * as React from 'react';
import { useButton } from '../../use-button/useButton';
import { mergeProps } from '../../merge-props';
import type { HTMLProps } from '../../utils/types';
import { useEventCallback } from '../../utils/useEventCallback';
import { DialogOpenChangeReason } from '../root/useDialogRoot';

export function useDialogClose(params: useDialogClose.Parameters): useDialogClose.ReturnValue {
  const { open, setOpen, disabled } = params;

  const handleClick = useEventCallback((event: React.MouseEvent) => {
    if (open) {
      setOpen(false, event.nativeEvent, 'close-press');
    }
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
  });

  const getRootProps = (externalProps: HTMLProps) =>
    mergeProps({ onClick: handleClick }, externalProps, getButtonProps);

  return {
    getRootProps,
    ref: buttonRef,
  };
}

export namespace useDialogClose {
  export interface Parameters {
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
    setOpen: (
      open: boolean,
      event: Event | undefined,
      reason: DialogOpenChangeReason | undefined,
    ) => void;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root element props.
     */
    getRootProps: (externalProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
    ref: React.RefCallback<HTMLElement> | null;
  }
}
