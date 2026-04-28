'use client';
import * as React from 'react';
import { Menubar } from '@base-ui/react/menubar';
import { Menu } from '@base-ui/react/menu';

export default function ExampleMenubar() {
  return (
    <Menubar className="flex items-center border border-gray-950 bg-white p-px dark:border-white dark:bg-gray-950">
      <Menu.Root>
        <Menu.Trigger className="h-8 border-0 bg-transparent px-3 font-[inherit] text-sm leading-5 font-normal text-gray-950 select-none focus-visible:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 data-popup-open:bg-gray-100 data-pressed:bg-gray-100 data-disabled:text-gray-500 dark:text-white dark:focus-visible:bg-gray-800 dark:data-popup-open:bg-gray-800 dark:data-pressed:bg-gray-800 dark:data-disabled:text-gray-400">
          File
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="outline-none" sideOffset={6} alignOffset={-2}>
            <Menu.Popup className="origin-[var(--transform-origin)] border border-gray-950 bg-white py-1 text-gray-950 outline-none [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[instant]:transition-none data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]">
              <Menu.Item
                onClick={handleClick}
                className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
              >
                New
              </Menu.Item>
              <Menu.Item
                onClick={handleClick}
                className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
              >
                Open
              </Menu.Item>
              <Menu.Item
                onClick={handleClick}
                className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
              >
                Save
              </Menu.Item>

              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white">
                  Export
                  <ChevronRightIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner className="outline-none" sideOffset={-4} alignOffset={-4}>
                    <Menu.Popup className="origin-[var(--transform-origin)] border border-gray-950 bg-white py-1 text-gray-950 outline-none [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[instant]:transition-none data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]">
                      <Menu.Item
                        onClick={handleClick}
                        className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
                      >
                        PDF
                      </Menu.Item>
                      <Menu.Item
                        onClick={handleClick}
                        className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
                      >
                        PNG
                      </Menu.Item>
                      <Menu.Item
                        onClick={handleClick}
                        className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
                      >
                        SVG
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>

              <Menu.Separator className="mx-1 my-1 h-px bg-gray-950 dark:bg-white" />
              <Menu.Item
                onClick={handleClick}
                className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
              >
                Print
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className="h-8 border-0 bg-transparent px-3 font-[inherit] text-sm leading-5 font-normal text-gray-950 select-none focus-visible:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 data-popup-open:bg-gray-100 data-pressed:bg-gray-100 data-disabled:text-gray-500 dark:text-white dark:focus-visible:bg-gray-800 dark:data-popup-open:bg-gray-800 dark:data-pressed:bg-gray-800 dark:data-disabled:text-gray-400">
          Edit
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="outline-none" sideOffset={6}>
            <Menu.Popup className="origin-[var(--transform-origin)] border border-gray-950 bg-white py-1 text-gray-950 outline-none [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[instant]:transition-none data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]">
              <Menu.Item
                onClick={handleClick}
                className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
              >
                Cut
              </Menu.Item>
              <Menu.Item
                onClick={handleClick}
                className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
              >
                Copy
              </Menu.Item>
              <Menu.Item
                onClick={handleClick}
                className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
              >
                Paste
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className="h-8 border-0 bg-transparent px-3 font-[inherit] text-sm leading-5 font-normal text-gray-950 select-none focus-visible:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 data-popup-open:bg-gray-100 data-pressed:bg-gray-100 data-disabled:text-gray-500 dark:text-white dark:focus-visible:bg-gray-800 dark:data-popup-open:bg-gray-800 dark:data-pressed:bg-gray-800 dark:data-disabled:text-gray-400">
          View
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="outline-none" sideOffset={6}>
            <Menu.Popup className="origin-[var(--transform-origin)] border border-gray-950 bg-white py-1 text-gray-950 outline-none [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[instant]:transition-none data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]">
              <Menu.Item
                onClick={handleClick}
                className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
              >
                Zoom In
              </Menu.Item>
              <Menu.Item
                onClick={handleClick}
                className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
              >
                Zoom Out
              </Menu.Item>

              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white">
                  Layout
                  <ChevronRightIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner className="outline-none" sideOffset={-4} alignOffset={-4}>
                    <Menu.Popup className="origin-[var(--transform-origin)] border border-gray-950 bg-white py-1 text-gray-950 outline-none [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[instant]:transition-none data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]">
                      <Menu.Item
                        onClick={handleClick}
                        className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
                      >
                        Single Page
                      </Menu.Item>
                      <Menu.Item
                        onClick={handleClick}
                        className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
                      >
                        Two Pages
                      </Menu.Item>
                      <Menu.Item
                        onClick={handleClick}
                        className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
                      >
                        Continuous
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>

              <Menu.Separator className="mx-1 my-1 h-px bg-gray-950 dark:bg-white" />
              <Menu.Item
                onClick={handleClick}
                className="flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 font-normal outline-none select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white"
              >
                Full Screen
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root disabled>
        <Menu.Trigger className="h-8 border-0 bg-transparent px-3 font-[inherit] text-sm leading-5 font-normal text-gray-950 select-none focus-visible:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 data-popup-open:bg-gray-100 data-pressed:bg-gray-100 data-disabled:text-gray-500 dark:text-white dark:focus-visible:bg-gray-800 dark:data-popup-open:bg-gray-800 dark:data-pressed:bg-gray-800 dark:data-disabled:text-gray-400">
          Help
        </Menu.Trigger>
      </Menu.Root>
    </Menubar>
  );
}

function handleClick(event: React.MouseEvent<HTMLElement>) {
  // eslint-disable-next-line no-console
  console.log(`${event.currentTarget.textContent} clicked`);
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
