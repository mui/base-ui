'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import {
  compareItemEquality,
  findItemIndex,
  findSelectionIndex,
} from '../../internals/itemEquality';
import { useSelectRootContext } from '../root/SelectRootContext';

/**
 * The navigable list of a virtualized filterable select. Only some options are mounted, so the
 * list holds a position for every filtered item and the mounted options at their indexes. The
 * positioner's item list resets that array as the popup mounts, so it is rewritten from a registry
 * of the mounted options.
 */
export function useSelectFilterVirtualList(
  virtualized: boolean,
  filteredValues: any[],
  autoHighlightEnabled: boolean,
  syncActiveItem: () => void,
) {
  const store = useSelectRootContext();
  const value = store.useState('selectedValue');
  const multiple = store.useState('multiple');
  const isItemEqualToValue = store.useState('isItemEqualToValue');

  const virtualItemsRef = useRefWithInit(() => new Map<number, HTMLElement | null>());

  const syncVirtualList = useStableCallback(() => {
    const list = store.context.listRef.current;
    list.length = 0;
    list.length = filteredValues.length;
    virtualItemsRef.current.forEach((element, index) => {
      list[index] = element;
    });
  });

  const registerVirtualItem = useStableCallback((index: number, element: HTMLElement | null) => {
    const virtualItems = virtualItemsRef.current;
    virtualItems.set(index, element);
    syncVirtualList();
    syncActiveItem();
    return () => {
      if (virtualItems.get(index) === element) {
        virtualItems.delete(index);
        syncVirtualList();
        // The input must not point at an option that left the DOM.
        syncActiveItem();
      }
    };
  });

  const previousValuesRef = React.useRef(filteredValues);

  // The values, the highlight, and the selected position follow the filtered `items`, which can
  // change without any option mounting or unmounting.
  useIsoLayoutEffect(() => {
    if (!virtualized) {
      return;
    }
    const previousValues = previousValuesRef.current;
    previousValuesRef.current = filteredValues;
    store.context.valuesRef.current = filteredValues;
    syncVirtualList();

    // A positional highlight must not silently move to the item that takes its index.
    const activeIndex = store.state.activeIndex;
    if (
      activeIndex !== null &&
      !compareItemEquality(
        previousValues[activeIndex],
        filteredValues[activeIndex],
        isItemEqualToValue,
      )
    ) {
      store.set('activeIndex', autoHighlightEnabled && filteredValues.length > 0 ? 0 : null);
    }
    store.context.syncHighlight();

    // Reopening during the exit clears the query while open, which moves the selected item too.
    store.set(
      'selectedIndex',
      findSelectionIndex(filteredValues, value, isItemEqualToValue, multiple),
    );
  }, [
    virtualized,
    filteredValues,
    autoHighlightEnabled,
    value,
    isItemEqualToValue,
    multiple,
    store,
    syncVirtualList,
  ]);

  // Mounted options find their position among the filtered items by value.
  const getVirtualIndex = React.useMemo(() => {
    let indexes: Map<unknown, number> | undefined;
    return (itemValue: unknown) => {
      if (indexes === undefined) {
        indexes = new Map();
        for (let index = filteredValues.length - 1; index >= 0; index -= 1) {
          indexes.set(filteredValues[index], index);
        }
      }
      return (
        indexes.get(itemValue) ??
        findItemIndex(filteredValues, itemValue, store.state.isItemEqualToValue)
      );
    };
  }, [filteredValues, store]);

  return {
    virtualizedCount: virtualized ? filteredValues.length : null,
    getVirtualIndex,
    registerVirtualItem,
    syncVirtualList,
  };
}
