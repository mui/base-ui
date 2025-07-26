'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useButton } from '../../use-button/useButton';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { TypedDialogHandle } from '../factory/createDialog';
import { useDialogProviderContext } from '../provider/DialogProvider';
import { NOOP } from '../../utils/noop';

/**
 * A button that opens the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogTrigger = React.forwardRef(function DialogTrigger<Payload>(
  componentProps: DialogTrigger.Props<Payload>,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled = false,
    nativeButton = true,
    dialog,
    payload,
    ...elementProps
  } = componentProps;

  const isStandalone = dialog !== undefined;

  const rootContext = useDialogRootContext(true);
  const providerContext = useDialogProviderContext(true);

  if (process.env.NODE_ENV === 'development') {
    if (isStandalone && !providerContext) {
      throw new Error(
        'Base UI: DialogTrigger with the `dialog` prop requires a DialogProvider context',
      );
    } else if (!isStandalone && !rootContext) {
      throw new Error(
        'Base UI: DialogTrigger without the `dialog` prop must be used within a Dialog.Root',
      );
    }
  }

  let setTriggerElement: React.Dispatch<React.SetStateAction<Element | null>>;
  let open: boolean;
  let triggerProps: React.ButtonHTMLAttributes<HTMLButtonElement>;

  if (isStandalone) {
    const { getDialog } = providerContext!;
    const targetDialog = getDialog(dialog.id);

    setTriggerElement = NOOP;
    open = targetDialog?.isOpen ?? false;
    triggerProps = {
      onClick: () => {
        const target = getDialog(dialog.id);
        target?.open(payload); // TODO: pass in the event
      },
      'aria-haspopup': 'dialog',
      'aria-expanded': open,
    };
  } else {
    setTriggerElement = rootContext!.setTriggerElement;
    open = rootContext!.open;
    triggerProps = rootContext!.triggerProps;
  }

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
    props: [triggerProps, elementProps, getButtonProps],
    customStyleHookMapping: triggerOpenStateMapping,
  });
}) as DialogTrigger.ComponentType;

export namespace DialogTrigger {
  export interface Props<Payload = any> extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
    dialog?: TypedDialogHandle<Payload>;
    payload?: Payload;
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

  export interface ComponentType {
    <Payload>(componentProps: DialogTrigger.Props<Payload>): React.JSX.Element;
  }
}
