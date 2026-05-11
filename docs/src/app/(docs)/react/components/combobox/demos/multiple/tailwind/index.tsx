'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';

export default function ExampleMultipleCombobox() {
  const id = React.useId();

  return (
    <Combobox.Root items={langs} multiple>
      <div className="max-w-md flex flex-col gap-1">
        <label
          className="flex flex-col gap-1 text-sm leading-5 font-bold text-neutral-950 dark:text-white"
          htmlFor={id}
        >
          Programming languages
        </label>
        <Combobox.InputGroup className="flex min-h-8 w-64 cursor-text flex-wrap items-center gap-0.5 border border-neutral-950 bg-white dark:bg-neutral-950 px-2 py-1 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-neutral-950 dark:focus-within:outline-white has-[button]:px-1 dark:border-white min-[32rem]:w-[22rem]">
          <Combobox.Chips className="flex w-full flex-wrap items-center gap-1">
            <Combobox.Value>
              {(value: ProgrammingLanguage[]) => (
                <React.Fragment>
                  {value.map((language) => (
                    <Combobox.Chip
                      key={language.id}
                      className="group flex min-h-[calc(1.5rem-2px)] cursor-default items-center gap-1 overflow-hidden bg-neutral-100 py-0 pr-[0.2rem] pl-[0.4rem] text-sm leading-none text-neutral-950 outline-none focus-within:bg-neutral-950 focus-within:text-white [@media(hover:hover)]:data-highlighted:bg-neutral-950 [@media(hover:hover)]:data-highlighted:text-white dark:bg-neutral-800 dark:text-white dark:focus-within:bg-white dark:focus-within:text-neutral-950 dark:[@media(hover:hover)]:data-highlighted:bg-white dark:[@media(hover:hover)]:data-highlighted:text-neutral-950"
                      aria-label={language.value}
                    >
                      {language.value}
                      <Combobox.ChipRemove
                        className="flex size-4 items-center justify-center border-0 bg-transparent p-0 text-inherit hover:bg-neutral-200 group-focus-within:hover:bg-neutral-700 dark:hover:bg-neutral-700 dark:group-focus-within:hover:bg-neutral-200"
                        aria-label={`Remove ${language.value}`}
                      >
                        <XIcon className="size-3" />
                      </Combobox.ChipRemove>
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input
                    id={id}
                    placeholder={value.length > 0 ? '' : 'e.g. TypeScript'}
                    className="h-[calc(1.5rem-2px)] min-w-12 flex-1 border-0 bg-white p-0 text-sm dark:bg-neutral-950 leading-none font-normal text-neutral-950 outline-none dark:text-white"
                  />
                </React.Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </Combobox.InputGroup>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className="z-50 outline-none" sideOffset={4}>
          <Combobox.Popup className="w-[var(--anchor-width)] max-h-[min(var(--available-height),24rem)] max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-y-auto overscroll-contain border border-neutral-950 bg-white py-2 text-neutral-950 shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] transition-[opacity,transform] data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none">
            <Combobox.Empty>
              <div className="py-2 pr-4 pl-2 text-sm leading-4 text-neutral-500 dark:text-neutral-400">
                No languages found.
              </div>
            </Combobox.Empty>
            <Combobox.List>
              {(language: ProgrammingLanguage) => (
                <Combobox.Item
                  key={language.id}
                  className="grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 p-2 text-sm leading-4 outline-none select-none data-selected:relative data-selected:z-0 data-selected:text-neutral-950 data-selected:before:absolute data-selected:before:inset-0 data-selected:before:z-[-1] [@media(hover:hover)]:data-highlighted:relative [@media(hover:hover)]:data-highlighted:z-0 [@media(hover:hover)]:data-highlighted:text-white [@media(hover:hover)]:data-highlighted:before:absolute [@media(hover:hover)]:data-highlighted:before:inset-0 [@media(hover:hover)]:data-highlighted:before:z-[-1] [@media(hover:hover)]:data-highlighted:before:bg-neutral-950 dark:data-selected:text-white dark:[@media(hover:hover)]:data-highlighted:text-neutral-950 dark:[@media(hover:hover)]:data-highlighted:before:bg-white"
                  value={language}
                >
                  <Combobox.ItemIndicator className="col-start-1">
                    <CheckIcon className="size-3" />
                  </Combobox.ItemIndicator>
                  <span className="col-start-2">{language.value}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" {...props}>
      <path d="M20 6 9 17l-5-5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" {...props}>
      <path d="M18 6 6 18" vectorEffect="non-scaling-stroke" />
      <path d="m6 6 12 12" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

interface ProgrammingLanguage {
  id: string;
  value: string;
}

const langs: ProgrammingLanguage[] = [
  { id: 'js', value: 'JavaScript' },
  { id: 'ts', value: 'TypeScript' },
  { id: 'py', value: 'Python' },
  { id: 'java', value: 'Java' },
  { id: 'cpp', value: 'C++' },
  { id: 'cs', value: 'C#' },
  { id: 'php', value: 'PHP' },
  { id: 'ruby', value: 'Ruby' },
  { id: 'go', value: 'Go' },
  { id: 'rust', value: 'Rust' },
  { id: 'swift', value: 'Swift' },
];
