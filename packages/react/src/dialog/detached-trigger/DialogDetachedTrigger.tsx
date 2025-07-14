'use client';
import * as React from 'react';
import { useButton } from '../../use-button/useButton';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useDialogProviderContext } from '../provider/DialogProvider';
import { useEventCallback } from '../../utils/useEventCallback';
import type { TypedDialogHandle } from '../factory/createDialog';

/**
 * A button that opens the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
function DialogDetachedTriggerInner<TPayload = any>(
  componentProps: DialogDetachedTrigger.Props<TPayload>,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled = false,
    nativeButton = true,
    dialog,
    target,
    payload,
    ...elementProps
  } = componentProps;

  const { getDialog } = useDialogProviderContext();

  const dialogId = dialog?.id || target;
  if (!dialogId) {
    throw new Error('DialogDetachedTrigger requires either a dialog or target prop');
  }

  const targetDialog = getDialog(dialogId);

  const state: DialogDetachedTrigger.State = React.useMemo(
    () => ({
      disabled,
      open: targetDialog?.isOpen ?? false,
    }),
    [disabled, targetDialog?.isOpen],
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const handleClick = useEventCallback(() => {
    const tg = getDialog(dialogId);
    if (tg) {
      tg.open(payload);
    }
  });

  return useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef],
    props: [{ onClick: handleClick }, elementProps, getButtonProps],
    customStyleHookMapping: triggerOpenStateMapping,
  });
}

export const DialogDetachedTrigger = React.forwardRef(DialogDetachedTriggerInner) as <
  TPayload = any,
>(
  props: DialogDetachedTrigger.Props<TPayload> & { ref?: React.ForwardedRef<HTMLButtonElement> },
) => React.ReactElement;

export namespace DialogDetachedTrigger {
  export interface Props<TPayload = any> extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
    dialog?: TypedDialogHandle<TPayload>;
    target?: string;
    payload?: TPayload;
  }

  export interface State {
    /**
     * Whether the dialog is currently disabled.
     */
    disabled: boolean;
    /**
     * Whether the dialog is currently open.
     */
    open: boolean;
  }
}
