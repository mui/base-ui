import * as React from 'react';
import { Menubar } from '@base-ui-components/react/menubar';
import { Menu } from '@base-ui-components/react/menu';

export default function ExampleMenubar() {
  return (
    <Menubar className="flex gap-px rounded-md border border-gray-200 bg-gray-50 p-0.5">
      <Menu.Root>
        <Menu.Trigger className="focus-visible:outline-blue-500 h-8 rounded px-3 text-sm font-medium text-gray-600 outline-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 active:bg-gray-200 disabled:cursor-not-allowed data-[disabled]:opacity-50 data-[popup-open]:bg-gray-100">
          File
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="outline-none" sideOffset={8}>
            <Menu.Popup className="origin-[var(--transform-origin)] rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 dark:shadow-none dark:outline dark:outline-1 dark:-outline-offset-1 dark:outline-gray-300">
              <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                New
              </Menu.Item>
              <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                Open
              </Menu.Item>
              <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                Save
              </Menu.Item>

              <Menu.Root>
                <Menu.SubmenuTrigger className="flex w-full cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900 data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:rounded-sm data-[popup-open]:before:bg-gray-100 data-[highlighted]:data-[popup-open]:before:bg-gray-900">
                  Export
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup className="origin-[var(--transform-origin)] rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 dark:shadow-none dark:outline dark:outline-1 dark:-outline-offset-1 dark:outline-gray-300">
                      <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                        PDF
                      </Menu.Item>
                      <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                        PNG
                      </Menu.Item>
                      <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                        SVG
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>

              <Menu.Separator className="mx-4 my-1.5 h-px bg-gray-200" />
              <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                Print
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className="focus-visible:outline-blue-500 h-8 rounded px-3 text-sm font-medium text-gray-600 outline-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 active:bg-gray-200 disabled:cursor-not-allowed data-[disabled]:opacity-50 data-[popup-open]:bg-gray-100">
          Edit
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="outline-none" sideOffset={8}>
            <Menu.Popup className="origin-[var(--transform-origin)] rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 dark:shadow-none dark:outline dark:outline-1 dark:-outline-offset-1 dark:outline-gray-300">
              <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                Cut
              </Menu.Item>
              <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                Copy
              </Menu.Item>
              <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                Paste
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className="focus-visible:outline-blue-500 h-8 rounded px-3 text-sm font-medium text-gray-600 outline-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 active:bg-gray-200 disabled:cursor-not-allowed data-[disabled]:opacity-50 data-[popup-open]:bg-gray-100">
          View
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="outline-none" sideOffset={8}>
            <Menu.Popup className="origin-[var(--transform-origin)] rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 dark:shadow-none dark:outline dark:outline-1 dark:-outline-offset-1 dark:outline-gray-300">
              <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                Zoom In
              </Menu.Item>
              <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                Zoom Out
              </Menu.Item>

              <Menu.Root>
                <Menu.SubmenuTrigger className="flex w-full cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900 data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:rounded-sm data-[popup-open]:before:bg-gray-100 data-[highlighted]:data-[popup-open]:before:bg-gray-900">
                  Layout
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner>
                    <Menu.Popup className="origin-[var(--transform-origin)] rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 dark:shadow-none dark:outline dark:outline-1 dark:-outline-offset-1 dark:outline-gray-300">
                      <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                        Single Page
                      </Menu.Item>
                      <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                        Two Pages
                      </Menu.Item>
                      <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                        Continuous
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>

              <Menu.Separator className="mx-4 my-1.5 h-px bg-gray-200" />
              <Menu.Item className="flex cursor-default items-center justify-between gap-4 px-4 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900">
                Full Screen
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger
          className="focus-visible:outline-blue-500 h-8 rounded px-3 text-sm font-medium text-gray-600 outline-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 active:bg-gray-200 disabled:cursor-not-allowed data-[disabled]:opacity-50 data-[popup-open]:bg-gray-100"
          disabled
        >
          Help
        </Menu.Trigger>
      </Menu.Root>
    </Menubar>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M6 12L10 8L6 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
