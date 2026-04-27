import * as React from 'react';
import { ContextMenu } from '@base-ui/react/context-menu';

const popupClass =
  'origin-[var(--transform-origin)] border border-gray-950 bg-white py-1 text-gray-950 outline-hidden [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]';
const itemClass =
  "flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 data-[disabled]:text-gray-500 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white dark:data-[disabled]:text-gray-400";
const submenuTriggerClass =
  "flex cursor-default items-center justify-between gap-4 py-2 pr-4 pl-4 text-sm leading-4 outline-hidden select-none data-[popup-open]:relative data-[popup-open]:z-0 data-[popup-open]:before:absolute data-[popup-open]:before:inset-x-1 data-[popup-open]:before:inset-y-0 data-[popup-open]:before:z-[-1] data-[popup-open]:before:bg-gray-100 data-[popup-open]:before:content-[''] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-gray-950 data-[highlighted]:before:content-[''] data-[highlighted]:data-[popup-open]:before:bg-gray-950 data-[disabled]:text-gray-500 dark:data-[popup-open]:before:bg-gray-800 dark:data-[highlighted]:text-gray-950 dark:data-[highlighted]:before:bg-white dark:data-[highlighted]:data-[popup-open]:before:bg-white dark:data-[disabled]:text-gray-400";

export default function ExampleContextMenu() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className="flex h-[12rem] w-[15rem] items-center justify-center rounded-none border border-gray-950 bg-white text-gray-950 select-none font-normal focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 dark:border-white dark:bg-gray-950 dark:text-white">
        Right click here
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className="outline-hidden">
          <ContextMenu.Popup className={popupClass}>
            <ContextMenu.Item className={itemClass}>Add to Library</ContextMenu.Item>

            <ContextMenu.SubmenuRoot>
              <ContextMenu.SubmenuTrigger className={submenuTriggerClass}>
                Add to Playlist <ChevronRightIcon />
              </ContextMenu.SubmenuTrigger>
              <ContextMenu.Portal>
                <ContextMenu.Positioner className="outline-hidden" alignOffset={-4} sideOffset={-4}>
                  <ContextMenu.Popup className={popupClass}>
                    <ContextMenu.Item className={itemClass}>Get Up!</ContextMenu.Item>
                    <ContextMenu.Item className={itemClass}>Inside Out</ContextMenu.Item>
                    <ContextMenu.Item className={itemClass}>Night Beats</ContextMenu.Item>
                    <ContextMenu.Separator className="mx-1 my-1 h-px bg-gray-950 dark:bg-white" />
                    <ContextMenu.Item className={itemClass}>New playlist…</ContextMenu.Item>
                  </ContextMenu.Popup>
                </ContextMenu.Positioner>
              </ContextMenu.Portal>
            </ContextMenu.SubmenuRoot>

            <ContextMenu.Separator className="mx-1 my-1 h-px bg-gray-950 dark:bg-white" />

            <ContextMenu.Item className={itemClass}>Play Next</ContextMenu.Item>
            <ContextMenu.Item className={itemClass}>Play Last</ContextMenu.Item>
            <ContextMenu.Separator className="mx-1 my-1 h-px bg-gray-950 dark:bg-white" />
            <ContextMenu.Item className={itemClass}>Favorite</ContextMenu.Item>
            <ContextMenu.Item className={itemClass}>Share</ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function ChevronRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M3.5 9L7.5 5L3.5 1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
