'use client';
import * as React from 'react';
import { IsDrawerContext } from '../../dialog/root/DialogRoot';
import { useDialogRoot, DialogInteractions } from '../../dialog/root/useDialogRoot';
import { DialogRootContext, useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { DialogStore } from '../../dialog/store/DialogStore';
import { DialogHandle } from '../../dialog/store/DialogHandle';
import type { DialogRoot } from '../../dialog/root/DialogRoot';

/**
 * Groups all parts of the alert dialog.
 * Doesn't render its own HTML element.
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

  const parentDialogRootContext = useDialogRootContext(true);
  const nested = Boolean(parentDialogRootContext);

  const store = DialogStore.useStore(handle?.store, {
    open: defaultOpen,
    openProp,
    activeTriggerId: defaultTriggerIdProp,
    triggerIdProp,
    modal: true,
    disablePointerDismissal: true,
    nested,
    role: 'alertdialog',
  });

  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);
  store.useSyncedValue('nested', nested);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const payload = store.useState('payload') as Payload | undefined;

  const dialogRootResult = useDialogRoot({
    store,
    actionsRef,
    parentContext: parentDialogRootContext?.context,
    isDrawer: false,
  });

  const shouldRenderInteractions = open || mounted;

  return (
    <IsDrawerContext.Provider value={false}>
      <DialogRootContext.Provider value={store as DialogRootContext}>
        {shouldRenderInteractions && (
          <DialogInteractions
            store={store}
            parentContext={dialogRootResult.parentContext}
            isDrawer={dialogRootResult.isDrawer}
          />
        )}
        {typeof children === 'function' ? children({ payload }) : children}
      </DialogRootContext.Provider>
    </IsDrawerContext.Provider>
  );
}

export interface AlertDialogRootState {}

export interface AlertDialogRootProps<Payload = unknown> extends Omit<
  DialogRoot.Props<Payload>,
  'modal' | 'disablePointerDismissal' | 'onOpenChange' | 'actionsRef' | 'handle'
> {
  /**
   * Event handler called when the dialog is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: AlertDialogRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the dialog will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the dialog manually.
   * Useful when the dialog's animation is controlled by an external library.
   * - `close`: Closes the dialog imperatively when called.
   */
  actionsRef?: React.RefObject<AlertDialogRoot.Actions | null> | undefined;
  /**
   * A handle to associate the alert dialog with a trigger.
   * If specified, allows external triggers to control the alert dialog's open state.
   * Can be created with the AlertDialog.createHandle() method.
   */
  handle?: DialogHandle<Payload> | undefined;
}

export type AlertDialogRootActions = DialogRoot.Actions;

export type AlertDialogRootChangeEventReason = DialogRoot.ChangeEventReason;
export type AlertDialogRootChangeEventDetails =
  BaseUIChangeEventDetails<AlertDialogRoot.ChangeEventReason> & {
    preventUnmountOnClose(): void;
  };

export namespace AlertDialogRoot {
  export type State = AlertDialogRootState;
  export type Props<Payload = unknown> = AlertDialogRootProps<Payload>;
  export type Actions = AlertDialogRootActions;
  export type ChangeEventReason = AlertDialogRootChangeEventReason;
  export type ChangeEventDetails = AlertDialogRootChangeEventDetails;
}
