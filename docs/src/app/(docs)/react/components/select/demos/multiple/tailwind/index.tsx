'use client';
import * as React from 'react';
import { Select } from '@base-ui/react/select';

const languages = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  csharp: 'C#',
  php: 'PHP',
  cpp: 'C++',
  rust: 'Rust',
  go: 'Go',
  swift: 'Swift',
};

type Language = keyof typeof languages;

const values = Object.keys(languages) as Language[];

function renderValue(value: Language[]) {
  if (value.length === 0) {
    return 'Select languages';
  }

  const firstLanguage = languages[value[0]];
  const additionalLanguages = value.length > 1 ? ` (+${value.length - 1} more)` : '';
  return firstLanguage + additionalLanguages;
}

export default function MultiSelectExample() {
  return (
    <div className="flex flex-col items-start gap-1">
      <Select.Root multiple defaultValue={['javascript', 'typescript']}>
        <Select.Label className="cursor-default text-sm leading-5 font-bold text-gray-950 dark:text-white">
          Languages
        </Select.Label>
        <Select.Trigger className="flex h-8 min-w-[14rem] items-center justify-between gap-3 pl-3 pr-2 text-sm leading-5 border border-gray-950 dark:border-white bg-white dark:bg-gray-950 text-gray-950 dark:text-white select-none hover:not-data-disabled:bg-gray-100 dark:hover:not-data-disabled:bg-gray-800 active:not-data-disabled:bg-gray-200 dark:active:not-data-disabled:bg-gray-700 data-disabled:border-gray-500 data-disabled:text-gray-500 disabled:border-gray-500 disabled:text-gray-500 dark:data-disabled:border-gray-400 dark:data-disabled:text-gray-400 data-[popup-open]:bg-gray-100 dark:data-[popup-open]:bg-gray-800 font-normal focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800">
          <Select.Value className="data-[placeholder]:text-gray-600 dark:data-[placeholder]:text-gray-400">
            {renderValue}
          </Select.Value>
          <Select.Icon className="flex">
            <ChevronUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className="outline-hidden z-10"
            sideOffset={8}
            alignItemWithTrigger={false}
          >
            <Select.Popup className="group max-h-[var(--available-height)] min-w-[var(--anchor-width)] origin-[var(--transform-origin)] bg-clip-padding overflow-y-auto border border-gray-950 bg-white py-1 text-gray-950 outline-hidden shadow-[0.25rem_0.25rem_0_rgb(0_0_0/12%)] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none dark:border-white dark:bg-gray-950 dark:text-white dark:shadow-none">
              {values.map((value) => (
                <Select.Item
                  key={value}
                  value={value}
                  className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-1.5 pr-4 pl-2.5 text-sm leading-5 outline-hidden select-none scroll-my-1 group-data-[side=none]:pr-12 [@media(hover:hover)]:[&[data-highlighted]]:bg-gray-950 [@media(hover:hover)]:[&[data-highlighted]]:text-white dark:[@media(hover:hover)]:[&[data-highlighted]]:bg-white dark:[@media(hover:hover)]:[&[data-highlighted]]:text-gray-950"
                >
                  <Select.ItemIndicator className="col-start-1">
                    <CheckIcon className="size-3" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="col-start-2">{languages[value]}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
