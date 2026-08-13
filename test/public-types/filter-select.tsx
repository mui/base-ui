import * as React from 'react';
import { FilterSelect } from '@base-ui/react/filter-select';

export type FilterSelectRootProps<Value> = FilterSelect.Root.Props<Value>;
export type FilterSelectRootInputValueChangeEventDetails =
  FilterSelect.Root.InputValueChangeEventDetails;

// A typed wrapper that forwards filter-select props, including the input-value props.
export interface SimpleFilterSelectProps<Value> extends Omit<
  FilterSelectRootProps<Value>,
  'children' | 'items'
> {
  items?: FilterSelectRootProps<Value>['items'];
  label?: string;
}

export function SimpleFilterSelect<Value>({
  label = 'Select',
  items = [{ value: null, label }],
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
            <FilterSelect.Input aria-label="Filter" />
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
