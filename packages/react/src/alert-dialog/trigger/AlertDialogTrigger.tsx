'use client';
import * as React from 'react';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { useButton } from '../../use-button/useButton';
import { useRenderElement } from '../../utils/useRenderElement';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';

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
  const { render, className, disabled = false, ...elementProps } = componentProps;

  const { open, setTriggerElement, getTriggerProps } = useAlertDialogRootContext();

  const state: AlertDialogTrigger.State = React.useMemo(
    () => ({
      disabled,
      open,
    }),
    [disabled, open],
  );

  const mergedRef = useForkRef(forwardedRef, setTriggerElement);

  const { getButtonProps } = useButton({
    disabled,
    buttonRef: mergedRef,
  });

  return useRenderElement('button', componentProps, {
    state,
    propGetter: (externalProps) => getButtonProps(getTriggerProps(externalProps)),
    ref: mergedRef,
    customStyleHookMapping: triggerOpenStateMapping,
    props: elementProps,
  });
});

export namespace AlertDialogTrigger {
  export interface Props extends BaseUIComponentProps<'button', State> {}

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
