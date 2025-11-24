'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { resolveMultipleLabels, resolveSelectedLabel } from '../../utils/resolveValueLabel';
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
  const multiple = useStore(store, selectors.selectionMode) === 'multiple';

  let returnValue = null;
  if (typeof childrenProp === 'function') {
    returnValue = childrenProp(selectedValue);
  } else if (childrenProp != null) {
    returnValue = childrenProp;
  } else if (multiple && Array.isArray(selectedValue)) {
    returnValue = resolveMultipleLabels(selectedValue, items, itemToStringLabel);
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
