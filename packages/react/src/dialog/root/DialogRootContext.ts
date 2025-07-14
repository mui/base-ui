'use client';
import * as React from 'react';
import { DialogContext } from '../utils/DialogContext';

export interface DialogRootContext {
  /**
   * Determines whether the dialog should close on outside clicks.
   */
  dismissible: boolean;
}

export const DialogRootContext = React.createContext<DialogRootContext | undefined>(undefined);

export function useOptionalDialogRootContext() {
  const dialogRootContext = React.useContext(DialogRootContext);
  const dialogContext = React.useContext(DialogContext);

  if (dialogContext === undefined && dialogRootContext === undefined) {
    return undefined;
  }

  return {
    ...dialogRootContext,
    ...dialogContext,
  };
}

export function useDialogRootContext(optional?: false): DialogRootContext & DialogContext;
export function useDialogRootContext(
  optional: true,
): (DialogRootContext & DialogContext) | undefined;
export function useDialogRootContext(
  optional?: boolean,
): (DialogRootContext & DialogContext) | undefined {
  const dialogRootContext = React.useContext(DialogRootContext);
  const dialogContext = React.useContext(DialogContext);

  if (dialogContext === undefined) {
    if (optional === true) {
      return undefined;
    }

    throw new Error(
      'Base UI: DialogRootContext is missing. Dialog parts must be placed within <Dialog.Root>.',
    );
  }

  return {
    ...dialogRootContext,
    ...dialogContext,
  } as DialogRootContext & DialogContext;
}
