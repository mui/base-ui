import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { Select } from '@base-ui/react/select';

const items = [
  { label: 'select', value: null },
  { label: 'one', value: 'one' },
  { label: 'two', value: 'two' },
  { label: 'three', value: 'three' },
  { label: 'four', value: 'four' },
];

export default function SelectValidateOnChange() {
  return (
    <Field.Root
      validationMode="onChange"
      validate={(val) => {
        if (val === 'one') {
          return 'error one';
        }

        if (val === 'three') {
          return 'error three';
        }
        return null;
      }}
      className="flex flex-col items-start gap-1"
    >
      <Select.Root items={items} required>
        <Select.Trigger className="flex h-10 min-w-36 items-center justify-between gap-3 rounded-md border border-gray-200 pr-3 pl-3.5 text-base text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 data-[popup-open]:bg-gray-100 cursor-default">
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="outline-none select-none z-10" sideOffset={8}>
            <Select.Popup className="group origin-[var(--transform-origin)] bg-clip-padding rounded-md bg-[canvas] text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none dark:shadow-none dark:outline-gray-300">
              <Select.ScrollUpArrow className="top-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute data-[side=none]:before:top-[-100%] before:left-0 before:h-full before:w-full before:content-['']" />
              <Select.List className="relative py-1 scroll-py-6 overflow-y-auto max-h-[var(--available-height)]">
                {items.map(({ label, value }) => (
                  <Select.Item
                    key={label}
                    value={value}
                    className="min-w-[var(--anchor-width)] cursor-default items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4 data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900 pointer-coarse:py-2.5 pointer-coarse:text-[0.925rem]"
                  >
                    <Select.ItemText>{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className="bottom-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:left-0 before:h-full before:w-full before:content-[''] bottom-0 data-[side=none]:before:bottom-[-100%]" />
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <Field.Error data-testid="error" className="text-sm text-red-800" match="valueMissing">
        valueMissing error
      </Field.Error>
      <Field.Error data-testid="error" className="text-sm text-red-800" match="customError" />
    </Field.Root>
  );
}
