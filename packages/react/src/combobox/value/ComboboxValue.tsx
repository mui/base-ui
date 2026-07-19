'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import {
  resolveComboboxMultipleLabels,
  resolveComboboxSelectedLabel,
} from '../utils/resolveValueLabel';

/**
 * The current value of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxValue(props: ComboboxValue.Props): React.ReactElement {
  const { children: childrenProp, placeholder } = props;

  const store = useComboboxRootContext();

  const itemToStringLabel = useStore(store, selectors.itemToStringLabel);
  const selectedValue = useStore(store, selectors.selectedValue);
  const items = useStore(store, selectors.items);
  const itemValues = useStore(store, selectors.itemValues);
  const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);
  const multiple = useStore(store, selectors.selectionMode) === 'multiple';
  const hasSelectedValue = useStore(store, selectors.hasSelectedValue);

  const shouldCheckNullItemLabel =
    !multiple && !hasSelectedValue && placeholder != null && childrenProp == null;
  const hasNullLabel = useStore(store, selectors.hasNullItemLabel, shouldCheckNullItemLabel);

  let children = null;
  if (typeof childrenProp === 'function') {
    children = childrenProp(selectedValue);
  } else if (childrenProp != null) {
    children = childrenProp;
  } else if (!hasSelectedValue && placeholder != null && !hasNullLabel) {
    children = placeholder;
  } else if (multiple && Array.isArray(selectedValue)) {
    children = resolveComboboxMultipleLabels(
      selectedValue,
      items,
      itemToStringLabel,
      itemValues,
      isItemEqualToValue,
      store.state.labelCacheRef.current,
    );
  } else {
    children = resolveComboboxSelectedLabel(
      selectedValue,
      items,
      itemToStringLabel,
      itemValues,
      isItemEqualToValue,
      store.state.labelCacheRef.current,
    );
  }

  return <React.Fragment>{children}</React.Fragment>;
}

export interface ComboboxValueState {}

export interface ComboboxValueProps {
  children?: React.ReactNode | ((selectedValue: any) => React.ReactNode);
  /**
   * The placeholder value to display when no value is selected.
   * This is overridden by `children` if specified, or by a null item's label in `items`.
   */
  placeholder?: React.ReactNode;
}

export namespace ComboboxValue {
  export type State = ComboboxValueState;
  export type Props = ComboboxValueProps;
}
