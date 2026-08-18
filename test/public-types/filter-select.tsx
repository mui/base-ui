import * as React from 'react';
import {
  FilterSelect,
  type FilterSelectFilter,
  type FilterSelectItemData,
} from '@base-ui/react/filter-select';

export type FilterSelectRootProps<
  Value,
  Item extends FilterSelectItemData<Value> = FilterSelectItemData<Value>,
> = FilterSelect.Root.Props<Value, false, Item>;
export type FilterSelectRootInputValueChangeEventDetails =
  FilterSelect.Root.InputValueChangeEventDetails;

// A typed wrapper that forwards filter-select props, including the input-value props.
export interface SimpleFilterSelectProps<Value> extends Omit<
  FilterSelectRootProps<Value>,
  'children' | 'items'
> {
  items: FilterSelectRootProps<Value>['items'];
  label?: string;
}

export function SimpleFilterSelect<Value>({
  label = 'Select',
  items,
  ...rest
}: SimpleFilterSelectProps<Value>) {
  const handleInputValueChange = (
    value: string,
    eventDetails: FilterSelectRootInputValueChangeEventDetails,
  ) => {
    if (eventDetails.reason === 'popup-close') {
      eventDetails.cancel();
    }
    return value;
  };

  return (
    <FilterSelect.Root {...rest} items={items} onInputValueChange={handleInputValueChange}>
      <FilterSelect.Trigger>
        <FilterSelect.Value />
      </FilterSelect.Trigger>
      <FilterSelect.Portal>
        <FilterSelect.Positioner>
          <FilterSelect.Popup>
            <FilterSelect.Input aria-label={label} />
            <FilterSelect.Clear aria-label="Clear" />
            <FilterSelect.Empty>No matches</FilterSelect.Empty>
            <FilterSelect.List>
              {(item: { value: Value; label: string }) => (
                <FilterSelect.Item value={item.value}>{item.label}</FilterSelect.Item>
              )}
            </FilterSelect.List>
          </FilterSelect.Popup>
        </FilterSelect.Positioner>
      </FilterSelect.Portal>
    </FilterSelect.Root>
  );
}

export function StringRecordFilterSelect() {
  return <FilterSelect.Root<string> items={{ apple: 'Apple' }} />;
}

export function NumberRecordFilterSelect() {
  // @ts-expect-error record keys always produce string values
  return <FilterSelect.Root<number> items={{ 1: 'One' }} />;
}

interface CategorizedItem extends FilterSelectItemData<string> {
  category: string;
}

const filterByCategory: FilterSelectFilter<CategorizedItem> = (item, query) =>
  item.category === query;

export function CategorizedFilterSelect() {
  const items: CategorizedItem[] = [{ value: 'settings', label: 'Settings', category: 'admin' }];

  return <FilterSelect.Root items={items} filter={filterByCategory} />;
}
