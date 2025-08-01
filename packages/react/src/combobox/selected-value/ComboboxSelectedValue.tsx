'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';

/**
 * The currently selected value of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxSelectedValue(props: ComboboxSelectedValue.Props) {
  const { children: childrenProp } = props;

  const { store } = useComboboxRootContext();
  const selectedValue = useStore(store, selectors.selectedValue);

  return typeof childrenProp === 'function' ? childrenProp(selectedValue) : childrenProp;
}

export namespace ComboboxSelectedValue {
  export interface State {}

  export interface Props {
    children?: React.ReactNode | ((selectedValue: any) => React.ReactNode);
  }
}
