'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useDialogRoot } from './useDialogRoot';
import { DialogRootContext, useDialogRootContext } from './DialogRootContext';
import { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { DialogStore } from '../store/DialogStore';
import { DialogHandle } from '../store/DialogHandle';
import { type PayloadChildRenderFunction } from '../../utils/popupStoreUtils';

/**
 * Groups all parts of the dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogRoot<Payload>(props: DialogRoot.Props<Payload>) {
  const {
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    dismissible = true,
    modal = true,
    actionsRef,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
  } = props;

  const parentDialogRootContext = useDialogRootContext(true);
  const nested = Boolean(parentDialogRootContext);

  const store = useRefWithInit(() => handle?.store ?? new DialogStore<Payload>()).current;

  store.useControlledProp('open', openProp, defaultOpen);
  store.useControlledProp('activeTriggerId', triggerIdProp, defaultTriggerIdProp);
  store.useSyncedValues({ dismissible, nested, modal });
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

export interface DialogRootProps<Payload = unknown> {
  /**
   * Whether the dialog is currently open.
   */
  open?: boolean;
  /**
   * Whether the dialog is initially open.
   *
   * To render a controlled dialog, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Determines if the dialog enters a modal state when open.
   * - `true`: user interaction is limited to just the dialog: focus is trapped, document page scroll is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the dialog, but document page scroll is not locked and pointer interactions outside of it remain enabled.
   * @default true
   */
  modal?: boolean | 'trap-focus';
  /**
   * Event handler called when the dialog is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: DialogRoot.ChangeEventDetails) => void;
  /**
   * Event handler called after any animations complete when the dialog is opened or closed.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * Determines whether the dialog should close on outside clicks.
   * @default true
   */
  dismissible?: boolean;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the dialog will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the dialog manually.
   * Useful when the dialog's animation is controlled by an external library.
   */
  actionsRef?: React.RefObject<DialogRoot.Actions>;
  /**
   * A handle to associate the popover with a trigger.
   * If specified, allows external triggers to control the popover's open state.
   * Can be created with the Dialog.createHandle() method.
   */
  handle?: DialogHandle<Payload>;
  /**
   * The content of the dialog.
   * This can be a regular React node or a render function that receives the `payload` of the active trigger.
   */
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
  /**
   * ID of the trigger that the dialog is associated with.
   * This is useful in conjuntion with the `open` prop to create a controlled dialog.
   * There's no need to specify this prop when the popover is uncontrolled (i.e. when the `open` prop is not set).
   */
  triggerId?: string | null;
  /**
   * ID of the trigger that the dialog is associated with.
   * This is useful in conjunction with the `defaultOpen` prop to create an initially open dialog.
   */
  defaultTriggerId?: string | null;
}

export interface DialogRootActions {
  unmount: () => void;
  close: () => void;
}

export type DialogRootChangeEventReason =
  | 'trigger-press'
  | 'outside-press'
  | 'escape-key'
  | 'close-press'
  | 'focus-out'
  | 'imperative-action'
  | 'none';

export type DialogRootChangeEventDetails =
  BaseUIChangeEventDetails<DialogRoot.ChangeEventReason> & {
    preventUnmountOnClose(): void;
  };

export namespace DialogRoot {
  export type Props<Payload = unknown> = DialogRootProps<Payload>;
  export type Actions = DialogRootActions;
  export type ChangeEventReason = DialogRootChangeEventReason;
  export type ChangeEventDetails = DialogRootChangeEventDetails;
}
