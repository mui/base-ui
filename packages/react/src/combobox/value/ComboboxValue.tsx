'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useSelector } from '../../utils/store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';

/**
 * The current value of the combobox.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxValue = React.forwardRef(function ComboboxValue(
  componentProps: ComboboxValue.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, children: childrenProp, ...elementProps } = componentProps;

  const { store } = useComboboxRootContext();
  const value = useSelector(store, selectors.value);

  const children = typeof childrenProp === 'function' ? childrenProp(value) : childrenProp;

  const element = useRenderElement('span', componentProps, {
    ref: forwardedRef,
    props: [{ children }, elementProps],
  });

  return element;
});

export namespace ComboboxValue {
  export interface State {}

  export interface Props extends Omit<BaseUIComponentProps<'span', State>, 'children'> {
    children?: React.ReactNode | ((value: any) => React.ReactNode);
  }
}
