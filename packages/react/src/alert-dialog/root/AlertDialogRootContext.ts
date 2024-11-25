'use client';
import * as React from 'react';
import { type useDialogRoot } from '../../dialog/root/useDialogRoot';

export interface AlertDialogRootContext extends useDialogRoot.ReturnValue {
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   */
  animated: boolean;
  /**
   * Determines if the dialog is nested within a parent dialog.
   */
  hasParentDialog: boolean;
}

export const AlertDialogRootContext = React.createContext<AlertDialogRootContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  AlertDialogRootContext.displayName = 'AlertDialogRootContext';
}

export function useAlertDialogRootContext() {
  const context = React.useContext(AlertDialogRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: AlertDialogRootContext is missing. AlertDialog parts must be placed within <AlertDialog.Root>.',
    );
  }

  return context;
}
