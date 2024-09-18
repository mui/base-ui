'use client';
import * as React from 'react';
import type { AlertDialogRootContextValue } from './AlertDialogRoot.types';

export const AlertDialogRootContext = React.createContext<AlertDialogRootContextValue | undefined>(
  undefined,
);

export function useAlertDialogRootContext() {
  const context = React.useContext(AlertDialogRootContext);
  if (context === undefined) {
    throw new Error('useAlertDialogRootContext must be used within an AlertDialogRoot');
  }
  return context;
}
