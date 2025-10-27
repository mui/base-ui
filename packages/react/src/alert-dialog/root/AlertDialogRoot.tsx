'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useDialogRoot } from '../../dialog/root/useDialogRoot';
import { DialogRootContext, useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { DialogStore } from '../../dialog/store/DialogStore';
import { DialogHandle } from '../../dialog/store/DialogHandle';
import type { DialogRoot } from '../../dialog/root/DialogRoot';

/**
 * Groups all parts of the alert dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogRoot<Payload>(props: AlertDialogRoot.Props<Payload>) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    actionsRef,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
  } = props;

  const parentDialogRootContext = useDialogRootContext();
  const nested = Boolean(parentDialogRootContext);

  const store = useRefWithInit(() => handle?.store ?? new DialogStore<Payload>()).current;

  store.useControlledProp('open', openProp, defaultOpen);
  store.useControlledProp('activeTriggerId', triggerIdProp, defaultTriggerIdProp);
  store.useSyncedValue('nested', nested);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const payload = store.useState('payload') as Payload | undefined;

  useDialogRoot({
    store,
    actionsRef,
    parentContext: parentDialogRootContext?.store.context,
    onOpenChange,
    triggerIdProp,
  });

  const contextValue: DialogRootContext<Payload> = React.useMemo(() => ({ store }), [store]);

  return (
    <DialogRootContext.Provider value={contextValue as DialogRootContext}>
      {typeof children === 'function' ? children({ payload }) : children}
    </DialogRootContext.Provider>
  );
}

export interface AlertDialogRootProps<Payload = unknown>
  extends Omit<
    DialogRoot.Props<Payload>,
    'modal' | 'dismissible' | 'onOpenChange' | 'actionsRef' | 'handle'
  > {
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
  /**
   * A handle to associate the popover with a trigger.
   * If specified, allows external triggers to control the popover's open state.
   * Can be created with the AlertDialog.createHandle() method.
   */
  handle?: DialogHandle<Payload>;
}

export type AlertDialogRootActions = DialogRoot.Actions;

export type AlertDialogRootChangeEventReason = DialogRoot.ChangeEventReason;
export type AlertDialogRootChangeEventDetails =
  BaseUIChangeEventDetails<AlertDialogRoot.ChangeEventReason> & {
    preventUnmountOnClose(): void;
  };

export namespace AlertDialogRoot {
  export type Props<Payload = unknown> = AlertDialogRootProps<Payload>;
  export type Actions = AlertDialogRootActions;
  export type ChangeEventReason = AlertDialogRootChangeEventReason;
  export type ChangeEventDetails = AlertDialogRootChangeEventDetails;
}
