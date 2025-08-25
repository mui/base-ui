'use client';
import * as React from 'react';
import type { DialogRoot } from '../../dialog/root/DialogRoot';
import { AlertDialogRootContext } from './AlertDialogRootContext';
import { useDialogRoot } from '../../dialog/root/useDialogRoot';
import { BaseUIEventData } from '../../utils/createBaseUIEventData';

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
  export interface Props
    extends Omit<DialogRoot.Props, 'modal' | 'dismissible' | 'onOpenChange' | 'actionsRef'> {
    /**
     * Event handler called when the dialog is opened or closed.
     */
    onOpenChange?: (open: boolean, data: AlertDialogRoot.ChangeEventData) => void;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the dialog will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the dialog manually.
     * Useful when the dialog's animation is controlled by an external library.
     */
    actionsRef?: React.RefObject<AlertDialogRoot.Actions>;
  }

  export type Actions = DialogRoot.Actions;

  export type ChangeReason = DialogRoot.ChangeReason;
  export type ChangeEventData = BaseUIEventData<ChangeReason>;
}
