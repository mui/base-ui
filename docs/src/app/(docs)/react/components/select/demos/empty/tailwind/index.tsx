import * as React from 'react';
import { Select } from '@base-ui/react/select';

const items: Array<{ label: string; value: string }> = [];

export default function EmptySelect() {
  return (
    <div className="flex flex-col items-start gap-1">
      <Select.Root items={items}>
        <Select.Label className="cursor-default text-sm font-bold text-neutral-950 dark:text-white">
          Apple
        </Select.Label>
        <Select.Trigger className="flex h-8 min-w-40 items-center justify-between gap-3 border border-neutral-950 bg-white pr-1 pl-2 text-sm leading-none font-normal whitespace-nowrap text-neutral-950 select-none hover:bg-neutral-100 focus-visible:-outline-offset-1 focus-visible:outline-2 focus-visible:outline-neutral-950 data-pressed:bg-neutral-100 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 dark:focus-visible:outline-white dark:data-pressed:bg-neutral-800">
          <Select.Value
            className="data-placeholder:text-neutral-500 dark:data-placeholder:text-neutral-400"
            placeholder="Select apple"
          />
          <Select.Icon>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className="z-10 outline-hidden"
            sideOffset={4}
            alignItemWithTrigger={false}
          >
            <Select.Popup className="min-w-[var(--anchor-width)] origin-[var(--transform-origin)] border border-neutral-950 bg-white bg-clip-padding text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[transform,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
              <Select.Empty>
                <div className="px-2.5 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                  No apples available.
                </div>
              </Select.Empty>
              <Select.List>
                {items.map(({ label, value }) => (
                  <Select.Item key={value} value={value}>
                    {label}
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}
