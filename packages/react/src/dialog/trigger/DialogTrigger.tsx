'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useButton } from '../../use-button/useButton';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { CLICK_TRIGGER_IDENTIFIER } from '../../utils/constants';
import { DialogHandle } from '../store/DialogHandle';
import { useTriggerDataForwarding } from '../../utils/popups';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useClick, useInteractions } from '../../floating-ui-react';

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
    handle,
    ...elementProps
  } = componentProps;

  const dialogRootContext = useDialogRootContext(true);
  const store = handle?.store ?? dialogRootContext?.store;
  if (!store) {
    throw new Error(
      'Base UI: <Dialog.Trigger> must be used within <Dialog.Root> or provided with a handle.',
    );
  }

  const thisTriggerId = useBaseUiId(idProp);
  const floatingContext = store.useState('floatingRootContext');
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);

  const triggerElementRef = React.useRef<HTMLElement | null>(null);

  const { registerTrigger, isMountedByThisTrigger } = useTriggerDataForwarding(
    thisTriggerId,
    triggerElementRef,
    store,
    {
      payload,
    },
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const click = useClick(floatingContext, { enabled: floatingContext != null });

  const localInteractionProps = useInteractions([click]);

  const state: DialogTrigger.State = {
    disabled,
    open: isOpenedByThisTrigger,
  };

  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);

  return useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef, registerTrigger, triggerElementRef],
    props: [
      localInteractionProps.getReferenceProps(),
      rootTriggerProps,
      { [CLICK_TRIGGER_IDENTIFIER as string]: '', id: thisTriggerId },
      elementProps,
      getButtonProps,
    ],
    stateAttributesMapping: triggerOpenStateMapping,
  });
}) as DialogTrigger;

export interface DialogTrigger {
  <Payload>(
    componentProps: DialogTriggerProps<Payload> & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export interface DialogTriggerProps<Payload = unknown>
  extends NativeButtonProps, BaseUIComponentProps<'button', DialogTrigger.State> {
  /**
   * A handle to associate the trigger with a dialog.
   * Can be created with the Dialog.createHandle() method.
   */
  handle?: DialogHandle<Payload> | undefined;
  /**
   * A payload to pass to the dialog when it is opened.
   */
  payload?: Payload | undefined;
  /**
   * ID of the trigger. In addition to being forwarded to the rendered element,
   * it is also used to specify the active trigger for the dialogs in controlled mode (with the DialogRoot `triggerId` prop).
   */
  id?: string | undefined;
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
  export type Props<Payload = unknown> = DialogTriggerProps<Payload>;
  export type State = DialogTriggerState;
}
