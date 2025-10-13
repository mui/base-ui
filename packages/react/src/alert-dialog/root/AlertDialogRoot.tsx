'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useDialogRoot } from '../../dialog/root/useDialogRoot';
import { DialogRootContext, useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { DialogStore } from '../../dialog/DialogStore';
import type { DialogRoot } from '../../dialog/root/DialogRoot';

/**
 * Groups all parts of the alert dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export const AlertDialogRoot: React.FC<AlertDialogRoot.Props> = function AlertDialogRoot<Payload>(
  props: AlertDialogRoot.Props<Payload>,
) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    actionsRef,
    handle,
  } = props;

  const parentDialogRootContext = useDialogRootContext();
  const nested = Boolean(parentDialogRootContext);

  const store = useRefWithInit(() => handle ?? new DialogStore<Payload>()).current;

  store.useControlledProp('open', openProp, defaultOpen);
  store.useSyncedValue('nested', nested);
  store.useContextCallback('openChange', onOpenChange);
  store.useContextCallback('openChangeComplete', onOpenChangeComplete);

  useDialogRoot({
    store,
    actionsRef,
    parentContext: parentDialogRootContext?.store.context,
    onOpenChange,
  });

  const contextValue: DialogRootContext<Payload> = React.useMemo(() => ({ store }), [store]);

  return (
    <DialogRootContext.Provider value={contextValue as DialogRootContext}>
      {children}
    </DialogRootContext.Provider>
  );
};

export interface AlertDialogRootProps<Payload = unknown>
  extends Omit<DialogRoot.Props<Payload>, 'modal' | 'dismissible' | 'onOpenChange' | 'actionsRef'> {
  /**
   * Event handler called when the dialog is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: AlertDialogRoot.ChangeEventDetails) => void;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the dialog will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the dialog manually.
   * Useful when the dialog's animation is controlled by an external library.
   */
  actionsRef?: React.RefObject<AlertDialogRoot.Actions>;
}

export type AlertDialogRootActions = DialogRoot.Actions;

export type AlertDialogRootChangeEventReason = DialogRoot.ChangeEventReason;
export type AlertDialogRootChangeEventDetails =
  BaseUIChangeEventDetails<AlertDialogRoot.ChangeEventReason>;

export namespace AlertDialogRoot {
  export type Props<Payload = unknown> = AlertDialogRootProps<Payload>;
  export type Actions = AlertDialogRootActions;
  export type ChangeEventReason = AlertDialogRootChangeEventReason;
  export type ChangeEventDetails = AlertDialogRootChangeEventDetails;
}
