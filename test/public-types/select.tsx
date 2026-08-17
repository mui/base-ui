import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { FilterSelect } from '@base-ui/react/filter-select';

export type SelectRootProps<Value> = Select.Root.Props<Value>;
export type SelectRootActions = Select.Root.Actions;
export type SelectRootChangeEventDetails = Select.Root.ChangeEventDetails;
export type FilterSelectRootProps<Value> = FilterSelect.Root.Props<Value>;
export type FilterSelectRootInputValueChangeEventDetails =
  FilterSelect.Root.InputValueChangeEventDetails;

// A typed wrapper that forwards props. `Omit` collapses a discriminated union into one widened
// object type, so `Select.Root.Props` must stay a plain intersection for this to compile.
export interface SimpleSelectProps<Value> extends Omit<SelectRootProps<Value>, 'children'> {
  label?: string;
}

export function SimpleSelect<Value>({ label = 'Select', ...rest }: SimpleSelectProps<Value>) {
  return (
    <Select.Root {...rest}>
      <Select.Trigger>
        <Select.Value />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.List>
              <Select.Item value={null}>{label}</Select.Item>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

// The same wrapper shape for a filterable select, including the input-value props. `Omit`
// collapses a discriminated union into one widened object type, so `FilterSelect.Root.Props`
// must stay a plain intersection for this to compile.
export interface SimpleFilterSelectProps<Value> extends Omit<
  FilterSelectRootProps<Value>,
  'children'
> {
  label?: string;
}

export function SimpleFilterSelect<Value>({
  label = 'Select',
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
    <FilterSelect.Root {...rest} onInputValueChange={handleInputValueChange}>
      <FilterSelect.Trigger aria-label={label}>
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
