'use client';
import * as React from 'react';
import type { DialogRoot } from '../../dialog/root/DialogRoot';
import { AlertDialogRootContext } from './AlertDialogRootContext';
import { type DialogOpenChangeReason, useDialogRoot } from '../../dialog/root/useDialogRoot';

/**
 * Groups all parts of the alert dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export const AlertDialogRoot: React.FC<AlertDialogRoot.Props> = function AlertDialogRoot(props) {
  const {
    children,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    open,
    actionsRef,
  } = props;

  const parentDialogRootContext = React.useContext(AlertDialogRootContext);

  const dialogRoot = useDialogRoot({
    open,
    defaultOpen,
    onOpenChange,
    actionsRef,
    onOpenChangeComplete,
    modal: true,
    dismissible: false,
    onNestedDialogClose: parentDialogRootContext?.onNestedDialogClose,
    onNestedDialogOpen: parentDialogRootContext?.onNestedDialogOpen,
  });

  const nested = Boolean(parentDialogRootContext);

  const contextValue: AlertDialogRootContext = React.useMemo(
    () => ({
      ...dialogRoot,
      nested,
      onOpenChangeComplete,
    }),
    [dialogRoot, nested, onOpenChangeComplete],
  );

  return (
    <AlertDialogRootContext.Provider value={contextValue}>
      {children}
    </AlertDialogRootContext.Provider>
  );
};

export namespace AlertDialogRoot {
  export interface Props extends Omit<DialogRoot.Props, 'modal' | 'dismissible' | 'onOpenChange'> {
    /**
     * Event handler called when the dialog is opened or closed.
     * @type (open: boolean, event?: Event, reason?: AlertDialog.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: DialogOpenChangeReason | undefined,
    ) => void;
  }

  export type Actions = DialogRoot.Actions;

  export type OpenChangeReason = DialogOpenChangeReason;
}
