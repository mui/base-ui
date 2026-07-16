'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';

export default function ExampleVirtualizedCombobox() {
  return (
    <Combobox.Root items={virtualizedItems} itemToStringLabel={getItemLabel}>
      <label className="flex flex-col gap-1 text-sm leading-5 font-bold text-neutral-950 dark:text-white">
        Search 10,000 items
        <Combobox.Input className="h-8 w-64 border border-neutral-950 bg-white dark:bg-neutral-950 px-2 text-sm any-pointer-coarse:text-base font-normal text-neutral-950 focus:outline-2 focus:-outline-offset-1 focus:outline-neutral-950 dark:focus:outline-white dark:border-white dark:text-white" />
      </label>

      <Combobox.Portal>
        <Combobox.Positioner className="outline-none" sideOffset={4}>
          <Combobox.Popup className="w-[var(--anchor-width)] max-w-[var(--available-width)] border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
            <Combobox.Empty>
              <div className="py-3 px-2 text-sm leading-4 text-neutral-500 dark:text-neutral-400">
                No items found.
              </div>
            </Combobox.Empty>
            <Combobox.List className="p-0">
              <Combobox.Virtualizer
                className="h-[min(22.5rem,var(--total-size))] max-h-[var(--available-height)] overflow-auto overscroll-contain scroll-py-1"
                estimateSize={32}
                getItemKey={(item) => item.id}
                overscanPx={640}
                paddingStart={4}
                paddingEnd={4}
              >
                {(item: VirtualizedItem) => (
                  <Combobox.Item
                    value={item}
                    className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 p-2 text-sm leading-4 outline-none select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-neutral-950 dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white"
                  >
                    <Combobox.ItemIndicator className="col-start-1">
                      <CheckIcon />
                    </Combobox.ItemIndicator>
                    <span className="col-start-2">{item.name}</span>
                  </Combobox.Item>
                )}
              </Combobox.Virtualizer>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

interface VirtualizedItem {
  id: string;
  name: string;
}

function getItemLabel(item: VirtualizedItem | null) {
  return item ? item.name : '';
}

const virtualizedItems: VirtualizedItem[] = Array.from({ length: 10000 }, (_, index) => {
  const id = String(index + 1);
  const indexLabel = id.padStart(4, '0');
  return { id, name: `Item ${indexLabel}` };
});
