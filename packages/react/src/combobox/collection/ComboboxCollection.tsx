'use client';
import * as React from 'react';
import {
  ComboboxHasItemsContext,
  useComboboxDerivedItemsContext,
} from '../root/ComboboxRootContext';
import { isGroupedItems } from '../../internals/resolveValueLabel';
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

  const { filteredItems, itemToValue, mappedValues } = useComboboxDerivedItemsContext();
  const groupContext = useGroupCollectionContext();
  const tupleCache = React.useRef(new Map<any, { value: any; context: readonly [any] }>());

  const itemsToRender = groupContext ? groupContext.items : filteredItems;

  if (!itemsToRender) {
    return null;
  }

  // The outer pass of a grouped collection renders group records. Only the nested collections
  // render leaf items, which are the values accepted by `itemToValue`.
  if (!itemToValue || (!groupContext && isGroupedItems(itemsToRender))) {
    return <React.Fragment>{itemsToRender.map(children)}</React.Fragment>;
  }

  const renderedItems = new Set(itemsToRender);
  for (const cachedItem of tupleCache.current.keys()) {
    if (!renderedItems.has(cachedItem)) {
      tupleCache.current.delete(cachedItem);
    }
  }

  return (
    <React.Fragment>
      {itemsToRender.map((item, index) => {
        const child = children(item, index);
        const mappedValue = mappedValues?.has(item) ? mappedValues.get(item) : itemToValue(item);
        const cached = tupleCache.current.get(item);
        let contextValue = cached?.context;
        if (!cached || !Object.is(cached.value, mappedValue)) {
          contextValue = [mappedValue] as const;
          tupleCache.current.set(item, { value: mappedValue, context: contextValue });
        }
        return (
          <ComboboxHasItemsContext.Provider
            key={(child as React.ReactElement | null)?.key ?? index}
            value={contextValue!}
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
