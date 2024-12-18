'use client';
import * as React from 'react';
import { DialogContext } from '../../dialog/utils/DialogContext';

export { DialogContext as AlertDialogRootContext };

export function useAlertDialogRootContext() {
  const context = React.useContext(DialogContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: AlertDialogRootContext is missing. Alert dialogs parts must be placed within <AlertDialog.Root>.',
    );
  }

  return context;
}
