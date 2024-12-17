'use client';
import * as React from 'react';
import type { useDialogRoot } from './useDialogRoot';

export interface DialogRootContext extends useDialogRoot.ReturnValue {
  /**
   * Determines if the dialog is nested within a parent dialog.
   */
  nested: boolean;
  /**
   * Determines whether the dialog should close on outside clicks.
   */
  dismissible: boolean;
}

export const DialogRootContext = React.createContext<DialogRootContext | undefined>(undefined);

export function useDialogRootContext() {
  const context = React.useContext(DialogRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: DialogRootContext is missing. Dialog parts must be placed within <Dialog.Root>.',
    );
  }

  return context;
}
