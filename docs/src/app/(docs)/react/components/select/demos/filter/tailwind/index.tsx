'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';

const countries = [
  { value: 'ar', label: 'Argentina' },
  { value: 'au', label: 'Australia' },
  { value: 'br', label: 'Brazil' },
  { value: 'ca', label: 'Canada' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'in', label: 'India' },
  { value: 'jp', label: 'Japan' },
  { value: 'mx', label: 'Mexico' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'es', label: 'Spain' },
  { value: 'gb', label: 'United Kingdom' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'es', label: 'Spanish' },
];

function renderLanguages(value: string[]) {
  if (value.length === 0) {
    return 'Select languages';
  }

  const first = languages.find((language) => language.value === value[0])?.label;
  const additional = value.length > 1 ? ` (+${value.length - 1} more)` : '';
  return first + additional;
}

export default function ExampleSelectFilter() {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col items-start gap-1">
        <Select.FilterProvider>
          <Select.Root items={countries}>
            <Select.Label className={labelClass}>Country</Select.Label>
            <Select.Trigger className={triggerClass}>
              <Select.Value className={valueClass} placeholder="Select country" />
              <Select.Icon>
                <CaretUpDownIcon />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner className="z-10 outline-hidden select-none" sideOffset={4}>
                <FilterablePopup
                  items={countries}
                  inputLabel="Filter countries"
                  placeholder="e.g. Japan"
                  emptyText="No countries found."
                />
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Select.FilterProvider>
      </div>

      <div className="flex flex-col items-start gap-1">
        <Select.FilterProvider>
          <Select.Root multiple items={languages} defaultValue={['en']}>
            <Select.Label className={labelClass}>Languages</Select.Label>
            <Select.Trigger className={triggerClass}>
              <Select.Value className={valueClass}>{renderLanguages}</Select.Value>
              <Select.Icon>
                <CaretUpDownIcon />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner className="z-10 outline-hidden select-none" sideOffset={4}>
                <FilterablePopup
                  items={languages}
                  inputLabel="Filter languages"
                  placeholder="e.g. French"
                  emptyText="No languages found."
                />
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Select.FilterProvider>
      </div>
    </div>
  );
}

interface FilterablePopupProps {
  items: readonly { value: string; label: string }[];
  inputLabel: string;
  placeholder: string;
  emptyText: string;
}

function FilterablePopup(props: FilterablePopupProps) {
  return (
    <Select.Popup className={popupClass}>
      <div className={inputContainerClass}>
        <Select.FilterInput
          className={inputClass}
          aria-label={props.inputLabel}
          placeholder={props.placeholder}
        />
        <Select.FilterClear className={clearClass} aria-label="Clear filter">
          <ClearIcon />
        </Select.FilterClear>
      </div>
      <Select.FilterEmpty className={emptyClass}>{props.emptyText}</Select.FilterEmpty>
      <Select.ScrollUpArrow className={`${scrollArrowClass} top-0`}>
        <CaretUpIcon />
      </Select.ScrollUpArrow>
      <Select.List className={listClass}>
        {props.items.map(({ label, value }) => (
          <Select.Item key={value} value={value} className={itemClass}>
            <Select.ItemIndicator className="col-start-1">
              <CheckIcon />
            </Select.ItemIndicator>
            <Select.ItemText className="col-start-2">{label}</Select.ItemText>
          </Select.Item>
        ))}
      </Select.List>
      <Select.ScrollDownArrow className={`${scrollArrowClass} bottom-0`}>
        <CaretDownIcon />
      </Select.ScrollDownArrow>
    </Select.Popup>
  );
}

const labelClass = 'cursor-default text-sm font-bold text-neutral-950 dark:text-white';
const valueClass = 'data-placeholder:text-neutral-500 dark:data-placeholder:text-neutral-400';
const triggerClass =
  'flex h-8 min-w-48 items-center justify-between gap-3 pl-2 pr-1 text-sm leading-none whitespace-nowrap border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white select-none hover:not-data-disabled:bg-neutral-100 dark:hover:not-data-disabled:bg-neutral-800 active:not-data-disabled:bg-neutral-200 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 disabled:border-neutral-500 disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 data-pressed:bg-neutral-100 dark:data-pressed:bg-neutral-800 font-normal focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';
const popupClass =
  'min-w-[var(--anchor-width)] origin-[var(--transform-origin)] bg-clip-padding border border-neutral-950 bg-white text-neutral-950 outline-hidden shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none';
const inputContainerClass =
  'flex items-center border-b border-neutral-300 has-data-highlighted:border-neutral-950 has-data-highlighted:ring-1 has-data-highlighted:ring-neutral-950 has-data-highlighted:ring-inset dark:border-neutral-700 dark:has-data-highlighted:border-white dark:has-data-highlighted:ring-white';
const inputClass =
  'min-h-8 w-0 flex-1 bg-transparent px-2.5 text-sm leading-none outline-hidden placeholder:text-neutral-500 dark:placeholder:text-neutral-400';
const clearClass =
  'flex size-8 items-center justify-center bg-transparent outline-hidden focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';
const emptyClass = 'p-3 text-sm text-neutral-500 dark:text-neutral-400';
const listClass =
  'relative max-h-[min(16rem,calc(var(--available-height)-2.0625rem))] overflow-y-auto py-1 scroll-py-6 empty:py-0';
const itemClass =
  'grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 py-1.5 pr-4 pl-2.5 text-sm outline-hidden select-none data-highlighted:bg-neutral-950 data-highlighted:text-white dark:data-highlighted:bg-white dark:data-highlighted:text-neutral-950';
const scrollArrowClass =
  "z-[1] flex h-4 w-full cursor-default items-center justify-center bg-white text-center text-xs before:absolute before:left-0 before:h-full before:w-full before:content-[''] dark:bg-neutral-950";

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
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

function CaretUpIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M12 10H4l4-4.5z" />
    </svg>
  );
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
