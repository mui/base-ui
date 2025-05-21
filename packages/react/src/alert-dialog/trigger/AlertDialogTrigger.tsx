'use client';
import * as React from 'react';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { useButton } from '../../use-button/useButton';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
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
  props: AlertDialogTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, disabled = false, ...other } = props;

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

  const { renderElement } = useComponentRenderer({
    render: render ?? 'button',
    className,
    state,
    propGetter: (externalProps) => getButtonProps(getTriggerProps(externalProps)),
    extraProps: other,
    stateAttributesMapping: triggerOpenStateMapping,
    ref: mergedRef,
  });

  return renderElement();
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
