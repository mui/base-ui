'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  FilterDropdownRoot,
  type FilterDropdownRoot as FilterDropdownRootNamespace,
} from '../../filter-dropdown/root/FilterDropdownRoot';
import type { FilterDropdownFilter } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useFilterDropdownCloseQuery } from '../../filter-dropdown/root/useFilterDropdownCloseQuery';
import type { ItemFilter } from '../../internals/filter';
import { flattenLeafItems, stringifyAsLabel, type Group } from '../../internals/resolveValueLabel';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { SelectRootInternal, type SelectRoot } from '../../select/root/SelectRoot';
import { selectors } from '../../select/store';
import { useSelectRootContext } from '../../select/root/SelectRootContext';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { defaultItemEquality } from '../../internals/itemEquality';
import { FilterSelectRootContext } from './FilterSelectRootContext';

export function FilterSelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: FilterSelectRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const {
    children,
    items,
    filter,
    locale,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
    onValueChange,
    disabled: disabledProp = false,
    isItemEqualToValue = defaultItemEquality,
    highlightItemOnHover = true,
    ...selectProps
  } = props;

  const { disabled: fieldDisabled } = useFieldRootContext();
  const disabled = disabledProp || fieldDisabled || false;

  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'FilterSelect',
    state: 'open',
  });
  const [inputValue, setInputValue] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name: 'FilterSelect',
    state: 'inputValue',
  });
  const [inputFocusVisible, setInputFocusVisible] = React.useState(false);

  const normalizedItems = React.useMemo<readonly any[]>(() => {
    if (items === undefined) {
      return [];
    }
    if (Array.isArray(items)) {
      return items;
    }
    return Object.entries(items).map(([itemValue, label]) => ({ value: itemValue, label }));
  }, [items]);
  // Memoized so the removal reconciliation below is not re-armed on every render by a fresh
  // array, which grouped items would otherwise produce.
  const flatItems = React.useMemo(() => flattenLeafItems(normalizedItems), [normalizedItems]);
  const filterDropdownFilter = React.useMemo(() => {
    if (filter == null) {
      // Without a custom filter the popup matches each item's registered text, which already
      // resolves `ReactNode` labels through what was rendered.
      return undefined;
    }

    // `itemToStringLabel` takes a value; the filter is handed an entry.
    const itemToString = (item: any) =>
      stringifyAsLabel(item?.value ?? item, selectProps.itemToStringLabel);

    return (filterText: string, filterQuery: string, filterValue?: unknown) =>
      filter<any>(filterValue ?? filterText, filterQuery, itemToString);
  }, [filter, selectProps.itemToStringLabel]);

  const filterSelectContextValue = React.useMemo(() => {
    // Resolved once for the whole collection. Letting every item scan `items` itself made
    // rendering n items cost O(n^2).
    const itemDataByValue = new Map<unknown, any>();
    for (const item of flatItems) {
      const itemValue = item.value;
      if (!itemDataByValue.has(itemValue)) {
        itemDataByValue.set(itemValue, item);
      }
    }

    return {
      items: normalizedItems,
      isItemEqualToValue,
      getItemData(itemValue: unknown) {
        const itemData = itemDataByValue.get(itemValue);
        if (itemData !== undefined) {
          return itemData;
        }
        // A custom comparer can treat different references as equal, so fall back to a scan.
        return isItemEqualToValue === defaultItemEquality
          ? undefined
          : flatItems.find((item) => isItemEqualToValue(item.value, itemValue as any));
      },
    };
  }, [flatItems, isItemEqualToValue, normalizedItems]);

  const handleInputValueChange = useStableCallback(
    (nextValue: string, details: FilterSelectRoot.InputValueChangeEventDetails) => {
      onInputValueChange?.(nextValue, details);
      if (!details.isCanceled) {
        setInputValue(nextValue);
      }
    },
  );

  const closeQuery = useFilterDropdownCloseQuery({
    open,
    value: inputValue,
    onValueChange: handleInputValueChange,
    onOpenChangeComplete,
  });

  function handleOpenChange(nextOpen: boolean, details: FilterSelectRoot.ChangeEventDetails) {
    onOpenChange?.(nextOpen, details);
    if (details.isCanceled) {
      return;
    }

    closeQuery.handleOpenChange(nextOpen);
    setOpen(nextOpen);
    setInputFocusVisible(
      nextOpen &&
        (details.reason === REASONS.listNavigation ||
          (details.reason === REASONS.triggerPress &&
            (details.event as MouseEvent | undefined)?.detail === 0)),
    );
  }

  return (
    <SelectRootInternal
      {...selectProps}
      disabled={disabled}
      isItemEqualToValue={isItemEqualToValue}
      items={items}
      highlightItemOnHover={highlightItemOnHover}
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={closeQuery.handleOpenChangeComplete}
      onValueChange={onValueChange}
      virtualFocus
    >
      <FilterSelectRootContext.Provider value={filterSelectContextValue}>
        <FilterSelectProvider
          open={open}
          disabled={disabled}
          inputFocusVisible={inputFocusVisible}
          inputValue={inputValue}
          query={closeQuery.query}
          flatItems={flatItems}
          itemsResolved={items !== undefined}
          locale={locale}
          filter={filterDropdownFilter}
          onInputValueChange={handleInputValueChange}
        >
          {children}
        </FilterSelectProvider>
      </FilterSelectRootContext.Provider>
    </SelectRootInternal>
  );
}

interface FilterSelectProviderProps {
  open: boolean;
  disabled: boolean;
  inputFocusVisible: boolean;
  inputValue: string;
  query: string;
  flatItems: readonly any[];
  itemsResolved: boolean;
  locale: Intl.LocalesArgument | undefined;
  filter: FilterDropdownFilter | undefined;
  onInputValueChange: (
    value: string,
    details: FilterSelectRoot.InputValueChangeEventDetails,
  ) => void;
  children?: React.ReactNode;
}

function FilterSelectProvider(props: FilterSelectProviderProps) {
  const { store, listRef, setValue, virtualFocusInputRef } = useSelectRootContext();
  const activeIndex = useStore(store, selectors.activeIndex);
  const inputProps = useStore(store, selectors.inputProps);
  const selectionReferenceItemId = useStore(store, selectors.selectionReferenceItemId);
  const visibleItemIndexes = useStore(store, selectors.visibleItemIndexes);
  const value = useStore(store, selectors.value);
  const isEqual = useStore(store, selectors.isItemEqualToValue);
  const selectedIndex =
    selectionReferenceItemId == null
      ? null
      : (visibleItemIndexes.get(selectionReferenceItemId) ?? null);
  const hasQuery = props.inputValue.trim() !== '';

  const setActiveIndex = useStableCallback((index: number | null) => {
    store.set('activeIndex', index);
  });

  // Select items register after the popup opens. Seed the selected item once it becomes available,
  // and again when clearing a query reveals it, without re-latching after navigation escapes.
  useIsoLayoutEffect(() => {
    if (props.open && !hasQuery && selectedIndex != null) {
      setActiveIndex(selectedIndex);
    }
  }, [props.open, hasQuery, selectedIndex, setActiveIndex]);

  useIsoLayoutEffect(() => {
    // `undefined` is the unresolved/loading state. A resolved empty collection is meaningful and
    // clears values that can no longer be selected or submitted.
    if (!props.itemsResolved) {
      return;
    }

    if (value == null) {
      return;
    }

    const multiple = store.state.multiple;
    const selectedValues = multiple && Array.isArray(value) ? value : [value];
    const remainingValues = selectedValues.filter((selectedValue) =>
      props.flatItems.some((item) => isEqual(item.value, selectedValue)),
    );
    if (remainingValues.length !== selectedValues.length) {
      setValue(multiple ? remainingValues : null, createChangeEventDetails(REASONS.none));
    }
  }, [isEqual, props.flatItems, props.itemsResolved, setValue, store, value]);

  return (
    <FilterDropdownRoot
      open={props.open}
      disabled={props.disabled}
      inputFocusVisible={props.inputFocusVisible}
      value={props.inputValue}
      query={props.query}
      filter={props.filter}
      locale={props.locale}
      listRef={listRef}
      activeIndex={activeIndex}
      setActiveIndex={setActiveIndex}
      inputProps={inputProps}
      inputRef={virtualFocusInputRef}
      onValueChange={props.onInputValueChange}
    >
      {props.children}
    </FilterDropdownRoot>
  );
}

export type FilterSelectFilter = ItemFilter;

export interface FilterSelectItemData<Value = any> {
  label: React.ReactNode;
  value: Value;
  keywords?: readonly string[] | undefined;
}

export type FilterSelectItems<Value = any> =
  | (string extends Value ? Record<string, React.ReactNode> : never)
  | ReadonlyArray<FilterSelectItemData<Value>>
  | ReadonlyArray<Group<FilterSelectItemData<Value>>>;

export namespace FilterSelectRoot {
  export type Props<Value = any, Multiple extends boolean | undefined = false> = Omit<
    SelectRoot.Props<Value, Multiple>,
    'open' | 'defaultOpen' | 'onOpenChange' | 'onValueChange' | 'items'
  > & {
    /**
     * Data structure of the items rendered in the popup, and the source the query filters.
     * Required: filtering narrows this data before the list renders. Pass `undefined` while the
     * data is loading; an empty collection is treated as loaded and clears unavailable values.
     *
     * Render the entries with a function child of `<FilterSelect.List>`, or of
     * `<FilterSelect.Collection>` inside a group.
     */
    items: FilterSelectItems<Value> | undefined;
    /**
     * Whether the popup is currently open.
     */
    open?: boolean | undefined;
    /**
     * Whether the popup is initially open.
     *
     * To render a controlled select, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean | undefined;
    /**
     * Event handler called when the popup is opened or closed.
     */
    onOpenChange?:
      | ((open: boolean, eventDetails: FilterSelectRoot.ChangeEventDetails) => void)
      | undefined;
    /**
     * Event handler called when the selected value changes.
     */
    onValueChange?: SelectRoot.Props<Value, Multiple>['onValueChange'] | undefined;
    /**
     * Replaces the default case-insensitive substring matching.
     * Receives an entry from `items` and the trimmed query.
     */
    filter?: FilterSelectFilter | undefined;
    /**
     * Locale used when comparing an item against the query.
     * Defaults to the runtime's default locale.
     */
    locale?: Intl.LocalesArgument | undefined;
    /**
     * The uncontrolled filter query when the select is initially rendered.
     * To render a controlled query, use the `inputValue` prop instead.
     */
    defaultInputValue?: string | undefined;
    /**
     * The filter query. Use when controlled.
     * The query is cleared when the popup closes.
     */
    inputValue?: string | undefined;
    /**
     * Event handler called when the filter query changes.
     */
    onInputValueChange?:
      | ((value: string, eventDetails: FilterSelectRoot.InputValueChangeEventDetails) => void)
      | undefined;
  };
  export type Actions = SelectRoot.Actions;
  export type State = SelectRoot.State;
  export type ChangeEventReason = SelectRoot.ChangeEventReason;
  export type ChangeEventDetails = SelectRoot.ChangeEventDetails;
  export type InputValueChangeEventReason = FilterDropdownRootNamespace.ChangeEventReason;
  export type InputValueChangeEventDetails = FilterDropdownRootNamespace.ChangeEventDetails;
}
