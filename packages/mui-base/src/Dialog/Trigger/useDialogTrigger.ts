'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';

export function useDialogTrigger(
  params: useDialogTrigger.Parameters,
): useDialogTrigger.ReturnValue {
  const { open, onOpenChange, popupElementId } = params;

  const getRootProps = React.useCallback(
    (externalProps: React.HTMLAttributes<any> = {}) =>
      mergeReactProps(externalProps, {
        onClick: () => {
          if (!open) {
            onOpenChange?.(true);
          }
        },
        'aria-haspopup': 'dialog',
        'aria-controls': popupElementId ?? undefined,
      }),
    [open, onOpenChange, popupElementId],
  );

  return React.useMemo(
    () => ({
      getRootProps,
    }),
    [getRootProps],
  );
}

namespace useDialogTrigger {
  export interface Parameters {
    /**
     * Determines if the dialog is open.
     */
    open: boolean;
    /**
     * Callback to fire when the dialog is requested to be opened or closed.
     */
    onOpenChange: (open: boolean) => void;
    /**
     * The id of the popup element.
     */
    popupElementId: string | undefined;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root element props.
     */
    getRootProps: (externalProps?: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  }
}
