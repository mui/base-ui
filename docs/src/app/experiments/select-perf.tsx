'use client';
import * as React from 'react';
import { Select } from '@base_ui/react/Select';

const options = [...Array(1000)].map((_, i) => `Item ${i + 1}`);

export default function SelectPerf() {
  return (
    <Select.Root defaultValue="Item 1">
      <Select.Trigger aria-label="Select">
        <Select.Value placeholder="Item 1" />
      </Select.Trigger>
      <Select.Positioner sideOffset={5}>
        <Select.Popup
          style={{ maxHeight: 'var(--available-height)', overflowY: 'scroll' }}
        >
          {options.map((item) => (
            <Select.Option key={item} value={item}>
              <Select.OptionText>{item}</Select.OptionText>
            </Select.Option>
          ))}
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>
  );
}
