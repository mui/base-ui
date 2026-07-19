'use client';
import * as React from 'react';
import {
  ComboboxHasItemsContext,
  useComboboxDerivedItemsContext,
} from '../root/ComboboxRootContext';
import { useGroupCollectionContext } from './GroupCollectionContext';

/**
 * Renders filtered list items.
 * Doesn't render its own HTML element.
 *
 * If rendering a flat list, pass a function child to the `List` component instead, which implicitly wraps it.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxCollection(props: ComboboxCollection.Props): React.JSX.Element | null {
  const { children } = props;

  const { filteredItems, itemToValue } = useComboboxDerivedItemsContext();
  const groupContext = useGroupCollectionContext();

  const itemsToRender = groupContext ? groupContext.items : filteredItems;

  if (!itemsToRender) {
    return null;
  }

  if (!itemToValue) {
    return <React.Fragment>{itemsToRender.map(children)}</React.Fragment>;
  }

  return (
    <React.Fragment>
      {itemsToRender.map((item, index) => {
        const child = children(item, index);
        // A distinct context value intentionally associates each rendered child with its item.
        // eslint-disable-next-line react/jsx-no-constructed-context-values
        const contextValue = [itemToValue(item)] as const;
        return (
          <ComboboxHasItemsContext.Provider
            key={(child as React.ReactElement | null)?.key ?? index}
            value={contextValue}
          >
            {child}
          </ComboboxHasItemsContext.Provider>
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
