'use client';
import * as React from 'react';
import { DialogContext } from '../utils/DialogContext';

export interface DialogRootContext extends DialogContext {
  /**
   * Determines whether the dialog should close on outside clicks.
   */
  dismissible: boolean;
}

export const DialogRootContext = React.createContext<DialogRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  DialogRootContext.displayName = 'DialogRootContext';
}

export function useDialogRootContext() {
  const dialogRootContext = React.useContext(DialogRootContext);
  const dialogContext = React.useContext(DialogContext);
  if (dialogRootContext === undefined || dialogContext === undefined) {
    throw new Error(
      'Base UI: DialogRootContext is missing. Dialog parts must be placed within <Dialog.Root>.',
    );
  }

  return {
    ...dialogRootContext,
    ...dialogContext
  };
}
