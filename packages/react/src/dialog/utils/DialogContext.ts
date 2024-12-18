'use client';
import * as React from 'react';
import type { useDialogRoot } from '../root/useDialogRoot';

/**
 * Common context for dialog & dialog alert components.
 */
export interface DialogContext extends useDialogRoot.ReturnValue {
  /**
   * Determines if the dialog is nested within a parent dialog.
   */
  nested: boolean;
}

export const DialogContext = React.createContext<DialogContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  DialogContext.displayName = 'DialogContext';
}

export function useDialogContext() {
  return React.useContext(DialogContext);
}
