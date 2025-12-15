import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export const DialogPortalContext = React.createContext<boolean | undefined>(undefined);

export function useDialogPortalContext() {
  const value = useContext(DialogPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <Dialog.Portal> is missing.');
  }
  return value;
}
