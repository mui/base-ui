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
import { getContainsFilter, type ItemFilter } from '../../internals/filter';
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
  const flatItems = flattenLeafItems(normalizedItems);
  const query = inputValue.trim();

  const matches = React.useMemo(() => filter ?? getContainsFilter({ locale }), [filter, locale]);
  const filterDropdownFilter = React.useMemo(() => {
    const defaultFilter = getContainsFilter({ locale });
    return (filterText: string, filterQuery: string, filterValue?: unknown) => {
      const item = filterValue ?? filterText;
      if (matches<any>(item, filterQuery, selectProps.itemToStringLabel)) {
        return true;
      }

      return (
        filter == null &&
        filterValue != null &&
        Array.isArray((filterValue as { keywords?: unknown }).keywords) &&
        (filterValue as { keywords: readonly string[] }).keywords.some((keyword) =>
          defaultFilter(keyword, filterQuery),
        )
      );
    };
  }, [filter, locale, matches, selectProps.itemToStringLabel]);

  const filterSelectContextValue = React.useMemo(
    () => ({ items: normalizedItems, isItemEqualToValue }),
    [isItemEqualToValue, normalizedItems],
  );

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
      highlightItemOnHover={false}
      open={open}
      onOpenChange={handleOpenChange}
      onValueChange={handleValueChange}
    >
      <FilterSelectRootContext.Provider value={filterSelectContextValue}>
        <FilterSelectContent
          open={open}
          disabled={disabled}
          inputFocusVisible={inputFocusVisible}
          inputValue={inputValue}
          flatItems={flatItems}
          removalInProgressRef={removalInProgressRef}
          filter={filterDropdownFilter}
          onInputValueChange={handleInputValueChange}
        >
          {children}
        </FilterSelectContent>
      </FilterSelectRootContext.Provider>
    </SelectRoot>
  );
}

interface FilterSelectContentProps {
  open: boolean;
  disabled: boolean;
  inputFocusVisible: boolean;
  inputValue: string;
  flatItems: readonly any[];
  filter: FilterDropdownFilter;
  removalInProgressRef: React.MutableRefObject<boolean>;
  onInputValueChange: (
    value: string,
    details: FilterSelectRoot.InputValueChangeEventDetails,
  ) => void;
  children?: React.ReactNode;
}

function FilterSelectContent(props: FilterSelectContentProps) {
  const { store, listRef, setValue } = useSelectRootContext();
  const selectionReferenceItemId = useStore(store, selectors.selectionReferenceItemId);
  const visibleItemIndexes = useStore(store, selectors.visibleItemIndexes);
  const hasSelectedValue = useStore(store, selectors.hasSelectedValue);
  const value = useStore(store, selectors.value);
  const isEqual = useStore(store, selectors.isItemEqualToValue);

  const selectedIndex =
    selectionReferenceItemId == null
      ? null
      : (visibleItemIndexes.get(selectionReferenceItemId) ?? null);
  const hasQuery = props.inputValue.trim() !== '';

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
      selectedIndex={hasQuery ? null : selectedIndex}
      focusItemOnOpen={!hasQuery && hasSelectedValue ? 'auto' : false}
      value={props.inputValue}
      filter={props.filter}
      listRef={listRef}
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
