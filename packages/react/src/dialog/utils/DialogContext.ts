'use client';
import * as React from 'react';
import { DialogStore } from '../store';

/**
 * Common context for dialog & dialog alert components.
 */
export interface DialogContext {
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

export const DialogContext = React.createContext<DialogContext | undefined>(undefined);

export function useDialogContext() {
  return React.useContext(DialogContext);
}
