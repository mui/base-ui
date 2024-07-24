import * as React from 'react';
import type { DialogRootContextValue } from './DialogRoot.types';

export const DialogRootContext = React.createContext<DialogRootContextValue | undefined>(undefined);

export function useDialogRootContext() {
  const context = React.useContext(DialogRootContext);
  if (context === undefined) {
    throw new Error('useDialogRootContext must be used within a DialogRoot');
  }
  return context;
}
