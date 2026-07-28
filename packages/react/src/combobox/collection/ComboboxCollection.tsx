'use client';
import * as React from 'react';
import { isGroupedItems } from '../../internals/resolveValueLabel';
import { useComboboxDerivedItemsContext } from '../root/ComboboxRootContext';
import { useGroupCollectionContext } from './GroupCollectionContext';
import {
  COMBOBOX_ITEM_IDENTIFIER,
  ComboboxItemValueContext,
} from '../item/ComboboxItemValueContext';

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
  // Groups are containers rather than selectable leaf items, so they never supply a value to
  // what they render. Derived from the rendered items so that groups reaching the list through
  // the `filteredItems` prop are recognized too, not just those coming from `items`.
  const rendersGroups = groupContext == null && isGroupedItems(itemsToRender);

  return (
    <React.Fragment>
      {itemsToRender.map((item, index) => {
        const child = children(item, index);

        // An explicit `value` already wins over the collection value, so the provider is only
        // needed for items that omit one. Skipping it keeps lists that pass an explicit value at
        // their previous render cost.
        if (rendersGroups || hasExplicitValue(child)) {
          return child;
        }

        return (
          <ComboboxItemValueContext.Provider
            // `undefined` rather than the index when the child is an unkeyed element, so React
            // still warns about the missing key instead of the provider silently supplying one.
            key={React.isValidElement(child) ? (child.key ?? undefined) : index}
            value={item}
          >
            {child}
          </ComboboxItemValueContext.Provider>
        );
      })}
    </React.Fragment>
  );
}

function hasExplicitValue(child: React.ReactNode) {
  return (
    React.isValidElement<{ value?: unknown }>(child) &&
    child.props.value !== undefined &&
    (child.type as { [COMBOBOX_ITEM_IDENTIFIER]?: boolean | undefined })[
      COMBOBOX_ITEM_IDENTIFIER
    ] === true
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
