'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useDialogRoot } from '../../dialog/root/useDialogRoot';
import { DialogStore } from '../../dialog/store';
import { DialogRootContext, useDialogRootContext } from '../../dialog/root/DialogRootContext';
import type { DialogRoot } from '../../dialog/root/DialogRoot';
import { getEmptyContext } from '../../floating-ui-react/hooks/useFloatingRootContext';
import { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { EMPTY_OBJECT } from '../../utils/constants';

const INITIAL_STATE = {
  open: false,
  dismissible: false,
  nested: false,
  popupElement: null,
  triggerElement: null,
  viewportElement: null,
  modal: true,
  descriptionElementId: undefined,
  titleElementId: undefined,
  openMethod: null,
  mounted: false,
  transitionStatus: 'idle',
  nestedOpenDialogCount: 0,
  triggerProps: EMPTY_OBJECT,
  popupProps: EMPTY_OBJECT,
  floatingRootContext: getEmptyContext(),
} as const;

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
    open: openProp,
    actionsRef,
  } = props;

  const parentDialogRootContext = useDialogRootContext();
  const nested = Boolean(parentDialogRootContext);

  const store = useRefWithInit(DialogStore.create, INITIAL_STATE).current;

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

  const contextValue: DialogRootContext = React.useMemo(() => ({ store }), [store]);

  return <DialogRootContext.Provider value={contextValue}>{children}</DialogRootContext.Provider>;
};

export interface AlertDialogRootProps
  extends Omit<DialogRoot.Props, 'modal' | 'dismissible' | 'onOpenChange' | 'actionsRef'> {
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
  export type Props = AlertDialogRootProps;
  export type Actions = AlertDialogRootActions;
  export type ChangeEventReason = AlertDialogRootChangeEventReason;
  export type ChangeEventDetails = AlertDialogRootChangeEventDetails;
}
