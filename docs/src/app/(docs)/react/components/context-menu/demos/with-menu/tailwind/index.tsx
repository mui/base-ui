'use client';
import * as React from 'react';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Menu } from '@base-ui/react/menu';

export default function ContextMenuWithMenuDemo() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className="group relative w-full max-w-64 overflow-hidden border border-neutral-950 bg-white text-left text-neutral-950 select-none dark:border-white dark:bg-neutral-950 dark:text-white">
        <img
          width="512"
          height="288"
          className="h-36 w-full object-cover"
          src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=512&h=288"
          alt=""
        />
        <div className="p-2">
          <p className="text-sm leading-5">Station Hofplein</p>
          <p className="text-xs leading-4 text-neutral-500 dark:text-neutral-400">JPG, 2.4 MB</p>
        </div>

        <Menu.Root>
          <Menu.Trigger
            aria-label="Image actions"
            className="absolute top-2 right-2 flex size-8 items-center justify-center border border-neutral-950 bg-white text-neutral-950 opacity-0 select-none group-hover:opacity-100 data-pressed:opacity-100 any-pointer-coarse:opacity-100 hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 data-popup-open:bg-neutral-100 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-popup-open:bg-neutral-800 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
          >
            <MoreVertIcon />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner align="end" sideOffset={8} className="outline-hidden">
              <Menu.Popup className={popupClass}>
                <SharedMenuItems />
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Positioner className="outline-hidden">
          <ContextMenu.Popup className={popupClass}>
            <SharedMenuItems type="context-menu" />
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

const popupClass =
  'origin-[var(--transform-origin)] border border-neutral-950 bg-white py-1 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 outline-hidden transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none';
const itemClass =
  "flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-neutral-950 data-highlighted:before:content-[''] data-disabled:text-neutral-500 dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white dark:data-disabled:text-neutral-400";

const actions = ['Preview', 'Download', 'Copy link', 'Rename'];

function SharedMenuItems({ type = 'menu' }: { type?: 'menu' | 'context-menu' }) {
  const Item = type === 'context-menu' ? ContextMenu.Item : Menu.Item;
  const Separator = type === 'context-menu' ? ContextMenu.Separator : Menu.Separator;
  return (
    <React.Fragment>
      {actions.map((action) => (
        <Item key={action} className={itemClass}>
          {action}
        </Item>
      ))}
      <Separator className="mx-1 my-1 h-px bg-neutral-950 dark:bg-white" />
      <Item className={`${itemClass} text-red-700`}>Delete</Item>
    </React.Fragment>
  );
}

function MoreVertIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M9.5 13c0 .8284-.67157 1.5-1.5 1.5s-1.5-.6716-1.5-1.5.67157-1.5 1.5-1.5 1.5.6716 1.5 1.5m0-5c0 .82843-.67157 1.5-1.5 1.5S6.5 8.82843 6.5 8 7.17157 6.5 8 6.5s1.5.67157 1.5 1.5m0-5c0 .82843-.67157 1.5-1.5 1.5S6.5 3.82843 6.5 3 7.17157 1.5 8 1.5s1.5.67157 1.5 1.5" />
    </svg>
  );
}
