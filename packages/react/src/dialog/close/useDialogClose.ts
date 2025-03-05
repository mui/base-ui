'use client';
import * as React from 'react';
import { useButton } from '../../use-button/useButton';
import { mergeProps } from '../../utils/mergeProps';
import { OpenChangeReason } from '../../utils/translateOpenChangeReason';
import type { GenericHTMLProps } from '../../utils/types';
import { useEventCallback } from '../../utils/useEventCallback';

export function useDialogClose(params: useDialogClose.Parameters): useDialogClose.ReturnValue {
  const { open, setOpen, rootRef: externalRef, disabled } = params;

  const handleClick = useEventCallback((event: React.MouseEvent) => {
    if (open) {
      setOpen(false, event.nativeEvent, 'click');
    }
  });

  const { getButtonProps } = useButton({
    disabled,
    buttonRef: externalRef,
  });

  const getRootProps = (externalProps: GenericHTMLProps) =>
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
  }

  export interface ReturnValue {
    /**
     * Resolver for the root element props.
     */
    getRootProps: (externalProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  }
}
