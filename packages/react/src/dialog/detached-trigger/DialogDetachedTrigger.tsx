'use client';
import * as React from 'react';
import { useButton } from '../../use-button/useButton';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useDialogProviderContext } from '../provider/DialogProvider';
import { useEventCallback } from '../../utils/useEventCallback';

/**
 * A button that opens the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogDetachedTrigger = React.forwardRef(function DialogDetachedTrigger(
  componentProps: DialogDetachedTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled = false,
    nativeButton = true,
    target,
    payload,
    ...elementProps
  } = componentProps;

  const { getDialog } = useDialogProviderContext();

  const targetDialog = getDialog(target);

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
    const tg = getDialog(target);
    console.log('detached trigger clicked', { tg, payload });
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
});

export namespace DialogDetachedTrigger {
  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
    target: string;
    payload?: any;
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
