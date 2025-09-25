'use client';
import * as React from 'react';
import { DialogStore } from '../store';

export interface DialogRootContext {
  store: DialogStore;
  /**
   * Callback to invoke after any animations complete when the dialog is opened or closed.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * Callback to invoke when a nested dialog is closed.
   */
  onNestedDialogClose?: () => void;
  /**
   * Callback to invoke when a nested dialog is opened.
   */
  onNestedDialogOpen?: (ownChildrenCount: number) => void;
}

export const DialogRootContext = React.createContext<DialogRootContext | undefined>(undefined);

export function useDialogRootContext(optional?: false): DialogRootContext;
export function useDialogRootContext(optional: true): DialogRootContext | undefined;
export function useDialogRootContext(optional?: boolean) {
  const dialogRootContext = React.useContext(DialogRootContext);

  if (optional === false && dialogRootContext === undefined) {
    throw new Error(
      'Base UI: DialogRootContext is missing. Dialog parts must be placed within <Dialog.Root>.',
    );
  }

  return dialogRootContext;
}
