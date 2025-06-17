'use client';
import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import {
  Button,
  ListBox,
  ListBoxItem,
  Popover,
  Select as RaSelect,
  SelectValue,
} from 'react-aria-components';
import * as Radix from '@radix-ui/react-select';
import * as Ariakit from '@ariakit/react';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';

const items = Array.from({ length: 1000 }, (_, i) => ({
  label: `Item ${i}`,
  value: `${i}`,
}));

function ReactAriaSelect() {
  return (
    <RaSelect>
      <Button>
        <SelectValue />
        <span aria-hidden="true">▼</span>
      </Button>
      <Popover className="max-h-[500px] overflow-y-auto">
        <ListBox>
          {items.map((item) => (
            <ListBoxItem
              key={item.value}
              className="data-[hovered]:bg-black data-[hovered]:text-white"
            >
              {item.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </RaSelect>
  );
}

function BaseUISelect() {
  return (
    <Select.Root>
      <Select.Trigger>
        <Select.Value placeholder="Select an item" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner alignItemWithTrigger={false}>
          <Select.Popup className="max-h-[var(--available-height)] overflow-y-auto">
            {items.map((item) => (
              <Select.Item
                key={item.value}
                value={item.value}
                className="data-[highlighted]:bg-black data-[highlighted]:text-white"
              >
                <Select.ItemIndicator />
                <Select.ItemText>{item.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function RadixSelect() {
  return (
    <Radix.Root>
      <Radix.Trigger>
        <Radix.Value placeholder="Select an item" />
      </Radix.Trigger>
      <Radix.Portal>
        <Radix.Content position="popper">
          <Radix.Viewport>
            {items.map((item) => (
              <Radix.Item
                key={item.value}
                value={item.value}
                className="data-[highlighted]:bg-black data-[highlighted]:text-white"
              >
                <Radix.ItemIndicator />
                <Radix.ItemText>{item.label}</Radix.ItemText>
              </Radix.Item>
            ))}
          </Radix.Viewport>
        </Radix.Content>
      </Radix.Portal>
    </Radix.Root>
  );
}

function AriakitSelect() {
  const [open, setOpen] = React.useState(false);
  return (
    <Ariakit.SelectProvider open={open} setOpen={setOpen}>
      <Ariakit.Select>
        <Ariakit.SelectValue fallback="Select an item" />
      </Ariakit.Select>
      {open && (
        <Ariakit.SelectPopover
          gutter={4}
          sameWidth
          className="max-h-[var(--popover-available-height)] w-[300px] overflow-y-auto"
        >
          {items.map((item) => (
            <Ariakit.SelectItem
              key={item.value}
              value={item.value}
              className="w-full data-[active-item]:bg-black data-[active-item]:text-white"
            >
              {item.label}
              <Ariakit.SelectItemCheck />
            </Ariakit.SelectItem>
          ))}
        </Ariakit.SelectPopover>
      )}
    </Ariakit.SelectProvider>
  );
}

function HeadlessUISelect() {
  return (
    <Listbox>
      <ListboxButton>Select an item</ListboxButton>
      <ListboxOptions anchor="bottom">
        {items.map((item) => (
          <ListboxOption
            key={item.value}
            value={item.value}
            className="data-focus:bg-blue-100"
          >
            {({ focus, selected }) => (
              <div className={focus ? 'bg-black text-white' : undefined}>
                {selected && <span className="size-5">✓</span>}
                {item.label}
              </div>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

export default function SelectBenchmark() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Base UI</h2>
      <BaseUISelect />
      <h2 className="text-2xl font-bold">React Aria</h2>
      <ReactAriaSelect />
      <h2 className="text-2xl font-bold">Radix UI</h2>
      <RadixSelect />
      <h2 className="text-2xl font-bold">Ariakit</h2>
      <AriakitSelect />
      <h2 className="text-2xl font-bold">Headless UI</h2>
      <HeadlessUISelect />
    </div>
  );
}
