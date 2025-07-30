'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useButton } from '../../use-button/useButton';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { CLICK_TRIGGER_IDENTIFIER } from '../../utils/constants';

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
    ...elementProps
  } = componentProps;

  const { open, setTriggerElement, triggerProps } = useDialogRootContext();

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

  return useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef, setTriggerElement],
    props: [
      triggerProps,
      { [CLICK_TRIGGER_IDENTIFIER as string]: '' },
      elementProps,
      getButtonProps,
    ],
    customStyleHookMapping: triggerOpenStateMapping,
  });
});

export namespace DialogTrigger {
  export interface Props extends NativeButtonProps, BaseUIComponentProps<'button', State> {}

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
