'use client';
import * as React from 'react';
import { useComboboxDerivedItemsContext } from '../root/ComboboxRootContext';
import { COMBOBOX_CREATE_ITEM } from '../root/utils/createItem';
import { useGroupCollectionContext } from './GroupCollectionContext';

const CREATE_META: ComboboxCollection.ItemMeta = { create: true };
const ITEM_META: ComboboxCollection.ItemMeta = { create: false };

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

  const { filteredItems, shouldShowCreate } = useComboboxDerivedItemsContext();
  const groupContext = useGroupCollectionContext();

  const itemsToRender = groupContext ? groupContext.items : filteredItems;

  if (!itemsToRender) {
    return null;
  }

  // Appended last so its index lines up with the create value in the root's navigable list.
  const showCreate = shouldShowCreate && !groupContext;

  return (
    <React.Fragment>
      {itemsToRender.map((item, index) => children(item, index, ITEM_META))}
      {showCreate && children(COMBOBOX_CREATE_ITEM, itemsToRender.length, CREATE_META)}
    </React.Fragment>
  );
}

export interface ComboboxCollectionState {}

export interface ComboboxCollectionItemMeta {
  /**
   * Whether this entry is the synthetic "create" entry injected by the `creatable` prop on
   * `Combobox.Root`. Render it with `Combobox.CreateItem` instead of `Combobox.Item`.
   */
  create: boolean;
}

export interface ComboboxCollectionProps {
  children: (item: any, index: number, meta: ComboboxCollectionItemMeta) => React.ReactNode;
}

export namespace ComboboxCollection {
  export type State = ComboboxCollectionState;
  export type Props = ComboboxCollectionProps;
  export type ItemMeta = ComboboxCollectionItemMeta;
}
