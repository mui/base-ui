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
import type { ItemFilter } from '../../internals/filter';
import { flattenLeafItems, type Group } from '../../internals/resolveValueLabel';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { SelectRoot } from '../../select/root/SelectRoot';
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
  const previousOpenRef = React.useRef(open);
  const removalInProgressRef = React.useRef(false);

  const normalizedItems = React.useMemo<readonly any[]>(() => {
    if (Array.isArray(items)) {
      return items;
    }
    return Object.entries(items).map(([itemValue, label]) => ({ value: itemValue, label }));
  }, [items]);
  // Memoized so the removal reconciliation below is not re-armed on every render by a fresh
  // array, which grouped items would otherwise produce.
  const flatItems = React.useMemo(() => flattenLeafItems(normalizedItems), [normalizedItems]);
  const query = inputValue.trim();

  const filterDropdownFilter = React.useMemo(() => {
    if (filter == null) {
      // Without a custom filter the popup matches each item's registered text, which already
      // resolves `ReactNode` labels through what was rendered.
      return undefined;
    }

    // A custom filter receives the entry from `items`, as documented. Keywords are matched
    // separately by the popup so a filter written against the item shape never sees a bare
    // keyword string.
    return (filterText: string, filterQuery: string, filterValue?: unknown) =>
      filter<any>(filterValue ?? filterText, filterQuery, selectProps.itemToStringLabel as any);
  }, [filter, selectProps.itemToStringLabel]);

  const filterSelectContextValue = React.useMemo(() => {
    // Resolved once for the whole collection. Letting every item scan `items` itself made
    // rendering n items cost O(n^2).
    const itemDataByValue = new Map<unknown, any>();
    for (const item of flatItems) {
      const itemValue = item?.value ?? null;
      if (!itemDataByValue.has(itemValue)) {
        itemDataByValue.set(itemValue, item);
      }
    }

    return {
      items: normalizedItems,
      isItemEqualToValue,
      getItemData(itemValue: unknown) {
        if (itemDataByValue.has(itemValue)) {
          return itemDataByValue.get(itemValue);
        }
        // A custom comparer can treat different references as equal, so fall back to a scan.
        return isItemEqualToValue === defaultItemEquality
          ? undefined
          : flatItems.find((item) => isItemEqualToValue(item?.value ?? null, itemValue as any));
      },
    };
  }, [flatItems, isItemEqualToValue, normalizedItems]);

  function handleOpenChange(nextOpen: boolean, details: FilterSelectRoot.ChangeEventDetails) {
    onOpenChange?.(nextOpen, details);
    if (details.isCanceled) {
      return;
    }

    setOpen(nextOpen);
    setInputFocusVisible(
      nextOpen &&
        (details.reason === REASONS.listNavigation ||
          (details.reason === REASONS.triggerPress &&
            (details.event as MouseEvent | undefined)?.detail === 0)),
    );
  }

  const handleInputValueChange = useStableCallback(
    (nextValue: string, details: FilterSelectRoot.InputValueChangeEventDetails) => {
      onInputValueChange?.(nextValue, details);
      if (!details.isCanceled) {
        setInputValue(nextValue);
      }
    },
  );

  function handleValueChange(nextValue: any, details: SelectRoot.ChangeEventDetails) {
    // Filtering is data-driven by this owner. Select's ordinary item-removal reconciliation must
    // not clear a selected value merely because the active query temporarily hides its item.
    if (details.reason === REASONS.none && query !== '' && !removalInProgressRef.current) {
      details.cancel();
      return;
    }
    onValueChange?.(nextValue, details);
  }

  useIsoLayoutEffect(() => {
    if (previousOpenRef.current && !open && inputValue !== '') {
      handleInputValueChange('', createChangeEventDetails(REASONS.popupClose));
    }
    previousOpenRef.current = open;
  }, [handleInputValueChange, open, inputValue]);

  return (
    <SelectRoot
      {...selectProps}
      disabled={disabled}
      isItemEqualToValue={isItemEqualToValue}
      items={items}
      highlightItemOnHover={highlightItemOnHover}
      open={open}
      onOpenChange={handleOpenChange}
      onValueChange={handleValueChange}
      virtualFocus
    >
      <FilterSelectRootContext.Provider value={filterSelectContextValue}>
        <FilterSelectProvider
          open={open}
          disabled={disabled}
          inputFocusVisible={inputFocusVisible}
          inputValue={inputValue}
          flatItems={flatItems}
          locale={locale}
          removalInProgressRef={removalInProgressRef}
          filter={filterDropdownFilter}
          onInputValueChange={handleInputValueChange}
        >
          {children}
        </FilterSelectProvider>
      </FilterSelectRootContext.Provider>
    </SelectRoot>
  );
}

interface FilterSelectProviderProps {
  open: boolean;
  disabled: boolean;
  inputFocusVisible: boolean;
  inputValue: string;
  flatItems: readonly any[];
  locale: Intl.LocalesArgument | undefined;
  filter: FilterDropdownFilter | undefined;
  removalInProgressRef: React.MutableRefObject<boolean>;
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
    const selectedValues = store.state.multiple && Array.isArray(value) ? value : [value];
    const selectedValueStillExists = selectedValues.every(
      (selectedValue) =>
        selectedValue != null &&
        props.flatItems.some((item) => isEqual(item?.value, selectedValue)),
    );

    if (value != null && !selectedValueStillExists) {
      props.removalInProgressRef.current = true;
      const nextValue = store.state.multiple
        ? (value as any[]).filter((selectedValue) =>
            props.flatItems.some((item) => isEqual(item?.value, selectedValue)),
          )
        : null;
      setValue(nextValue, createChangeEventDetails(REASONS.none));
      props.removalInProgressRef.current = false;
    }
  }, [isEqual, props.flatItems, props.removalInProgressRef, setValue, store, value]);

  return (
    <FilterDropdownRoot
      open={props.open}
      disabled={props.disabled}
      inputFocusVisible={props.inputFocusVisible}
      value={props.inputValue}
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

export interface FilterSelectItemData {
  label: React.ReactNode;
  value: any;
  keywords?: readonly string[] | undefined;
}

export type FilterSelectItems =
  | Record<string, React.ReactNode>
  | ReadonlyArray<FilterSelectItemData>
  | ReadonlyArray<Group<FilterSelectItemData>>;

export namespace FilterSelectRoot {
  export type Props<Value = any, Multiple extends boolean | undefined = false> = Omit<
    SelectRoot.Props<Value, Multiple>,
    'open' | 'defaultOpen' | 'onOpenChange' | 'onValueChange'
  > & {
    items: FilterSelectItems;
    open?: boolean | undefined;
    defaultOpen?: boolean | undefined;
    onOpenChange?:
      | ((open: boolean, eventDetails: SelectRoot.ChangeEventDetails) => void)
      | undefined;
    onValueChange?: SelectRoot.Props<Value, Multiple>['onValueChange'] | undefined;
    filter?: FilterSelectFilter | undefined;
    locale?: Intl.LocalesArgument | undefined;
    defaultInputValue?: string | undefined;
    inputValue?: string | undefined;
    onInputValueChange?:
      | ((value: string, eventDetails: FilterDropdownRootNamespace.ChangeEventDetails) => void)
      | undefined;
  };
  export type Actions = SelectRoot.Actions;
  export type State = SelectRoot.State;
  export type ChangeEventReason = SelectRoot.ChangeEventReason;
  export type ChangeEventDetails = SelectRoot.ChangeEventDetails;
  export type InputValueChangeEventReason = FilterDropdownRootNamespace.ChangeEventReason;
  export type InputValueChangeEventDetails = FilterDropdownRootNamespace.ChangeEventDetails;
}
