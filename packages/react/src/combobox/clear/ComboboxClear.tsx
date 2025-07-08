'use client';
import * as React from 'react';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Clears the input value of the combobox when clicked.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxClear = React.forwardRef(function ComboboxClear(
  componentProps: ComboboxClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { setInputValue } = useComboboxRootContext();

  return useRenderElement('button', componentProps, {
    ref: forwardedRef,
    props: [
      {
        onClick(event) {
          setInputValue('', event.nativeEvent, 'input-clear');
        },
      },
      elementProps,
    ],
  });
});

export namespace ComboboxClear {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
