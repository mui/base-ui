'use client';
import * as React from 'react';
import type { DialogRoot } from '../../dialog/root/DialogRoot';
import { AlertDialogRootContext } from './AlertDialogRootContext';
import { useDialogRoot } from '../../dialog/root/useDialogRoot';

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
  export interface Props extends Omit<DialogRoot.Props, 'modal' | 'dismissible'> {}

  export type Actions = DialogRoot.Actions;
}
