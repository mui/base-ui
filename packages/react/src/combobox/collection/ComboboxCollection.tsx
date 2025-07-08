'use client';
import * as React from 'react';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useGroupCollectionContext } from './GroupCollectionContext';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';

/**
 * Renders filtered items.
 *
 * If you only need a flat list you can omit this component – pass a function
 * child to `Combobox.List` and it will implicitly wrap it.
 */
export function ComboboxCollection<Item extends { value: unknown }>(
  props: ComboboxCollection.Props<Item>,
): React.JSX.Element | null {
  const { children } = props;

  const { store } = useComboboxRootContext();
  const filteredItems = useSelector(store, selectors.filteredItems);
  const groupContext = useGroupCollectionContext();

  // If we're inside a group, use the group's items
  const itemsToRender = groupContext ? groupContext.items : filteredItems;

  if (!itemsToRender) {
    return null;
  }

  return (
    <React.Fragment>{itemsToRender.map((item, index) => children(item, index))}</React.Fragment>
  );
}

export namespace ComboboxCollection {
  export interface Props<Item> {
    children: (item: Item, index: number) => React.ReactNode;
  }
}
