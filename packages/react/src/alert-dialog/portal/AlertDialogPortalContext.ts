import * as React from 'react';

export const AlertDialogPortalContext = React.createContext<boolean | undefined>(undefined);

export function useAlertDialogPortalContext() {
  const value = React.useContext(AlertDialogPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <AlertDialog.Portal> is missing.');
  }
  return value;
}
