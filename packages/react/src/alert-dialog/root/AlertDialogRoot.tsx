'use client';
import type * as React from 'react';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { DialogRoot } from '../../dialog/root/DialogRoot';
import { useRenderDialogRoot } from '../../dialog/root/useRenderDialogRoot';
import type { AlertDialogHandle } from '../handle';

/**
 * Groups all parts of the alert dialog.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogRoot<Payload>(props: AlertDialogRoot.Props<Payload>) {
  return useRenderDialogRoot('alert-dialog', props);
}

export interface AlertDialogRootState {}

export interface AlertDialogRootProps<Payload = unknown> extends Omit<
  DialogRoot.Props<Payload>,
  'modal' | 'disablePointerDismissal' | 'onOpenChange' | 'actionsRef' | 'handle'
> {
  /**
   * Event handler called when the alert dialog is opened or closed.
   */
  onOpenChange?:
    ((open: boolean, eventDetails: AlertDialogRoot.ChangeEventDetails) => void) | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: Ends the closing phase of the alert dialog after an externally controlled closing animation finishes.
   * Call `preventUnmountOnClose()` in `onOpenChange` first, otherwise the alert dialog completes closing on its own.
   * Whether it leaves the DOM is decided by `keepMounted` on the portal.
   * - `close`: Closes the alert dialog imperatively when called.
   */
  actionsRef?: React.RefObject<AlertDialogRoot.Actions | null> | undefined;
  /**
   * A handle to associate the alert dialog with a trigger.
   * If specified, allows external triggers to control the alert dialog's open state.
   * Can be created with the AlertDialog.createHandle() method.
   */
  handle?: AlertDialogHandle<Payload> | undefined;
}

export type AlertDialogRootActions = DialogRoot.Actions;

export type AlertDialogRootChangeEventReason = DialogRoot.ChangeEventReason;
export type AlertDialogRootChangeEventDetails =
  BaseUIChangeEventDetails<AlertDialogRoot.ChangeEventReason> & {
    /** Prevents the popup from unmounting until the `unmount` action is called. */
    preventUnmountOnClose: () => void;
  };

export namespace AlertDialogRoot {
  export type State = AlertDialogRootState;
  export type Props<Payload = unknown> = AlertDialogRootProps<Payload>;
  export type Actions = AlertDialogRootActions;
  export type ChangeEventReason = AlertDialogRootChangeEventReason;
  export type ChangeEventDetails = AlertDialogRootChangeEventDetails;
}
