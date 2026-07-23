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

  const { filteredItems } = useComboboxDerivedItemsContext();
  const groupContext = useGroupCollectionContext();

  const itemsToRender = groupContext ? groupContext.items : filteredItems;

  return (
    <React.Fragment>
      {itemsToRender.map((item, index) => {
        const child = children(item, index);
        return (
          <ComboboxItemValueContext.Provider
            key={React.isValidElement(child) ? (child.key ?? index) : index}
            value={item}
          >
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
