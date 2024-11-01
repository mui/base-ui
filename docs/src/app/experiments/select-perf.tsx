'use client';
import * as React from 'react';
import { Select as BaseSelect } from '@base_ui/react/Select';
import { Select2 as BaseSelect2 } from '@base_ui/react/Select2';
import * as Select from '@radix-ui/react-select';

const options = [...Array(1000)].map((_, i) => `Item ${i + 1}`);

function BaseSelect2Example() {
  return (
    <BaseSelect2.Root>
      <BaseSelect2.Trigger
        aria-label="Select"
        style={{ fontSize: 16, height: 40, border: 'none' }}
      >
        <BaseSelect2.Value placeholder="Select..." />
      </BaseSelect2.Trigger>
      <BaseSelect2.Positioner>
        <BaseSelect2.Popup
          style={{
            padding: '1rem 0.5rem',
            border: '5px solid black',
            background: 'white',
            fontSize: 16,
          }}
        >
          {options.map((item) => (
            <BaseSelect2.Option key={item} value={item}>
              <BaseSelect2.OptionText>{item}</BaseSelect2.OptionText>
            </BaseSelect2.Option>
          ))}
        </BaseSelect2.Popup>
      </BaseSelect2.Positioner>
    </BaseSelect2.Root>
  );
}

function BaseSelectExample() {
  return (
    <BaseSelect.Root defaultValue="Item 1">
      <BaseSelect.Trigger aria-label="Select">
        <BaseSelect.Value placeholder="Item 1" />
      </BaseSelect.Trigger>
      <BaseSelect.Positioner sideOffset={5}>
        <BaseSelect.Popup style={{ overflowY: 'scroll', maxHeight: 500 }}>
          {options.map((item) => (
            <BaseSelect.Option key={item} value={item}>
              <BaseSelect.OptionText>{item}</BaseSelect.OptionText>
            </BaseSelect.Option>
          ))}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Root>
  );
}

function RadixSelectExample() {
  return (
    <Select.Root>
      <Select.Trigger aria-label="Food">
        <Select.Value placeholder="Select a fruit…" />
        <Select.Icon />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content>
          <Select.ScrollUpButton />
          <Select.Viewport>
            {options.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

const SelectItem = React.forwardRef(
  ({ children, className, ...props }, forwardedRef) => {
    return (
      <Select.Item {...props} ref={forwardedRef}>
        <Select.ItemText>{children}</Select.ItemText>
        <Select.ItemIndicator />
      </Select.Item>
    );
  },
);

export default function SelectPerf() {
  return (
    <React.Fragment>
      <h2>Base UI Select 2</h2>
      <BaseSelect2Example />
      <h2>Base UI Select</h2>
      <BaseSelectExample />
      <h2>Radix UI Select</h2>
      <RadixSelectExample />
    </React.Fragment>
  );
}
