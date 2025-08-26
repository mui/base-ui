'use client';
import * as React from 'react';
import { useComboboxDerivedItemsContext } from '../root/ComboboxRootContext';
import { useGroupCollectionContext } from './GroupCollectionContext';

/**
 * Renders filtered items.
 *
 * If you only need a flat list you can omit this component – pass a function
 * child to `Combobox.List` and it will implicitly wrap it.
 */
export function ComboboxCollection(props: ComboboxCollection.Props): React.JSX.Element | null {
  const { children } = props;

  const { filteredItems } = useComboboxDerivedItemsContext();
  const groupContext = useGroupCollectionContext();

  const itemsToRender = groupContext ? groupContext.items : filteredItems;

  if (!itemsToRender) {
    return null;
  }

  return <React.Fragment>{itemsToRender.map(children)}</React.Fragment>;
}

export namespace ComboboxCollection {
  export interface Props {
    children: (item: any, index: number) => React.ReactNode;
  }
}
