'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { isGroupedItems, stringifyItem } from '../root/utils';
import { resolveSelectedLabel } from '../../utils/resolveValueLabel';
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

  const nullItemLabel = React.useMemo(() => {
    if (isChildrenPropDefined || !Array.isArray(items)) {
      return undefined;
    }

    const flatItems = isGroupedItems(items) ? items.flatMap((g) => g.items) : items;

    for (let i = 0; i < flatItems.length; i += 1) {
      const item = flatItems[i];
      if (item == null) {
        return stringifyItem(item, itemToStringLabel);
      }
      if (typeof item === 'object' && 'value' in item && item.value == null) {
        return 'label' in item && item.label != null
          ? item.label
          : stringifyItem(item, itemToStringLabel);
      }
    }

    return undefined;
  }, [items, itemToStringLabel, isChildrenPropDefined]);

  if (typeof childrenProp === 'function') {
    return childrenProp(selectedValue);
  }

  if (childrenProp != null) {
    return childrenProp;
  }

  if (Array.isArray(items) && selectedValue == null && nullItemLabel !== undefined) {
    return nullItemLabel;
  }

  return (
    resolveSelectedLabel(selectedValue, items, itemToStringLabel) ??
    stringifyItem(selectedValue, itemToStringLabel)
  );
}

export namespace ComboboxValue {
  export interface State {}

  export interface Props {
    children?: React.ReactNode | ((selectedValue: any) => React.ReactNode);
  }
}
