'use client';
import * as React from 'react';
import { FilterMenu } from '@base-ui/react/filter-menu';

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

export default function FilterMenuDemo() {
  const [sortBy, setSortBy] = React.useState('date');
  const [showDetails, setShowDetails] = React.useState(true);
  const [showSidebar, setShowSidebar] = React.useState(false);
  const [keepOffline, setKeepOffline] = React.useState(false);

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
                <FilterMenu.GroupLabel className={groupLabelClass}>File</FilterMenu.GroupLabel>
                <FilterMenu.Item className={itemClass}>New file</FilterMenu.Item>
                <FilterMenu.Item className={itemClass}>Open file</FilterMenu.Item>
                <FilterMenu.Item className={itemClass}>Save</FilterMenu.Item>
                <FilterMenu.Item className={itemClass}>Save as</FilterMenu.Item>
                <FilterMenu.Item className={itemClass}>Duplicate</FilterMenu.Item>
                <FilterMenu.Item className={itemClass}>Rename</FilterMenu.Item>
              </FilterMenu.Group>
              <FilterMenu.Group>
                <FilterMenu.GroupLabel className={groupLabelClass}>Organize</FilterMenu.GroupLabel>
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
                <FilterMenu.Item className={itemClass}>Download a copy</FilterMenu.Item>
                <FilterMenu.Item className={itemClass} keywords={['remove', 'trash']}>
                  Delete
                </FilterMenu.Item>
              </FilterMenu.Group>

              <FilterMenu.Separator className={separatorClass} />

              <FilterMenu.RadioGroup value={sortBy} onValueChange={setSortBy}>
                <FilterMenu.GroupLabel className={groupLabelClass}>Sort by</FilterMenu.GroupLabel>
                {[
                  ['date', 'Date modified'],
                  ['name', 'Name'],
                  ['size', 'Size'],
                ].map(([value, label]) => (
                  <FilterMenu.RadioItem key={value} className={choiceItemClass} value={value}>
                    <FilterMenu.RadioItemIndicator className="col-start-1">
                      <CheckIcon />
                    </FilterMenu.RadioItemIndicator>
                    <span>{label}</span>
                  </FilterMenu.RadioItem>
                ))}
              </FilterMenu.RadioGroup>

              <FilterMenu.Separator className={separatorClass} />

              <FilterMenu.Group>
                <FilterMenu.GroupLabel className={groupLabelClass}>View</FilterMenu.GroupLabel>
                <FilterMenu.CheckboxItem
                  className={choiceItemClass}
                  checked={showDetails}
                  onCheckedChange={setShowDetails}
                >
                  <FilterMenu.CheckboxItemIndicator className="col-start-1">
                    <CheckIcon />
                  </FilterMenu.CheckboxItemIndicator>
                  <span>Show details</span>
                </FilterMenu.CheckboxItem>
                <FilterMenu.CheckboxItem
                  className={choiceItemClass}
                  checked={showSidebar}
                  onCheckedChange={setShowSidebar}
                >
                  <FilterMenu.CheckboxItemIndicator className="col-start-1">
                    <CheckIcon />
                  </FilterMenu.CheckboxItemIndicator>
                  <span>Show sidebar</span>
                </FilterMenu.CheckboxItem>
                <FilterMenu.CheckboxItem
                  className={choiceItemClass}
                  checked={keepOffline}
                  onCheckedChange={setKeepOffline}
                >
                  <FilterMenu.CheckboxItemIndicator className="col-start-1">
                    <CheckIcon />
                  </FilterMenu.CheckboxItemIndicator>
                  <span>Keep available offline</span>
                </FilterMenu.CheckboxItem>
              </FilterMenu.Group>
            </FilterMenu.List>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.Root>
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
    <FilterMenu.SubmenuRoot>
      <FilterMenu.SubmenuTrigger className={submenuTriggerClass}>
        {props.label}
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
                aria-label={props.inputLabel}
                placeholder={props.placeholder}
              />
              <FilterMenu.Clear className={clearClass} aria-label="Clear filter">
                <ClearIcon />
              </FilterMenu.Clear>
            </div>
            <FilterMenu.Empty className={emptyClass}>{props.emptyText}</FilterMenu.Empty>
            <FilterMenu.List className={listClass}>
              {props.options.map((option) => (
                <FilterMenu.Item key={option} className={itemClass}>
                  {option}
                </FilterMenu.Item>
              ))}
            </FilterMenu.List>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.SubmenuRoot>
  );
}

const popupClass =
  'min-w-[max(14rem,var(--anchor-width))] origin-[var(--transform-origin)] overflow-hidden border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out outline-hidden data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none';
const inputContainerClass =
  'flex items-center border-b border-neutral-300 has-data-focus-visible:border-neutral-950 has-data-focus-visible:ring-1 has-data-focus-visible:ring-neutral-950 has-data-focus-visible:ring-inset dark:border-neutral-700 dark:has-data-focus-visible:border-white dark:has-data-focus-visible:ring-white';
const inputClass =
  'min-h-8 w-0 flex-1 bg-transparent px-2.5 text-sm leading-none outline-hidden placeholder:text-neutral-500 dark:placeholder:text-neutral-400';
const clearClass = 'flex size-8 items-center justify-center bg-transparent';
const emptyClass = 'p-3 text-sm text-neutral-500 dark:text-neutral-400';
const listClass =
  'max-h-[min(22rem,var(--available-height))] overflow-y-auto py-1 outline-hidden scroll-py-1 empty:py-0';
const itemBaseClass =
  "cursor-default py-2 pl-4 text-sm leading-4 outline-hidden select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-neutral-950 data-highlighted:before:content-[''] dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white";
const itemClass = `${itemBaseClass} flex pr-8`;
const choiceItemClass = `${itemBaseClass} grid grid-cols-[1rem_1fr] items-center gap-2 pr-8 pl-2.5`;
const submenuTriggerClass = `${itemBaseClass} flex items-center justify-between gap-4 pr-2 data-popup-open:relative data-popup-open:z-0 data-popup-open:before:absolute data-popup-open:before:inset-x-1 data-popup-open:before:inset-y-0 data-popup-open:before:z-[-1] data-popup-open:before:bg-neutral-100 data-popup-open:before:content-[''] data-highlighted:data-popup-open:before:bg-neutral-950 dark:data-popup-open:before:bg-neutral-800 dark:data-highlighted:data-popup-open:before:bg-white`;
const groupLabelClass =
  'pt-1.5 pr-8 pb-1 pl-4 text-xs leading-4 font-medium text-neutral-500 select-none dark:text-neutral-400';
const separatorClass = 'mx-1 my-1 h-px bg-neutral-300 dark:bg-neutral-700';

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
