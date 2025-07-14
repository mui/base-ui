'use client';
import * as React from 'react';
import { DialogRootContext, useOptionalDialogRootContext } from '../root/DialogRootContext';
import { DialogContext } from '../utils/DialogContext';
import { useDialogRoot } from '../root/useDialogRoot';
import { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';
import { useDialogProviderContext } from '../provider/DialogProvider';
import type { TypedDialogHandle } from '../factory/createDialog';

/**
 * Groups all parts of the dialog with typed payload support.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const TypedDialogRoot = function TypedDialogRoot<TPayload>(
  props: TypedDialogRoot.Props<TPayload>,
) {
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
  const [payload, setPayload] = React.useState<TPayload | undefined>(undefined);

  React.useEffect(() => {
    if (dialog && dialogProviderContext) {
      dialogProviderContext.registerDialog({
        id: dialog.id,
        isOpen,
        open: (triggerPayload: TPayload) => {
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
        {typeof children === 'function' ? children({ payload: payload! }) : children}
      </DialogRootContext.Provider>
    </DialogContext.Provider>
  );
};

export namespace TypedDialogRoot {
  export interface Props<TPayload> extends useDialogRoot.SharedParameters {
    children?: React.ReactNode | (({ payload }: { payload: TPayload }) => React.ReactNode);
    dialog: TypedDialogHandle<TPayload>;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = BaseOpenChangeReason | 'close-press';
}
