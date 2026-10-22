'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { isKeyboardOpen } from '../../utils/isKeyboardOpen';
import { getFilter } from '../../internals/filter';
import { findItemIndex } from '../../internals/itemEquality';
import {
  flattenLeafItems,
  isGroupedItems,
  stringifyAsLabel,
} from '../../internals/resolveValueLabel';
import { useSelectRootContext } from '../root/SelectRootContext';
import type { SelectRoot } from '../root/SelectRoot';
import type { SelectFilterProvider } from '../filter-provider/SelectFilterProvider';
import type { SelectFilterProviderOptions } from '../filter-provider/SelectFilterProviderOptions';
import { SelectFilterImplContext, SelectFilterNavigationContext } from './SelectFilterContext';
import { SELECT_FILTER_IMPL } from './SelectFilterImpl';
import { SelectFilteredItemsContext } from './SelectFilteredItemsContext';
import { useSelectFilterVirtualList } from './useSelectFilterVirtualList';

/** Handlers for the changes the select root commits, which the filter root forwards. */
export interface SelectFilterRootHandlers {
  onOpenChange: (open: boolean, eventDetails: SelectRoot.OpenChangeEventDetails) => void;
  onValueChange: (value: any, eventDetails: SelectRoot.ChangeEventDetails) => void;
}

export interface SelectFilterDropdownProps extends SelectFilterProviderOptions {
  handlersRef: React.RefObject<SelectFilterRootHandlers | null>;
  children?: React.ReactNode;
}

interface FilteredItems {
  filteredItems: readonly any[];
  filteredValues: any[];
}

// A list that isn't virtualized never reads the filtered values.
const NO_VALUES: any[] = [];

function filterItems(
  items: Record<string, React.ReactNode> | readonly any[] | undefined,
  query: string,
  matchItem: ((text: string, query: string) => boolean) | null,
  itemToStringLabel: ((value: any) => string) | undefined,
): FilteredItems {
  const entries: readonly any[] = Array.isArray(items)
    ? items
    : Object.entries(items ?? {}).map(([value, label]) => ({ value, label }));
  const matches = (item: any) =>
    matchItem!(
      typeof item.label === 'string' ? item.label : stringifyAsLabel(item.value, itemToStringLabel),
      query,
    );

  let filteredItems = entries;
  if (matchItem !== null) {
    filteredItems = isGroupedItems(entries)
      ? entries
          .map((group) => ({ ...group, items: group.items.filter(matches) }))
          .filter((group) => group.items.length > 0)
      : entries.filter(matches);
  }
  return {
    filteredItems,
    filteredValues: flattenLeafItems(filteredItems).map((item: any) => item.value),
  };
}

// An item press appends the pressed value or filters it out, keeping the others in order, so the
// toggled value is the appended one or the first that no longer lines up.
function getToggledValue(nextValue: readonly unknown[], previousValue: readonly unknown[]) {
  if (nextValue.length > previousValue.length) {
    return nextValue[nextValue.length - 1];
  }
  let index = 0;
  while (index < nextValue.length && Object.is(nextValue[index], previousValue[index])) {
    index += 1;
  }
  return previousValue[index];
}

/**
 * Reads the select store, which is only available below the select root, and hands the filter
 * engine the list the select navigates and the command that moves its highlight. The query is
 * owned here; the select root keeps sole ownership of the open state and the selection.
 */
export function SelectFilterDropdown(props: SelectFilterDropdownProps) {
  const {
    value: valueProp,
    defaultValue = '',
    onValueChange,
    filter,
    autoHighlight = false,
    locale,
    virtualized = false,
    handlersRef,
    children,
  } = props;

  const store = useSelectRootContext();

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const disabled = store.useState('disabled');
  const keyboardOpen = store.useState('keyboardOpen');
  const id = store.useState('id');
  const triggerElement = store.useState('triggerElement');
  const activeIndex = store.useState('activeIndex');
  const items = store.useState('items');
  const itemToStringLabel = store.useState('itemToStringLabel');

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'SelectFilterProvider',
    state: 'value',
  });

  // Navigation starts from the selected option until the query changes during this open. It
  // stays off through the exit, so closing doesn't highlight the selected option.
  const [queryChanged, setQueryChanged] = React.useState(false);
  const [previousOpen, setPreviousOpen] = React.useState(open);
  if (open !== previousOpen) {
    setPreviousOpen(open);
    if (open) {
      setQueryChanged(false);
    }
  }

  // The value a multiple select toggled while filtering, to highlight once the query clears.
  const toggledItemRef = React.useRef<{ value: unknown } | null>(null);
  const virtualPressRef = React.useRef(false);

  const handleValueChange = useStableCallback(
    (nextValue: string, eventDetails: SelectFilterProvider.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);
      if (eventDetails.isCanceled) {
        return;
      }
      setValue(nextValue);
      // A reopen during the exit settles the pending close reset, which is no query change.
      if (eventDetails.reason !== REASONS.popupClose) {
        setQueryChanged(true);
      }
    },
  );

  // Like a combobox with its input in the popup, a multiple select clears the query when an item
  // is pressed. The root hasn't committed the selection yet, so the store holds the previous one.
  const handleSelectionChange = useStableCallback(
    (nextValue: any, eventDetails: SelectRoot.ChangeEventDetails) => {
      if (
        !store.state.multiple ||
        eventDetails.reason !== REASONS.itemPress ||
        value.trim() === ''
      ) {
        return;
      }

      const previousValue = store.state.value;
      toggledItemRef.current = {
        value: getToggledValue(nextValue, Array.isArray(previousValue) ? previousValue : []),
      };
      const clearDetails = createChangeEventDetails(
        REASONS.inputClear,
        eventDetails.event,
        undefined,
        { isItemPress: true },
      );
      handleValueChange('', clearDetails);
      if (clearDetails.isCanceled) {
        toggledItemRef.current = null;
      }
    },
  );

  // The root keeps no record of how it opened, so a keyboard open is recorded here as it commits.
  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, eventDetails: SelectRoot.OpenChangeEventDetails) => {
      store.set(
        'keyboardOpen',
        nextOpen && isKeyboardOpen(eventDetails.reason, eventDetails.event),
      );
    },
  );

  useIsoLayoutEffect(() => {
    handlersRef.current = {
      onOpenChange: handleOpenChange,
      onValueChange: handleSelectionChange,
    };
  }, [handlersRef, handleOpenChange, handleSelectionChange]);

  const query = useFilterDropdownCloseQuery({
    open,
    mounted,
    value,
    onValueChange: handleValueChange,
  });

  store.useSyncedValue('navigateFromSelected', value === '' && !queryChanged);

  // Only an open change records a keyboard open, so a controlled close that bypasses it must not
  // leave the next programmatic open looking like one.
  useIsoLayoutEffect(() => {
    if (!open) {
      store.set('keyboardOpen', false);
    }
  }, [open, store]);

  const defaultMatchItem = React.useMemo(() => getFilter({ locale }).contains, [locale]);

  // Only a virtualized list and `Select.useFilteredItems()` read the filtered `items`, so they are
  // filtered on demand.
  const getFilteredItems = React.useMemo(() => {
    const filterQuery = query.trim();
    const matchItem = filterQuery === '' || filter === null ? null : (filter ?? defaultMatchItem);
    let result: FilteredItems | undefined;
    return () => {
      if (result === undefined) {
        result = filterItems(items, filterQuery, matchItem, itemToStringLabel);
      }
      return result;
    };
  }, [items, query, filter, defaultMatchItem, itemToStringLabel]);

  if (process.env.NODE_ENV !== 'production' && virtualized && items === undefined) {
    warn(
      'A virtualized <Select.FilterProvider> found no `items` on <Select.Root>, so it has nothing ' +
        'to filter or navigate. Pass the full list as `items` and render the matches from ' +
        'Select.useFilteredItems().',
    );
  }

  const getActiveIndex = useStableCallback(() => store.state.activeIndex);
  const setActiveIndex = useStableCallback((index: number | null) => {
    store.set('activeIndex', index);
  });

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
    store.set('highlightedItem', item ?? undefined);
  });

  useIsoLayoutEffect(syncActiveItem, [activeIndex, syncActiveItem]);

  // An item a multiple select toggled while filtering stays highlighted once the query clears.
  useIsoLayoutEffect(() => {
    const toggled = toggledItemRef.current;
    toggledItemRef.current = null;
    if (toggled === null || query !== '') {
      return;
    }
    // The options that the clear mounts publish their indexes in follow-up commits, each of
    // which resets the positional highlight, so restore it once React's cascade has finished.
    queueMicrotask(() => {
      if (!store.state.open) {
        return;
      }
      const index = findItemIndex(
        store.context.valuesRef.current,
        toggled.value,
        store.state.isItemEqualToValue,
      );
      if (index !== -1) {
        store.set('activeIndex', index);
      }
    });
  }, [query, store]);

  const { virtualizedCount, getVirtualIndex, registerVirtualItem, syncVirtualList } =
    useSelectFilterVirtualList(
      virtualized,
      virtualized ? getFilteredItems().filteredValues : NO_VALUES,
      open && (autoHighlight === 'always' || (autoHighlight && query.trim() !== '')),
      syncActiveItem,
    );

  // Read by every option, so it holds nothing that changes with the highlight.
  const navigationContext: SelectFilterNavigationContext = React.useMemo(
    () => ({
      syncActiveItem,
      virtualizedCount,
      getVirtualIndex,
      registerVirtualItem,
      syncVirtualList,
      virtualPressRef,
    }),
    [syncActiveItem, virtualizedCount, getVirtualIndex, registerVirtualItem, syncVirtualList],
  );

  // Trust the rendered element's id once it exists: an explicitly empty id must not fall back to a
  // registered id that no element carries.
  const triggerId = triggerElement ? triggerElement.id || null : id;

  return (
    <SelectFilterImplContext.Provider value={SELECT_FILTER_IMPL}>
      <SelectFilterNavigationContext.Provider value={navigationContext}>
        <SelectFilteredItemsContext.Provider value={getFilteredItems}>
          <FilterDropdownRoot
            open={open}
            openedByKeyboard={keyboardOpen}
            disabled={disabled}
            value={value}
            query={query}
            onValueChange={handleValueChange}
            // The rendered options of a virtualized list are already filtered.
            filter={virtualized ? null : filter}
            autoHighlight={autoHighlight}
            locale={locale}
            triggerId={triggerId}
            listRef={store.context.listRef}
            getActiveIndex={getActiveIndex}
            setActiveIndex={setActiveIndex}
            itemCount={virtualizedCount}
          >
            {children}
          </FilterDropdownRoot>
        </SelectFilteredItemsContext.Provider>
      </SelectFilterNavigationContext.Provider>
    </SelectFilterImplContext.Provider>
  );
}
