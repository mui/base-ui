'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { useSelector } from '../../utils/store';

/**
 * A button that opens the combobox popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxTrigger = React.forwardRef(function ComboboxTrigger(
  componentProps: ComboboxTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, nativeButton = true, ...elementProps } = componentProps;

  const { store, setOpen, triggerRef } = useComboboxRootContext();

  const open = useSelector(store, selectors.open);

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
  });

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, triggerRef, buttonRef],
    props: [
      {
        onClick(event) {
          setOpen(!open, event.nativeEvent, undefined);
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
});

export namespace ComboboxTrigger {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
