'use client';
import * as React from 'react';
import { useComboboxDerivedItemsContext } from '../root/ComboboxRootContext';
import { useGroupCollectionContext } from './GroupCollectionContext';
import { ComboboxItemValueContext } from '../item/ComboboxItemValueContext';

/**
 * Renders filtered list items.
 * Doesn't render its own HTML element.
 *
 * If rendering a flat list, pass a function child to the `List` component instead, which implicitly wraps it.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxCollection(props: ComboboxCollection.Props): React.JSX.Element {
  const { children } = props;

  const { filteredItems, flatFilteredValues, isGrouped, itemToValue } =
    useComboboxDerivedItemsContext();
  const groupContext = useGroupCollectionContext();

  const itemsToRender = groupContext ? groupContext.items : filteredItems;

  return (
    <React.Fragment>
      {itemsToRender.map((item, index) => {
        const child = children(item, index);

        // A top-level grouped collection renders groups, not selectable leaf items.
        if (isGrouped && groupContext == null) {
          return child;
        }

        let itemValue = flatFilteredValues[index];
        if (groupContext) {
          itemValue = itemToValue ? itemToValue(item) : item;
        }

        let providerKey: React.Key | null = `index-${index}`;
        if (React.isValidElement(child)) {
          providerKey = child.key == null ? null : `key-${child.key}`;
        }

        return (
          <ComboboxItemValueContext.Provider key={providerKey} value={itemValue}>
            {child}
          </ComboboxItemValueContext.Provider>
        );
      })}
    </React.Fragment>
  );
}

export interface ComboboxCollectionState {}

export interface ComboboxCollectionProps {
  children: (item: any, index: number) => React.ReactNode;
}

export namespace ComboboxCollection {
  export type State = ComboboxCollectionState;
  export type Props = ComboboxCollectionProps;
}
