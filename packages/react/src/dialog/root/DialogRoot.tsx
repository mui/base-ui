'use client';
import * as React from 'react';
import { DialogRootContext, useOptionalDialogRootContext } from './DialogRootContext';
import { DialogContext } from '../utils/DialogContext';
import { useDialogRoot } from './useDialogRoot';

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
  } = props;

  const parentDialogRootContext = useOptionalDialogRootContext();

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
        {children}
      </DialogRootContext.Provider>
    </DialogContext.Provider>
  );
};

export namespace DialogRoot {
  export interface Props extends useDialogRoot.SharedParameters {
    children?: React.ReactNode;
  }

  export type Actions = useDialogRoot.Actions;
}
