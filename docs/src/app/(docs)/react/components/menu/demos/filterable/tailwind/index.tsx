'use client';
import * as React from 'react';
import { FilterMenu } from '@base-ui/react/filter-menu';

const actions = [
  'New file',
  'Open file',
  'Save',
  'Save as',
  'Duplicate',
  'Rename',
  'Move to folder',
  'Download',
  'Delete',
];

const sharingOptions = ['Email', 'Messages', 'AirDrop', 'Copy link'];

export default function FilterMenuDemo() {
  return (
    <FilterMenu.Root>
      <FilterMenu.Trigger className="flex h-8 items-center justify-center gap-1.5 rounded-none border border-neutral-950 bg-white pr-2 pl-3 text-sm leading-none font-normal whitespace-nowrap text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 data-pressed:bg-neutral-100 data-disabled:border-neutral-500 data-disabled:text-neutral-500 focus-visible:-outline-offset-1 focus-visible:outline-2 focus-visible:outline-neutral-950 disabled:border-neutral-500 disabled:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-pressed:bg-neutral-800 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 dark:focus-visible:outline-white">
        Actions <CaretDownIcon />
      </FilterMenu.Trigger>
      <FilterMenu.Portal>
        <FilterMenu.Positioner className="outline-hidden" sideOffset={8} align="start">
          <FilterMenu.Popup className={popupClass}>
            <div className={inputContainerClass}>
              <FilterMenu.Input
                className={inputClass}
                aria-label="Filter actions"
                placeholder="e.g. Save"
              />
              <FilterMenu.Clear className={clearClass} aria-label="Clear filter">
                <ClearIcon />
              </FilterMenu.Clear>
            </div>
            <FilterMenu.Empty className={emptyClass}>No actions found.</FilterMenu.Empty>
            <FilterMenu.List className={listClass}>
              <FilterMenu.Group>
                <FilterMenu.GroupLabel className="py-2 pr-8 pl-[2.125rem] text-sm leading-4 text-neutral-500 select-none dark:text-neutral-400">
                  File
                </FilterMenu.GroupLabel>
                {actions.slice(0, 4).map((action) => (
                  <FilterMenu.Item key={action} className={itemClass}>
                    {action}
                  </FilterMenu.Item>
                ))}
              </FilterMenu.Group>
              <FilterMenu.SubmenuRoot>
                <FilterMenu.SubmenuTrigger className={submenuTriggerClass}>
                  Share
                  <CaretRightIcon />
                </FilterMenu.SubmenuTrigger>
                <FilterMenu.Portal>
                  <FilterMenu.Positioner
                    className="outline-hidden"
                    sideOffset={getSubmenuOffset}
                    alignOffset={getSubmenuOffset}
                  >
                    <FilterMenu.Popup className={popupClass}>
                      <div className={inputContainerClass}>
                        <FilterMenu.Input
                          className={inputClass}
                          aria-label="Filter sharing options"
                          placeholder="e.g. Email"
                        />
                        <FilterMenu.Clear className={clearClass} aria-label="Clear filter">
                          <ClearIcon />
                        </FilterMenu.Clear>
                      </div>
                      <FilterMenu.Empty className={emptyClass}>
                        No sharing options found.
                      </FilterMenu.Empty>
                      <FilterMenu.List className={listClass}>
                        {sharingOptions.map((option) => (
                          <FilterMenu.Item key={option} className={itemClass}>
                            {option}
                          </FilterMenu.Item>
                        ))}
                      </FilterMenu.List>
                    </FilterMenu.Popup>
                  </FilterMenu.Positioner>
                </FilterMenu.Portal>
              </FilterMenu.SubmenuRoot>
              <FilterMenu.Group>
                <FilterMenu.GroupLabel className="py-2 pr-8 pl-[2.125rem] text-sm leading-4 text-neutral-500 select-none dark:text-neutral-400">
                  Manage
                </FilterMenu.GroupLabel>
                {actions.slice(4).map((action) => (
                  <FilterMenu.Item
                    key={action}
                    className={itemClass}
                    keywords={action === 'Delete' ? ['remove', 'trash'] : undefined}
                  >
                    {action}
                  </FilterMenu.Item>
                ))}
              </FilterMenu.Group>
            </FilterMenu.List>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.Root>
  );
}

const popupClass =
  'min-w-[max(12rem,var(--anchor-width))] origin-[var(--transform-origin)] overflow-hidden border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out outline-hidden data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none';
const inputContainerClass =
  'flex items-center border-b border-neutral-300 has-data-focus-visible:border-neutral-950 has-data-focus-visible:ring-1 has-data-focus-visible:ring-neutral-950 has-data-focus-visible:ring-inset dark:border-neutral-700 dark:has-data-focus-visible:border-white dark:has-data-focus-visible:ring-white';
const inputClass =
  'min-h-8 w-0 flex-1 bg-transparent px-2.5 text-sm leading-none outline-hidden placeholder:text-neutral-500 dark:placeholder:text-neutral-400';
const clearClass = 'flex size-8 items-center justify-center bg-transparent';
const emptyClass = 'p-3 text-sm text-neutral-500 dark:text-neutral-400';
const listClass =
  'max-h-[min(16rem,var(--available-height))] overflow-y-auto py-1 scroll-py-1 empty:py-0';
const itemBaseClass =
  "flex cursor-default py-2 pl-4 text-sm leading-4 outline-hidden select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-neutral-950 data-highlighted:before:content-[''] dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white";
const itemClass = `${itemBaseClass} pr-8`;
const submenuTriggerClass = `${itemBaseClass} items-center justify-between gap-4 pr-2 data-popup-open:relative data-popup-open:z-0 data-popup-open:before:absolute data-popup-open:before:inset-x-1 data-popup-open:before:inset-y-0 data-popup-open:before:z-[-1] data-popup-open:before:bg-neutral-100 data-popup-open:before:content-[''] data-highlighted:data-popup-open:before:bg-neutral-950 dark:data-popup-open:before:bg-neutral-800 dark:data-highlighted:data-popup-open:before:bg-white`;

function getSubmenuOffset({ side }: { side: FilterMenu.Positioner.Props['side'] }) {
  return side === 'top' || side === 'bottom' ? 4 : -4;
}

function CaretDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 6H4l4 4.5z" />
    </svg>
  );
}

function ClearIcon(props: React.ComponentProps<'svg'>) {
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
      <path d="m3.5 3.5 9 9m0-9-9 9" />
    </svg>
  );
}

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}
