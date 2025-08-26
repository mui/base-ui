'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { stringifyItem } from '../root/utils';
import { selectors } from '../store';

/**
 * The current value of the combobox.
 * Doesn't render its own HTML element.
 */
export function ComboboxValue(props: ComboboxValue.Props) {
  const { children: childrenProp } = props;

  const { store, itemToString } = useComboboxRootContext();

  const selectedValue = useStore(store, selectors.selectedValue);
  const items = useStore(store, selectors.items);
  const isChildrenPropDefined = childrenProp !== undefined;

  const memoizedItemDerivatives = React.useMemo(() => {
    if (isChildrenPropDefined || !Array.isArray(items)) {
      return {
        flatItems: undefined,
        hasPairs: false,
        valueToLabel: undefined,
        nullItemLabel: undefined,
      };
    }

    const flatItems =
      items.length > 0 && typeof items[0] === 'object' && items[0] && 'items' in items[0]
        ? (items as Array<{ items: any[] }>).flatMap((group) => group.items)
        : items;

    let hasPairs = false;
    let valueToLabel: Map<any, React.ReactNode> | undefined;
    let nullItemLabel: React.ReactNode | undefined;

    for (let i = 0; i < flatItems.length; i += 1) {
      const item = flatItems[i];

      if (item == null) {
        if (nullItemLabel === undefined) {
          nullItemLabel = stringifyItem(item, itemToString);
        }
        continue;
      }

      if (typeof item === 'object') {
        const hasValueKey = 'value' in item;
        const hasLabelKey = 'label' in item;

        if (hasValueKey) {
          if (item.value == null && nullItemLabel === undefined) {
            nullItemLabel = hasLabelKey ? item.label : stringifyItem(item, itemToString);
          }

          if (hasLabelKey) {
            hasPairs = true;
            if (!valueToLabel) {
              valueToLabel = new Map();
            }
            if (!valueToLabel.has(item.value)) {
              valueToLabel.set(item.value, item.label);
            }
          }
        }
      }
    }

    return {
      flatItems,
      hasPairs,
      valueToLabel,
      nullItemLabel,
    };
  }, [items, itemToString, isChildrenPropDefined]);

  if (typeof childrenProp === 'function') {
    return childrenProp(selectedValue);
  }

  if (childrenProp != null) {
    return childrenProp;
  }

  if (selectedValue && typeof selectedValue === 'object' && 'label' in selectedValue) {
    return selectedValue.label;
  }

  if (Array.isArray(items)) {
    if (selectedValue == null && memoizedItemDerivatives.nullItemLabel !== undefined) {
      return memoizedItemDerivatives.nullItemLabel;
    }

    // When a value is selected and items are value/label pairs, render label.
    // e.g. items: [{ value: 'uk', label: 'United Kingdom' }], selectedValue: 'uk' → 'United Kingdom'
    if (
      selectedValue != null &&
      memoizedItemDerivatives.hasPairs &&
      memoizedItemDerivatives.valueToLabel?.has(selectedValue)
    ) {
      return memoizedItemDerivatives.valueToLabel.get(selectedValue);
    }
  }

  return stringifyItem(selectedValue, itemToString);
}

export namespace ComboboxValue {
  export interface State {}

  export interface Props {
    children?: React.ReactNode | ((selectedValue: any) => React.ReactNode);
  }
}
