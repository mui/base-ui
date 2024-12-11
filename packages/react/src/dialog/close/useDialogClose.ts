'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';

export function useDialogClose(params: useDialogClose.Parameters): useDialogClose.ReturnValue {
  const { open, onOpenChange } = params;
  const handleClick = React.useCallback(() => {
    if (open) {
      onOpenChange?.(false);
    }
  }, [open, onOpenChange]);

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
     * Callback invoked when the dialog is being opened or closed.
     */
    onOpenChange: (open: boolean) => void;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root element props.
     */
    getRootProps: (externalProps: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  }
}
