import * as React from 'react';

const DialogProviderContext = React.createContext<DialogProviderContext | undefined>(undefined);

export function DialogProvider(props: React.PropsWithChildren<{}>) {
  const dialogsRef = React.useRef<Map<string, DialogHandle<any>>>(new Map());

  const context = React.useMemo<DialogProviderContext>(
    () => ({
      registerDialog: (dialog) => {
        dialogsRef.current.set(dialog.id, dialog);
      },
      unregisterDialog: (dialogId) => {
        dialogsRef.current.delete(dialogId);
      },
      getDialog: (dialogId) => {
        return dialogsRef.current.get(dialogId);
      },
    }),
    [],
  );

  return (
    <DialogProviderContext.Provider value={context}>
      {props.children}
    </DialogProviderContext.Provider>
  );
}

export interface DialogProviderContext {
  registerDialog: (dialog: DialogHandle<any>) => void;
  unregisterDialog: (dialogId: string) => void;
  getDialog: (dialogId: string) => DialogHandle<any> | undefined;
}

interface DialogHandle<TPayload = any> {
  open: (payload: TPayload) => void;
  close: () => void;
  isOpen: boolean;
  id: string;
}

export type { DialogHandle };

export function useDialogProviderContext(optional?: false): DialogProviderContext;
export function useDialogProviderContext(optional: true): DialogProviderContext | undefined;
export function useDialogProviderContext(optional?: boolean): DialogProviderContext | undefined {
  const context = React.useContext(DialogProviderContext);
  if (!context && !optional) {
    throw new Error('useDialogProviderContext must be used within a DialogProvider');
  }

  return context;
}
