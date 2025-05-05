'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useButton } from '../../use-button/useButton';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';

/**
 * A button that opens the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogTrigger = React.forwardRef(function DialogTrigger(
  props: DialogTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, disabled = false, ...other } = props;

  const { open, setTriggerElement, getTriggerProps } = useDialogRootContext();

  const state: DialogTrigger.State = React.useMemo(
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
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return renderElement();
});

export namespace DialogTrigger {
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
