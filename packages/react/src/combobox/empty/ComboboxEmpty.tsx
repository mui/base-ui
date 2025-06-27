'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxRootContext } from '../root/ComboboxRootContext';

/**
 * Renders its children only when the combobox list is empty with
 * screen reader support.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxEmpty = React.forwardRef(function ComboboxEmpty(
  componentProps: ComboboxEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children: childrenProp, ...elementProps } = componentProps;

  const { filteredItems } = useComboboxRootContext();

  const children = filteredItems?.length === 0 ? childrenProp : null;

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        children,
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': true,
      },
      elementProps,
    ],
  });
});

export namespace ComboboxEmpty {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
