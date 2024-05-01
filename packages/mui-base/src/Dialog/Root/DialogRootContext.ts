import * as React from 'react';

export interface DialogRootContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  modal: boolean;
}

export const DialogRootContext = React.createContext<DialogRootContextValue | undefined>(undefined);

export function useDialogRootContext() {
  const context = React.useContext(DialogRootContext);
  if (context === undefined) {
    throw new Error('useDialogRootContext must be used within a DialogRoot');
  }
  return context;
}
