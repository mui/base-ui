'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useButton } from '../../use-button/useButton';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { CLICK_TRIGGER_IDENTIFIER } from '../../utils/constants';
import { DialogStore } from '../DialogStore';
import { useTriggerRegistration } from '../../utils/popupStoreUtils';
import { useBaseUiId } from '../../utils/useBaseUiId';

/**
 * A button that opens the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogTrigger = React.forwardRef(function DialogTrigger(
  componentProps: DialogTrigger.Props,
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

  const state: DialogTrigger.State = React.useMemo(
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
    ref: [buttonRef, forwardedRef, registerTrigger],
    props: [
      triggerProps,
      { [CLICK_TRIGGER_IDENTIFIER as string]: '' },
      elementProps,
      getButtonProps,
    ],
    stateAttributesMapping: triggerOpenStateMapping,
  });
}) as DialogTrigger;

interface DialogTrigger {
  <Payload>(
    componentProps: DialogTriggerProps<Payload> & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export interface DialogTriggerProps<Payload = unknown>
  extends NativeButtonProps,
    BaseUIComponentProps<'button', DialogTrigger.State> {
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

export interface DialogTriggerState {
  /**
   * Whether the dialog is currently disabled.
   */
  disabled: boolean;
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
}

export namespace DialogTrigger {
  export type Props = DialogTriggerProps;
  export type State = DialogTriggerState;
}
