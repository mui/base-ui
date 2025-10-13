'use client';
import * as React from 'react';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { useButton } from '../../use-button/useButton';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { DialogStore } from '../../dialog/DialogStore';
import { useTriggerRegistration } from '../../utils/popupStoreUtils';
import { useBaseUiId } from '../../utils/useBaseUiId';

/**
 * A button that opens the alert dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export const AlertDialogTrigger = React.forwardRef(function AlertDialogTrigger(
  componentProps: AlertDialogTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled = false,
    nativeButton = true,
    id: idProp,
    payload,
    ...elementProps
  } = componentProps;

  const { store } = useDialogRootContext();
  const open = store.useState('open');
  const triggerProps = store.useState('activeTriggerProps');

  const state: AlertDialogTrigger.State = React.useMemo(
    () => ({
      disabled,
      open,
    }),
    [disabled, open],
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const id = useBaseUiId(idProp);
  const registerTrigger = useTriggerRegistration(id, payload, store);

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef, registerTrigger],
    stateAttributesMapping: triggerOpenStateMapping,
    props: [triggerProps, elementProps, getButtonProps],
  });
}) as AlertDialogTrigger;

interface AlertDialogTrigger {
  <Payload>(
    componentProps: AlertDialogTriggerProps<Payload> & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export interface AlertDialogTriggerProps<Payload = unknown>
  extends NativeButtonProps,
    BaseUIComponentProps<'button', AlertDialogTrigger.State> {
  /**
   * A handle to associate the trigger with a popover.
   */
  handle?: DialogStore<Payload>;
  /**
   * A payload to pass to the popover when it is opened.
   */
  payload?: Payload;
  /**
   * ID of the trigger. In addition to being forwarded to the rendered element,
   * it is also used to specify the active trigger for the dialogs in controlled mode (with the DialogRoot `triggerId` prop).
   */
  id?: string;
}

export interface AlertDialogTriggerState {
  /**
   * Whether the dialog is currently disabled.
   */
  disabled: boolean;
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
}

export namespace AlertDialogTrigger {
  export type Props = AlertDialogTriggerProps;
  export type State = AlertDialogTriggerState;
}
