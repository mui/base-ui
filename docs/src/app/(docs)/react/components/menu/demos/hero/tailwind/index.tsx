import * as React from 'react';
import { Menu } from '@base-ui/react/menu';

const itemClass =
  "flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:bg-neutral-950 data-[highlighted]:before:content-[''] data-[disabled]:text-neutral-500 dark:data-[highlighted]:text-neutral-950 dark:data-[highlighted]:before:bg-white dark:data-[disabled]:text-neutral-400";

export default function ExampleMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger className="flex h-8 items-center justify-center gap-1.5 rounded-none border border-neutral-950 bg-white px-3 text-sm font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 data-[popup-open]:bg-neutral-100 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 dark:data-[popup-open]:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800">
        Song <ChevronDownIcon className="-mr-1" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="outline-hidden" sideOffset={8}>
          <Menu.Popup className="relative origin-[var(--transform-origin)] border border-neutral-950 bg-white py-1 text-neutral-950 outline-hidden [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:[filter:none]">
            <Menu.Arrow className="relative block w-3 h-1.5 overflow-clip data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:box-border before:w-[calc(6px*sqrt(2))] before:h-[calc(6px*sqrt(2))] before:bg-white dark:before:bg-neutral-950 before:border before:border-neutral-950 dark:before:border-white before:[transform:translate(-50%,50%)_rotate(45deg)]" />
            <Menu.Item className={itemClass}>Add to Library</Menu.Item>
            <Menu.Item className={itemClass}>Add to Playlist</Menu.Item>
            <Menu.Separator className="mx-1 my-1 h-px bg-neutral-950 dark:bg-white" />
            <Menu.Item className={itemClass}>Play Next</Menu.Item>
            <Menu.Item className={itemClass}>Play Last</Menu.Item>
            <Menu.Separator className="mx-1 my-1 h-px bg-neutral-950 dark:bg-white" />
            <Menu.Item className={itemClass}>Favorite</Menu.Item>
            <Menu.Item className={itemClass}>Share</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
