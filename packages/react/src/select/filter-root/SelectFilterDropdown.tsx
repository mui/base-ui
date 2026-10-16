'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import type { FilterDropdownFilter } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useSelectRootContext } from '../root/SelectRootContext';
import type { HTMLProps } from '../../internals/types';
import type { SelectFilterProvider } from '../filter-provider/SelectFilterProvider';
import type { ToggledItem } from './SelectFilterRoot';
import { SelectFilterImplContext, SelectFilterNavigationContext } from './SelectFilterContext';
import { SELECT_FILTER_IMPL } from './SelectFilterImpl';
import { SelectFilteredItemsContext } from './SelectFilteredItemsContext';
import { getFilter } from '../../internals/filter';
import { isGroupedItems, stringifyAsLabel } from '../../internals/resolveValueLabel';
import { findItemIndex, findSelectionIndex } from '../../internals/itemEquality';

export interface SelectFilterDropdownProps {
  openedByKeyboard: boolean;
  value: string;
  filter: FilterDropdownFilter | null | undefined;
  autoHighlight: boolean | 'always';
  locale: Intl.LocalesArgument | undefined;
  virtualized: boolean;
  toggledItemRef: React.RefObject<ToggledItem | null>;
  navigationProps: HTMLProps;
  onValueChange: (value: string, details: SelectFilterProvider.ChangeEventDetails) => void;
  children?: React.ReactNode;
}

/**
 * Reads the select store, which is only available below the root, and hands the filter
 * engine the list the select navigates plus the props for the input that holds real focus.
 */
export function SelectFilterDropdown(props: SelectFilterDropdownProps) {
  const { navigationProps, virtualized, toggledItemRef, ...dropdownProps } = props;
  const { filter, locale } = dropdownProps;

  const store = useSelectRootContext();
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const disabled = store.useState('disabled');
  const id = store.useState('id');
  const triggerElement = store.useState('triggerElement');
  const activeIndex = store.useState('activeIndex');
  const items = store.useState('items');
  const itemToStringLabel = store.useState('itemToStringLabel');
  const value = store.useState('value');
  const multiple = store.useState('multiple');
  const isItemEqualToValue = store.useState('isItemEqualToValue');

  const query = useFilterDropdownCloseQuery({
    open,
    mounted,
    value: props.value,
    onValueChange: props.onValueChange,
  });

  const defaultMatchItem = React.useMemo(() => getFilter({ locale }).contains, [locale]);

  const { filteredItems, filteredValues } = React.useMemo(() => {
    const filterQuery = query.trim();
    const matchItem = filterQuery === '' || filter === null ? null : (filter ?? defaultMatchItem);
    const entries: readonly any[] = Array.isArray(items)
      ? items
      : Object.entries(items ?? {}).map(([itemValue, label]) => ({ value: itemValue, label }));

    const matches = (item: any) =>
      matchItem === null ||
      matchItem(
        typeof item.label === 'string'
          ? item.label
          : stringifyAsLabel(item.value, itemToStringLabel),
        filterQuery,
      );

    const nextItems = isGroupedItems(entries)
      ? entries
          .map((group) => ({ ...group, items: group.items.filter(matches) }))
          .filter((group) => group.items.length > 0)
      : entries.filter(matches);
    const flatItems = isGroupedItems(nextItems)
      ? nextItems.flatMap((group) => group.items)
      : nextItems;

    return {
      filteredItems: nextItems,
      filteredValues: flatItems.map((item: any) => item.value),
    };
  }, [items, query, filter, defaultMatchItem, itemToStringLabel]);

  const getActiveIndex = useStableCallback(() => store.state.activeIndex);
  const setActiveIndex = useStableCallback((index: number | null) => {
    store.set('activeIndex', index);
  });

  const [activeItemId, setActiveItemId] = React.useState<string | undefined>(undefined);

  // Runs when `activeIndex` commits and again when the option registry settles, since an index
  // can come to point at a different element while its value stays the same.
  const syncActiveItem = useStableCallback(() => {
    const index = store.state.activeIndex;
    const item = index === null ? undefined : store.context.listRef.current[index];
    // An option removed in this commit stays registered until the list flushes, which calls back
    // here with the settled registry.
    if (item?.isConnected === false) {
      return;
    }
    setActiveItemId(item?.id || undefined);
  });

  useIsoLayoutEffect(syncActiveItem, [activeIndex, syncActiveItem]);

  // An item a multiple select toggled while filtering stays highlighted once the query clears.
  // The full list returning resets positional highlights, so this runs after each list change.
  const restoreToggledItem = useStableCallback(() => {
    const toggled = toggledItemRef.current;
    if (toggled === null) {
      return;
    }
    if (query !== '' || !open) {
      toggledItemRef.current = null;
      return;
    }
    const index = virtualized
      ? findItemIndex(filteredValues, toggled.value, isItemEqualToValue)
      : store.context.listRef.current.indexOf(toggled.element as HTMLElement);
    if (index !== -1) {
      store.set('activeIndex', index);
    }
  });

  useIsoLayoutEffect(restoreToggledItem, [query, filteredValues, restoreToggledItem]);

  // A virtualized list mounts only some options. Its navigable list holds a position for every
  // filtered item and the mounted options at their indexes. The positioner's item list resets
  // that array as the popup mounts, so it is rewritten from this registry.
  const virtualItemsRef = React.useRef(new Map<number, HTMLElement | null>());
  const virtualPressRef = React.useRef(false);

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
      }
    };
  });

  // The values and the selected position come from the filtered `items` too.
  useIsoLayoutEffect(() => {
    if (!virtualized) {
      return;
    }
    store.context.valuesRef.current = filteredValues;
    syncVirtualList();
    if (!store.state.open) {
      store.set(
        'selectedIndex',
        findSelectionIndex(filteredValues, value, isItemEqualToValue, multiple),
      );
    }
  }, [virtualized, filteredValues, value, isItemEqualToValue, multiple, store, syncVirtualList]);

  const virtualizedCount = virtualized ? filteredValues.length : null;
  const navigationContext: SelectFilterNavigationContext = React.useMemo(
    () => ({
      navigationProps,
      activeItemId,
      syncActiveItem,
      virtualizedCount,
      registerVirtualItem,
      syncVirtualList,
      virtualPressRef,
      restoreToggledItem,
    }),
    [
      navigationProps,
      activeItemId,
      syncActiveItem,
      virtualizedCount,
      registerVirtualItem,
      syncVirtualList,
      restoreToggledItem,
    ],
  );

  return (
    <SelectFilterImplContext.Provider value={SELECT_FILTER_IMPL}>
      <SelectFilterNavigationContext.Provider value={navigationContext}>
        <SelectFilteredItemsContext.Provider value={filteredItems}>
          <FilterDropdownRoot
            {...dropdownProps}
            // The rendered options of a virtualized list are already filtered.
            filter={virtualized ? null : filter}
            open={open}
            disabled={disabled}
            query={query}
            // Trust the rendered element's id once it exists: an explicitly empty id must not
            // fall back to a registered id that no element carries.
            triggerId={triggerElement ? triggerElement.id || null : id}
            listRef={store.context.listRef}
            getActiveIndex={getActiveIndex}
            setActiveIndex={setActiveIndex}
            focusOwnerRef={store.context.virtualFocusRef}
            itemCount={virtualizedCount}
          />
        </SelectFilteredItemsContext.Provider>
      </SelectFilterNavigationContext.Provider>
    </SelectFilterImplContext.Provider>
  );
}
