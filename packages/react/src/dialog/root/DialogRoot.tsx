'use client';
import * as React from 'react';
import { DialogRootContext, useOptionalDialogRootContext } from './DialogRootContext';
import { DialogContext } from '../utils/DialogContext';
import { useDialogRoot } from './useDialogRoot';
import { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';
import { useDialogProviderContext } from '../provider/DialogProvider';
import { TypedDialogHandle } from '../factory/createDialog';

/**
 * Groups all parts of the dialog.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogRoot = function DialogRoot<Payload = any>(props: DialogRoot.Props<Payload>) {
  const {
    children,
    defaultOpen = false,
    dismissible = true,
    modal = true,
    onOpenChange,
    open,
    actionsRef,
    onOpenChangeComplete,
    dialog,
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
  const [payload, setPayload] = React.useState<Payload | undefined>(undefined);

  React.useEffect(() => {
    if (dialog && dialogProviderContext) {
      dialogProviderContext.registerDialog({
        id: dialog.id,
        isOpen,
        open: (triggerPayload: Payload) => {
          setPayload(triggerPayload);
          setOpen(true, undefined, 'detached-open-press' as any);
        },
        close: () => setOpen(false, undefined, 'detached-close-press' as any),
      });

      return () => {
        dialogProviderContext.unregisterDialog(dialog.id);
      };
    }

    return undefined;
  }, [dialogProviderContext, isOpen, dialog, setOpen]); // TODO: remove isOpen from dependencies

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
  export interface Props<Payload = any> extends useDialogRoot.SharedParameters {
    children?: React.ReactNode | ChildRenderFunction<Payload>;
    dialog?: TypedDialogHandle<Payload>;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type ChildRenderFunction<Payload> = ({
    payload,
  }: {
    payload: Payload | undefined;
  }) => React.ReactNode;

  export type OpenChangeReason = BaseOpenChangeReason | 'close-press';
}
