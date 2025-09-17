'use client';
import * as React from 'react';
import { DialogStore } from '../store';
import { type DialogRoot } from '../root/DialogRoot';

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
   * The ref to the Popup element.
   */
  popupRef: React.RefObject<HTMLElement | null>;
  /**
   * A ref to the backdrop element.
   */
  backdropRef: React.RefObject<HTMLDivElement | null>;
  /**
   * A ref to the internal backdrop element.
   */
  internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Event handler called when the dialog is opened or closed.
   */
  setOpen: (open: boolean, eventDetails: DialogRoot.ChangeEventDetails) => void;
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
