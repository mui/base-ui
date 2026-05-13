import * as React from 'react';
import { Menu } from '@base-ui/react/menu';

const itemClass =
  "flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-neutral-950 data-highlighted:before:content-[''] data-disabled:text-neutral-500 dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white dark:data-disabled:text-neutral-400";

export default function ExampleMenu() {
  return (
    <Menu.Root>
      <Menu.Trigger className="flex h-8 items-center justify-center gap-1.5 rounded-none border border-neutral-950 bg-white pl-3 pr-2 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 data-popup-open:bg-neutral-100 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 dark:data-popup-open:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white">
        Song <ChevronDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="outline-hidden" sideOffset={8}>
          <Menu.Popup className="relative origin-[var(--transform-origin)] border border-neutral-950 bg-white py-1 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 outline-hidden transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
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
    <svg
      width="12"
      height="12"
      viewBox="0 0 10 10"
      fill="none"
      strokeWidth="1"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
