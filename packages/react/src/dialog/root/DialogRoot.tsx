'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useOptionalDialogRootContext } from './DialogRootContext';
import { DialogContext } from '../utils/DialogContext';
import { useDialogRoot } from './useDialogRoot';
import { BaseUIEventDetails } from '../../utils/createBaseUIEventDetails';
import { DialogStore } from '../store';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';

/**
 * Groups all parts of the dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogRoot: React.FC<DialogRoot.Props> = function DialogRoot(props) {
  const {
    children,
    open: openProp,
    defaultOpen: defaultOpenProp = false,
    onOpenChange,
    onOpenChangeComplete,
    dismissible = true,
    modal = true,
    actionsRef,
  } = props;

  const parentDialogRootContext = useOptionalDialogRootContext();

  const [openState, setOpenState] = useControlled({
    controlled: openProp,
    default: defaultOpenProp,
    name: 'Popover',
    state: 'open',
  });

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

  const store = useRefWithInit(DialogStore.create, {
    ...dialogRoot,
    dismissible,
    nested,
    popupElement: null,
    triggerElement: null,
  }).current;

  useIsoLayoutEffect(() => {
    store.set('open', openState);
  }, [openState, store]);

  const dialogContextValue: DialogContext = React.useMemo(
    () => ({
      store,
      onOpenChangeComplete,
      popupRef: dialogRoot.popupRef,
      backdropRef: dialogRoot.backdropRef,
      internalBackdropRef: dialogRoot.internalBackdropRef,
      setOpen: dialogRoot.setOpen,
      onNestedDialogClose: dialogRoot.onNestedDialogClose,
      onNestedDialogOpen: dialogRoot.onNestedDialogOpen,
    }),
    [
      store,
      onOpenChangeComplete,
      dialogRoot.popupRef,
      dialogRoot.backdropRef,
      dialogRoot.internalBackdropRef,
      dialogRoot.setOpen,
      dialogRoot.onNestedDialogClose,
      dialogRoot.onNestedDialogOpen,
    ],
  );

  return <DialogContext.Provider value={dialogContextValue}>{children}</DialogContext.Provider>;
};

export namespace DialogRoot {
  export interface Props extends useDialogRoot.SharedParameters {
    children?: React.ReactNode;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type ChangeEventReason =
    | 'trigger-press'
    | 'outside-press'
    | 'escape-key'
    | 'close-press'
    | 'focus-out'
    | 'none';
  export type ChangeEventDetails = BaseUIEventDetails<ChangeEventReason>;
}

export interface UseControlledWithStoreParameters<Value, Store> {
  /**
   * Holds the component value when it's controlled.
   */
  controlled: Value | undefined;
  /**
   * The default value when uncontrolled.
   */
  default: Value | undefined;
  /**
   * The component name displayed in warnings.
   */
  key: keyof Store;
  store: Store;
}
