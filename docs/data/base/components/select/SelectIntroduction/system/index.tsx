import * as React from 'react';
import * as Select from '@base_ui/react/Select';

export default function UnstyledSelectIntroduction() {
  return (
    <Select.Root>
      <Select.Trigger>Trigger</Select.Trigger>
      <Select.Positioner>
        <Select.Popup>
          <Select.Item>Item 1</Select.Item>
          <Select.Item>Item 2</Select.Item>
          <Select.Item>Item 3</Select.Item>
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>
  );
}
