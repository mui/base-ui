import * as React from 'react';
import { Select } from '@base-ui/react/select';

export type SelectRootProps<Value> = Select.Root.Props<Value>;
export type SelectRootActions = Select.Root.Actions;
export type SelectRootChangeEventDetails = Select.Root.ChangeEventDetails;

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
