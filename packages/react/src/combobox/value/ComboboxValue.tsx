'use client';
import * as React from 'react';
import { useSelector } from '../../utils/store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';

/**
 * The current value of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxValue(componentProps: ComboboxValue.Props) {
  const { children: childrenProp } = componentProps;

  const { store } = useComboboxRootContext();
  const value = useSelector(store, selectors.value);

  const children = typeof childrenProp === 'function' ? childrenProp(value) : childrenProp;

  return children;
}

export namespace ComboboxValue {
  export interface State {}

  export interface Props {
    children?: React.ReactNode | ((value: any) => React.ReactNode);
  }
}
