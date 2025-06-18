'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxChipContext } from '../chip/ComboboxChipContext';
import { useButton } from '../../use-button';

/**
 * A button to remove a combobox chip.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxChipRemove = React.forwardRef(function ComboboxChipRemove(
  componentProps: ComboboxChipRemove.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, nativeButton = true, ...elementProps } = componentProps;

  const { value, setValue, inputRef } = useComboboxRootContext();
  const { index } = useComboboxChipContext();

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
  });

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef],
    props: [
      {
        tabIndex: -1,
        onClick(event) {
          event.stopPropagation();
          setValue(
            value.filter((_: any, i: number) => i !== index),
            event.nativeEvent,
            undefined,
          );
          inputRef.current?.focus();
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  return element;
});

export namespace ComboboxChipRemove {
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
