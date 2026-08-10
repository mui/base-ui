import * as React from 'react';
import { Select } from '@base-ui/react/select';

export type SelectRootProps<Value> = Select.Root.Props<Value>;
export type SelectRootActions = Select.Root.Actions;
export type SelectRootChangeEventDetails = Select.Root.ChangeEventDetails;
export type SelectRootInputValueChangeEventDetails = Select.Root.InputValueChangeEventDetails;

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

// The same wrapper shape for a filterable select, including the input-value props.
export function SimpleFilterableSelect<Value>(props: SimpleSelectProps<Value>) {
  const handleInputValueChange = (
    value: string,
    eventDetails: SelectRootInputValueChangeEventDetails,
  ) => {
    if (eventDetails.reason === 'popup-close') {
      eventDetails.cancel();
    }
    return value;
  };

  return (
    <Select.Root {...props} filter onInputValueChange={handleInputValueChange}>
      <Select.Trigger>
        <Select.Value />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Input aria-label="Filter" />
            <Select.Clear aria-label="Clear" />
            <Select.Empty>No matches</Select.Empty>
            <Select.List>
              {(item: { value: Value; label: string }) => (
                <Select.Item value={item.value}>{item.label}</Select.Item>
              )}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
