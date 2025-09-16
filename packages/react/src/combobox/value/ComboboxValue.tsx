'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { isGroupedItems, stringifyItem } from '../root/utils';
import { selectors } from '../store';

/**
 * The current value of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxValue(props: ComboboxValue.Props) {
  const { children: childrenProp } = props;

  const store = useComboboxRootContext();

  const itemToStringLabel = useStore(store, selectors.itemToStringLabel);
  const selectedValue = useStore(store, selectors.selectedValue);
  const items = useStore(store, selectors.items);

  const isChildrenPropDefined = childrenProp !== undefined;

  const memoizedItemDerivatives = React.useMemo(() => {
    if (isChildrenPropDefined || !Array.isArray(items)) {
      return {
        flatItems: undefined,
        valueToLabel: undefined,
        nullItemLabel: undefined,
      };
    }

    const flatItems = isGroupedItems(items) ? items.flatMap((g) => g.items) : items;

    let valueToLabel: Map<any, React.ReactNode> | undefined;
    let nullItemLabel: React.ReactNode | undefined;

    for (let i = 0; i < flatItems.length; i += 1) {
      const item = flatItems[i];

      if (item == null) {
        if (nullItemLabel === undefined) {
          nullItemLabel = stringifyItem(item, itemToStringLabel);
        }
        continue;
      }

      if (typeof item === 'object') {
        const hasValueKey = 'value' in item;
        const hasLabelKey = 'label' in item;

        if (hasValueKey) {
          if (item.value == null && nullItemLabel === undefined) {
            nullItemLabel = hasLabelKey ? item.label : stringifyItem(item, itemToStringLabel);
          }

          if (hasLabelKey) {
            valueToLabel ??= new Map();
            if (!valueToLabel.has(item.value)) {
              valueToLabel.set(item.value, item.label);
            }
          }
        }
      }
    }

    return {
      flatItems,
      valueToLabel,
      nullItemLabel,
    };
  }, [items, itemToStringLabel, isChildrenPropDefined]);

  if (typeof childrenProp === 'function') {
    return childrenProp(selectedValue);
  }

  if (childrenProp != null) {
    return childrenProp;
  }

  if (
    selectedValue &&
    typeof selectedValue === 'object' &&
    'label' in selectedValue &&
    selectedValue.label != null
  ) {
    return selectedValue.label;
  }

  if (Array.isArray(items)) {
    if (selectedValue == null && memoizedItemDerivatives.nullItemLabel !== undefined) {
      return memoizedItemDerivatives.nullItemLabel;
    }

    // When a value is selected and items are value/label pairs, render label.
    // e.g. items: [{ value: 'uk', label: 'United Kingdom' }], selectedValue: 'uk' → 'United Kingdom'
    if (selectedValue != null && memoizedItemDerivatives.valueToLabel?.has(selectedValue)) {
      return memoizedItemDerivatives.valueToLabel.get(selectedValue);
    }
  }

  return stringifyItem(selectedValue, itemToStringLabel);
}

export namespace ComboboxValue {
  export interface State {}

  export interface Props {
    children?: React.ReactNode | ((selectedValue: any) => React.ReactNode);
  }
}
