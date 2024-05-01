import * as React from 'react';
import { DialogType } from './DialogRoot.types';

export interface DialogRootContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  modal: boolean;
  type: DialogType;
  titleElementId: string | null;
  registerTitle: (elementId: string | null) => void;
  descriptionElementId: string | null;
  registerDescription: (elementId: string | null) => void;
  popupElementId: string | null;
  registerPopup: (elementId: string | null) => void;
}

export const DialogRootContext = React.createContext<DialogRootContextValue | undefined>(undefined);

export function useDialogRootContext() {
  const context = React.useContext(DialogRootContext);
  if (context === undefined) {
    throw new Error('useDialogRootContext must be used within a DialogRoot');
  }
  return context;
}
