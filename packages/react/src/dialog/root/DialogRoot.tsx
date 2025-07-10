'use client';
import * as React from 'react';
import { DialogRootContext, useOptionalDialogRootContext } from './DialogRootContext';
import { DialogContext } from '../utils/DialogContext';
import { useDialogRoot } from './useDialogRoot';
import { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';
import { useDialogProviderContext } from '../provider/DialogProvider';

/**
 * Groups all parts of the dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogRoot: React.FC<DialogRoot.Props> = function DialogRoot(props) {
  const {
    children,
    defaultOpen = false,
    dismissible = true,
    modal = true,
    onOpenChange,
    open,
    actionsRef,
    onOpenChangeComplete,
    id,
  } = props;

  const parentDialogRootContext = useOptionalDialogRootContext();
  const dialogProviderContext = useDialogProviderContext(true);

  const dialogRoot = useDialogRoot({
    open,
    defaultOpen,
    onOpenChange,
    modal,
    dismissible,
    actionsRef,
    onOpenChangeComplete,
    onNestedDialogClose: parentDialogRootContext?.onNestedDialogClose,
    onNestedDialogOpen: parentDialogRootContext?.onNestedDialogOpen,
  });

  const { open: isOpen, setOpen } = dialogRoot;
  const [payload, setPayload] = React.useState<any>(undefined);

  React.useEffect(() => {
    if (id && dialogProviderContext) {
      dialogProviderContext.registerDialog({
        id,
        isOpen,
        open: (triggerPayload: any) => {
          setPayload(triggerPayload);
          setOpen(true, undefined, 'detached-open-press');
        },
        close: () => setOpen(false, undefined, 'detached-close-press'),
      });

      console.log('registering dialog', id);

      return () => {
        console.log('unregistering dialog', id);
        dialogProviderContext.unregisterDialog(id);
      };
    }

    return undefined;
  }, [dialogProviderContext, isOpen, id, setOpen]); // TODO: remove isOpen from dependencies

  const nested = Boolean(parentDialogRootContext);

  const dialogContextValue = React.useMemo(
    () => ({
      ...dialogRoot,
      nested,
      onOpenChangeComplete,
    }),
    [dialogRoot, nested, onOpenChangeComplete],
  );
  const dialogRootContextValue = React.useMemo(() => ({ dismissible }), [dismissible]);

  return (
    <DialogContext.Provider value={dialogContextValue}>
      <DialogRootContext.Provider value={dialogRootContextValue}>
        {typeof children === 'function' ? children({ payload }) : children}
      </DialogRootContext.Provider>
    </DialogContext.Provider>
  );
};

export namespace DialogRoot {
  export interface Props extends useDialogRoot.SharedParameters {
    children?: React.ReactNode | (({ payload }: { payload: any }) => React.ReactNode);
    id?: string;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = BaseOpenChangeReason | 'close-press';
}
