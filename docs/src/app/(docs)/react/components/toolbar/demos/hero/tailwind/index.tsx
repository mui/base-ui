import * as React from 'react';
import { Toolbar } from '@base-ui/react/toolbar';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '@base-ui/react/toggle';
import { Select } from '@base-ui/react/select';

export default function ExampleToolbar() {
  return (
    <Toolbar.Root className="flex w-150 items-center gap-px border border-gray-950 bg-white p-px dark:border-white dark:bg-gray-950">
      <ToggleGroup className="flex" aria-label="Alignment">
        <Toolbar.Button
          render={<Toggle />}
          aria-label="Align left"
          value="align-left"
          className="flex h-8 min-w-8 items-center justify-center border-0 bg-transparent px-3 font-[inherit] text-sm leading-5 font-normal text-gray-950 select-none hover:not-data-disabled:bg-gray-100 active:not-data-disabled:not-data-pressed:bg-gray-200 data-pressed:bg-gray-950 data-pressed:text-white data-pressed:hover:not-data-disabled:bg-gray-950 data-pressed:hover:not-data-disabled:text-white data-[popup-open]:bg-gray-100 dark:text-white dark:hover:not-data-disabled:bg-gray-800 dark:active:not-data-disabled:not-data-pressed:bg-gray-700 dark:data-pressed:bg-white dark:data-pressed:text-gray-950 dark:data-pressed:hover:not-data-disabled:bg-white dark:data-pressed:hover:not-data-disabled:text-gray-950 dark:data-[popup-open]:bg-gray-800 focus-visible:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
        >
          Align Left
        </Toolbar.Button>
        <Toolbar.Button
          render={<Toggle />}
          aria-label="Align right"
          value="align-right"
          className="flex h-8 min-w-8 items-center justify-center border-0 bg-transparent px-3 font-[inherit] text-sm leading-5 font-normal text-gray-950 select-none hover:not-data-disabled:bg-gray-100 active:not-data-disabled:not-data-pressed:bg-gray-200 data-pressed:bg-gray-950 data-pressed:text-white data-pressed:hover:not-data-disabled:bg-gray-950 data-pressed:hover:not-data-disabled:text-white data-[popup-open]:bg-gray-100 dark:text-white dark:hover:not-data-disabled:bg-gray-800 dark:active:not-data-disabled:not-data-pressed:bg-gray-700 dark:data-pressed:bg-white dark:data-pressed:text-gray-950 dark:data-pressed:hover:not-data-disabled:bg-white dark:data-pressed:hover:not-data-disabled:text-gray-950 dark:data-[popup-open]:bg-gray-800 focus-visible:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
        >
          Align Right
        </Toolbar.Button>
      </ToggleGroup>
      <Toolbar.Separator className="m-1 h-4 w-px bg-gray-950 dark:bg-white" />
      <Toolbar.Group className="flex" aria-label="Numerical format">
        <Toolbar.Button
          className="flex h-8 min-w-8 items-center justify-center border-0 bg-transparent font-[inherit] text-sm leading-5 font-normal text-gray-950 select-none hover:not-data-disabled:bg-gray-100 active:not-data-disabled:not-data-pressed:bg-gray-200 data-pressed:bg-gray-950 data-pressed:text-white data-pressed:hover:not-data-disabled:bg-gray-950 data-pressed:hover:not-data-disabled:text-white data-[popup-open]:bg-gray-100 dark:text-white dark:hover:not-data-disabled:bg-gray-800 dark:active:not-data-disabled:not-data-pressed:bg-gray-700 dark:data-pressed:bg-white dark:data-pressed:text-gray-950 dark:data-pressed:hover:not-data-disabled:bg-white dark:data-pressed:hover:not-data-disabled:text-gray-950 dark:data-[popup-open]:bg-gray-800 focus-visible:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
          aria-label="Format as currency"
        >
          $
        </Toolbar.Button>
        <Toolbar.Button
          className="flex h-8 min-w-8 items-center justify-center border-0 bg-transparent font-[inherit] text-sm leading-5 font-normal text-gray-950 select-none hover:not-data-disabled:bg-gray-100 active:not-data-disabled:not-data-pressed:bg-gray-200 data-pressed:bg-gray-950 data-pressed:text-white data-pressed:hover:not-data-disabled:bg-gray-950 data-pressed:hover:not-data-disabled:text-white data-[popup-open]:bg-gray-100 dark:text-white dark:hover:not-data-disabled:bg-gray-800 dark:active:not-data-disabled:not-data-pressed:bg-gray-700 dark:data-pressed:bg-white dark:data-pressed:text-gray-950 dark:data-pressed:hover:not-data-disabled:bg-white dark:data-pressed:hover:not-data-disabled:text-gray-950 dark:data-[popup-open]:bg-gray-800 focus-visible:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
          aria-label="Format as percent"
        >
          %
        </Toolbar.Button>
      </Toolbar.Group>
      <Toolbar.Separator className="m-1 h-4 w-px bg-gray-950 dark:bg-white" />
      <Select.Root defaultValue="Helvetica">
        <Toolbar.Button
          render={<Select.Trigger />}
          className="flex h-8 min-w-32 cursor-default items-center justify-between border-0 bg-transparent px-3 font-[inherit] text-sm leading-5 font-normal text-gray-950 select-none hover:not-data-disabled:bg-gray-100 active:not-data-disabled:not-data-pressed:bg-gray-200 data-pressed:bg-gray-950 data-pressed:text-white data-pressed:hover:not-data-disabled:bg-gray-950 data-pressed:hover:not-data-disabled:text-white data-[popup-open]:bg-gray-100 dark:text-white dark:hover:not-data-disabled:bg-gray-800 dark:active:not-data-disabled:not-data-pressed:bg-gray-700 dark:data-pressed:bg-white dark:data-pressed:text-gray-950 dark:data-pressed:hover:not-data-disabled:bg-white dark:data-pressed:hover:not-data-disabled:text-gray-950 dark:data-[popup-open]:bg-gray-800 focus-visible:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
        >
          <Select.Value />
          <Select.Icon className="flex">
            <ChevronUpDownIcon />
          </Select.Icon>
        </Toolbar.Button>
        <Select.Portal>
          <Select.Positioner className="z-10 outline-none select-none" sideOffset={8}>
            <Select.Popup className="group max-h-[var(--available-height)] min-w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-y-auto border border-gray-950 bg-white bg-clip-padding text-gray-950 shadow-[0.25rem_0.25rem_0_rgb(0_0_0/12%)] outline-none transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] data-[side=none]:translate-y-px data-[side=none]:scale-100 data-[side=none]:opacity-100 data-[side=none]:transition-none data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 dark:border-white dark:bg-gray-950 dark:text-white dark:shadow-none">
              <Select.Item
                value="Helvetica"
                className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-1.5 pr-4 pl-2.5 text-sm leading-5 outline-none select-none group-data-[side=none]:pr-12 data-[highlighted]:bg-gray-950 data-[highlighted]:text-white pointer-coarse:py-2.5 dark:data-[highlighted]:bg-white dark:data-[highlighted]:text-gray-950"
              >
                <Select.ItemIndicator className="col-start-1">
                  <CheckIcon className="block size-3" />
                </Select.ItemIndicator>
                <Select.ItemText className="col-start-2">Helvetica</Select.ItemText>
              </Select.Item>
              <Select.Item
                value="Arial"
                className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-1.5 pr-4 pl-2.5 text-sm leading-5 outline-none select-none group-data-[side=none]:pr-12 data-[highlighted]:bg-gray-950 data-[highlighted]:text-white pointer-coarse:py-2.5 dark:data-[highlighted]:bg-white dark:data-[highlighted]:text-gray-950"
              >
                <Select.ItemIndicator className="col-start-1">
                  <CheckIcon className="block size-3" />
                </Select.ItemIndicator>
                <Select.ItemText className="col-start-2">Arial</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <Toolbar.Separator className="m-1 h-4 w-px bg-gray-950 dark:bg-white" />
      <Toolbar.Link
        className="mr-[0.875rem] ml-auto flex-none self-center font-[inherit] text-sm leading-5 text-gray-500 no-underline hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-500 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800"
        href="#"
      >
        Edited 51m ago
      </Toolbar.Link>
    </Toolbar.Root>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
