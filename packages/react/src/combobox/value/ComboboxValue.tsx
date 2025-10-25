'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { resolveSelectedLabel } from '../../utils/resolveValueLabel';
import { selectors } from '../store';

/**
 * The current value of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxValue(props: ComboboxValue.Props): React.ReactElement {
  const { children: childrenProp } = props;

  const store = useComboboxRootContext();

  const itemToStringLabel = useStore(store, selectors.itemToStringLabel);
  const selectedValue = useStore(store, selectors.selectedValue);
  const items = useStore(store, selectors.items);

  let returnValue = null;
  if (typeof childrenProp === 'function') {
    returnValue = childrenProp(selectedValue);
  } else if (childrenProp != null) {
    returnValue = childrenProp;
  } else {
    returnValue = resolveSelectedLabel(selectedValue, items, itemToStringLabel);
  }

  return <React.Fragment>{returnValue}</React.Fragment>;
}

export interface ComboboxValueState {}

export interface ComboboxValueProps {
  children?: React.ReactNode | ((selectedValue: any) => React.ReactNode);
}

export namespace ComboboxValue {
  export type State = ComboboxValueState;
  export type Props = ComboboxValueProps;
}
