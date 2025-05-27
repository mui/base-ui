'use client';
import * as React from 'react';
import { useButton } from '../../use-button/useButton';
import { mergeProps } from '../../merge-props';
import { OpenChangeReason } from '../../utils/translateOpenChangeReason';
import type { HTMLProps } from '../../utils/types';
import { useEventCallback } from '../../utils/useEventCallback';

export function useDialogClose(params: useDialogClose.Parameters): useDialogClose.ReturnValue {
  const { open, setOpen, rootRef: externalRef, disabled, nativeButton } = params;

  const handleClick = useEventCallback((event: React.MouseEvent) => {
    if (open) {
      setOpen(false, event.nativeEvent, 'click');
    }
  });

  const { getButtonProps } = useButton({
    disabled,
    buttonRef: externalRef,
    native: nativeButton,
  });

  const getRootProps = (externalProps: HTMLProps) =>
    mergeProps({ onClick: handleClick }, externalProps, getButtonProps);

  return {
    getRootProps,
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
      reason: OpenChangeReason | undefined,
    ) => void;
    rootRef: React.Ref<HTMLElement>;
    /**
     * Determines whether the component is being rendered as a native button.
     * @default true
     */
    nativeButton: boolean;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root element props.
     */
    getRootProps: (externalProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  }
}
