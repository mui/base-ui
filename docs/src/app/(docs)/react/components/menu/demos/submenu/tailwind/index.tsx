'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';

const popupClass =
  'origin-[var(--transform-origin)] border border-gray-950 bg-white py-1 text-gray-950 outline-hidden [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]';
const itemClass =
  "flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[disabled]:text-gray-500 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[disabled]:text-gray-400";
const submenuTriggerClass =
  "flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 outline-hidden select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[disabled]:text-gray-500 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[disabled]:text-gray-400";

export default function ExampleMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger className="flex h-8 items-center justify-center gap-1.5 rounded-none border border-gray-950 bg-white px-3 text-sm leading-5 font-normal text-gray-950 select-none hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100 dark:border-white dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900 dark:active:bg-gray-800 dark:data-[popup-open]:bg-gray-800">
        Song <ChevronDownIcon className="-mr-1" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="outline-hidden" sideOffset={8}>
          <Menu.Popup className={popupClass}>
            <Menu.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
              <ArrowSvg />
            </Menu.Arrow>
            <Menu.Item className={itemClass}>Add to Library</Menu.Item>

            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger className={submenuTriggerClass}>
                Add to Playlist <ChevronRightIcon />
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner
                  className="outline-hidden"
                  sideOffset={getOffset}
                  alignOffset={getOffset}
                >
                  <Menu.Popup className={popupClass}>
                    <Menu.Item className={itemClass}>Add to Library</Menu.Item>
                    <Menu.Item className={itemClass}>Add to Playlist</Menu.Item>
                    <Menu.Separator className="mx-1 my-1 h-px bg-gray-950 dark:bg-white" />
                    <Menu.Item className={itemClass}>Play Next</Menu.Item>
                    <Menu.Item className={itemClass}>Play Last</Menu.Item>
                    <Menu.Separator className="mx-1 my-1 h-px bg-gray-950 dark:bg-white" />
                    <Menu.Item className={itemClass}>Favorite</Menu.Item>
                    <Menu.Item className={itemClass}>Share</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>

            <Menu.Separator className="mx-1 my-1 h-px bg-gray-950 dark:bg-white" />

            <Menu.Item className={itemClass}>Play Next</Menu.Item>
            <Menu.Item className={itemClass}>Play Last</Menu.Item>
            <Menu.Separator className="mx-1 my-1 h-px bg-gray-950 dark:bg-white" />
            <Menu.Item className={itemClass}>Favorite</Menu.Item>
            <Menu.Item className={itemClass}>Share</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function getOffset({ side }: { side: Menu.Positioner.Props['side'] }) {
  return side === 'top' || side === 'bottom' ? 4 : -4;
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-white dark:fill-gray-950"
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className="fill-gray-950 dark:fill-white"
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="fill-white dark:fill-gray-950"
      />
    </svg>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
