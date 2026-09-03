'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';

export default function ExampleMenuFilter() {
  return (
    <Menu.FilterRoot>
      <Menu.Trigger className="flex h-8 items-center justify-center gap-1.5 rounded-none border border-neutral-950 bg-white pr-2 pl-3 text-sm leading-none font-normal whitespace-nowrap text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 data-pressed:bg-neutral-100 data-disabled:border-neutral-500 data-disabled:text-neutral-500 focus-visible:-outline-offset-1 focus-visible:outline-2 focus-visible:outline-neutral-950 disabled:border-neutral-500 disabled:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-pressed:bg-neutral-800 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 dark:focus-visible:outline-white">
        Actions <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="outline-hidden" sideOffset={8} align="start">
          <Menu.Popup className={popupClass}>
            <div className={inputContainerClass}>
              <Menu.FilterInput
                className={inputClass}
                aria-label="Filter actions"
                placeholder="e.g. Save"
              />
              <Menu.FilterClear className={clearClass} aria-label="Clear filter">
                <ClearIcon />
              </Menu.FilterClear>
            </div>
            <Menu.FilterEmpty className={emptyClass}>No actions found.</Menu.FilterEmpty>
            <Menu.FilterList className={listClass}>
              <Menu.Group data-filter-section>
                <Menu.GroupLabel className={groupLabelClass}>File</Menu.GroupLabel>
                <Menu.Item className={itemClass}>New file</Menu.Item>
                <Menu.Item className={itemClass}>Open file</Menu.Item>
                <Menu.Item className={itemClass}>Save</Menu.Item>
                <Menu.Item className={itemClass}>Save as</Menu.Item>
                <Menu.Item className={itemClass}>Duplicate</Menu.Item>
                <Menu.Item className={itemClass}>Rename</Menu.Item>
              </Menu.Group>
              <Menu.Group data-filter-section>
                <Menu.GroupLabel className={groupLabelClass}>Organize</Menu.GroupLabel>
                <FilterableSubmenu
                  label="Move to folder"
                  inputLabel="Filter folders"
                  placeholder="e.g. Projects"
                  emptyText="No folders found."
                  options={folderOptions}
                />
                <FilterableSubmenu
                  label="Share"
                  inputLabel="Filter sharing options"
                  placeholder="e.g. Email"
                  emptyText="No sharing options found."
                  options={sharingOptions}
                />
                <FilterableSubmenu
                  label="Export"
                  inputLabel="Filter export formats"
                  placeholder="e.g. PDF"
                  emptyText="No export formats found."
                  options={exportOptions}
                />
                <Menu.Item className={itemClass}>Download a copy</Menu.Item>
                <Menu.Item className={itemClass} keywords={['remove', 'trash']}>
                  Delete
                </Menu.Item>
              </Menu.Group>

              <Menu.RadioGroup data-filter-section defaultValue="date">
                <Menu.Separator data-filter-separator className={separatorClass} />
                <Menu.GroupLabel className={groupLabelClass}>Sort by</Menu.GroupLabel>
                {[
                  ['date', 'Date modified'],
                  ['name', 'Name'],
                  ['size', 'Size'],
                ].map(([value, label]) => (
                  <Menu.RadioItem key={value} className={choiceItemClass} value={value}>
                    <Menu.RadioItemIndicator className="col-start-1">
                      <CheckIcon />
                    </Menu.RadioItemIndicator>
                    <span className="col-start-2 min-w-0">{label}</span>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>

              <Menu.Group data-filter-section>
                <Menu.Separator data-filter-separator className={separatorClass} />
                <Menu.GroupLabel className={groupLabelClass}>View</Menu.GroupLabel>
                <Menu.CheckboxItem className={choiceItemClass} defaultChecked>
                  <Menu.CheckboxItemIndicator className="col-start-1">
                    <CheckIcon />
                  </Menu.CheckboxItemIndicator>
                  <span className="col-start-2 min-w-0">Show details</span>
                </Menu.CheckboxItem>
                <Menu.CheckboxItem className={choiceItemClass}>
                  <Menu.CheckboxItemIndicator className="col-start-1">
                    <CheckIcon />
                  </Menu.CheckboxItemIndicator>
                  <span className="col-start-2 min-w-0">Show sidebar</span>
                </Menu.CheckboxItem>
                <Menu.CheckboxItem className={choiceItemClass}>
                  <Menu.CheckboxItemIndicator className="col-start-1">
                    <CheckIcon />
                  </Menu.CheckboxItemIndicator>
                  <span className="col-start-2 min-w-0">Keep available offline</span>
                </Menu.CheckboxItem>
              </Menu.Group>
            </Menu.FilterList>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.FilterRoot>
  );
}

interface FilterableSubmenuProps {
  label: string;
  inputLabel: string;
  placeholder: string;
  emptyText: string;
  options: readonly string[];
}

function FilterableSubmenu(props: FilterableSubmenuProps) {
  return (
    <Menu.FilterSubmenuRoot>
      <Menu.SubmenuTrigger className={submenuTriggerClass}>
        {props.label}
        <CaretRightIcon />
      </Menu.SubmenuTrigger>
      <Menu.Portal>
        <Menu.Positioner
          className="outline-hidden"
          sideOffset={getSubmenuOffset}
          alignOffset={getSubmenuOffset}
        >
          <Menu.Popup className={popupClass}>
            <div className={inputContainerClass}>
              <Menu.FilterInput
                className={inputClass}
                aria-label={props.inputLabel}
                placeholder={props.placeholder}
              />
              <Menu.FilterClear className={clearClass} aria-label="Clear filter">
                <ClearIcon />
              </Menu.FilterClear>
            </div>
            <Menu.FilterEmpty className={emptyClass}>{props.emptyText}</Menu.FilterEmpty>
            <Menu.FilterList className={submenuListClass}>
              {props.options.map((option) => (
                <Menu.Item key={option} className={itemClass}>
                  {option}
                </Menu.Item>
              ))}
            </Menu.FilterList>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.FilterSubmenuRoot>
  );
}

const popupClass =
  'min-w-[max(14rem,var(--anchor-width))] origin-[var(--transform-origin)] overflow-hidden border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out outline-hidden data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none';
const inputContainerClass =
  'flex items-center border-b border-neutral-300 has-data-highlighted:border-neutral-950 has-data-highlighted:ring-1 has-data-highlighted:ring-neutral-950 has-data-highlighted:ring-inset dark:border-neutral-700 dark:has-data-highlighted:border-white dark:has-data-highlighted:ring-white';
const inputClass =
  'min-h-8 w-0 flex-1 bg-transparent px-2.5 text-sm leading-none outline-hidden placeholder:text-neutral-500 dark:placeholder:text-neutral-400';
const clearClass = 'flex size-8 items-center justify-center bg-transparent';
const emptyClass = 'p-3 text-sm text-neutral-500 dark:text-neutral-400';
// Filtered-out groups stay mounted with the `hidden` attribute, so `empty:` never applies.
const listBaseClass =
  'overflow-y-auto py-1 outline-hidden scroll-py-1 not-has-[>:not([hidden])]:py-0';
const listClass = `${listBaseClass} max-h-[min(22rem,var(--available-height))] [&>[data-filter-section]:not([hidden])~[data-filter-section]:not([hidden])>[data-filter-separator]]:block`;
const submenuListClass = `${listBaseClass} max-h-[min(28rem,var(--available-height))]`;
const itemBaseClass =
  "cursor-default py-2 pl-4 text-sm leading-4 outline-hidden select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-neutral-950 data-highlighted:before:content-[''] dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white";
const itemClass = `${itemBaseClass} flex pr-8`;
const choiceItemClass = `${itemBaseClass} grid grid-cols-[1rem_1fr] items-center gap-2 pr-8 pl-2.5`;
const submenuTriggerClass = `${itemBaseClass} flex items-center justify-between gap-4 pr-2 data-popup-open:relative data-popup-open:z-0 data-popup-open:before:absolute data-popup-open:before:inset-x-1 data-popup-open:before:inset-y-0 data-popup-open:before:z-[-1] data-popup-open:before:bg-neutral-100 data-popup-open:before:content-[''] data-highlighted:data-popup-open:before:bg-neutral-950 dark:data-popup-open:before:bg-neutral-800 dark:data-highlighted:data-popup-open:before:bg-white`;
const groupLabelClass =
  'pt-1.5 pr-8 pb-1 pl-4 text-xs leading-4 font-medium text-neutral-500 select-none dark:text-neutral-400';
const separatorClass = 'mx-1 my-1 hidden h-px bg-neutral-300 dark:bg-neutral-700';

function getSubmenuOffset({ side }: { side: Menu.Positioner.Props['side'] }) {
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

const sharingOptions = [
  'Email',
  'Messages',
  'AirDrop',
  'Copy link',
  'Invite collaborators',
  'Publish to web',
  'Send a copy',
];

const folderOptions = [
  'Desktop',
  'Documents',
  'Downloads',
  'Projects',
  'Archive',
  'Shared',
  'Trash',
];

const exportOptions = [
  'PDF document',
  'Word document',
  'Plain text',
  'Rich text',
  'Markdown',
  'HTML page',
  'Image',
];
