'use client';
import * as React from 'react';
import type { useDialogRoot } from './useDialogRoot';

export interface DialogRootContext extends useDialogRoot.ReturnValue {
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   */
  animated: boolean;
  /**
   * Determines if the dialog is nested within a parent dialog.
   */
  hasParentDialog: boolean;
  /**
   * Determines whether the dialog should close when clicking outside of it.
   * @default true
   */
  dismissible?: boolean;
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
