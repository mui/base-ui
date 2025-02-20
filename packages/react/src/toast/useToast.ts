import * as React from 'react';
import { ToastContext } from './provider/ToastProviderContext';

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a Toast.Provider');
  }
  return context;
}
