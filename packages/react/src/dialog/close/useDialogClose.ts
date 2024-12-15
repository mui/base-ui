'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { OpenChangeReason } from '../../utils/translateOpenChangeReason';
import { useEventCallback } from '../../utils/useEventCallback';

export function useDialogClose(params: useDialogClose.Parameters): useDialogClose.ReturnValue {
  const { open, setOpen } = params;

  const handleClick = useEventCallback((event: React.MouseEvent) => {
    if (open) {
      setOpen(false, event.nativeEvent, 'click');
    }
  });

  const getRootProps = (externalProps: React.HTMLAttributes<any>) =>
    mergeReactProps(externalProps, { onClick: handleClick });

  return {
    getRootProps,
  };
}

export namespace useDialogClose {
  export interface Parameters {
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
  }

  export interface ReturnValue {
    /**
     * Resolver for the root element props.
     */
    getRootProps: (externalProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  }
}
