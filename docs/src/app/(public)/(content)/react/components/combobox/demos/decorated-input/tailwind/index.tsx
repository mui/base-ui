import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';

export default function ExampleDecoratedInput() {
  const id = React.useId();
  const [inputValue, setInputValue] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const isTyping = inputValue.trim() !== '';

  return (
    <Combobox.Root
      items={people}
      itemToStringLabel={(person) => person.name}
      inputValue={inputValue}
      onInputValueChange={(next, eventDetails) => {
        if (eventDetails.reason === 'item-press') {
          // Keep the input blank to display the custom selected value text.
          setInputValue('');
          containerRef.current?.focus();
          return;
        }

        setInputValue(next);
      }}
    >
      <div className="flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
        <label htmlFor={id}>Assignee</label>
        <Combobox.Value>
          {(person: Person | null) => (
            <div
              className="relative group flex w-[16rem] min-[500px]:w-[20rem] rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800"
              tabIndex={-1}
              ref={containerRef}
            >
              <Combobox.Input
                id={id}
                placeholder={person ? '' : 'Select person'}
                aria-label={person && !isTyping ? person.name : undefined}
                className="h-10 w-full rounded-md font-normal border border-gray-200 pl-9 pr-16 text-base text-gray-900 bg-[canvas] focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 cursor-default focus:cursor-text group-[&:hover:not(:focus-within)]:bg-gray-100 group-[&:focus:hover]:bg-gray-100"
                onBlur={() => {
                  setInputValue('');
                }}
              />
              <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center gap-2 text-base font-medium text-gray-900">
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-[2.5rem] text-[0.6rem] font-semibold ${
                    person ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {person ? initials(person.name) : <PersonIcon className="size-[0.9rem]" />}
                </span>
                {person && !isTyping && (
                  <span className="truncate font-medium text-gray-900 group-[&:not(:focus):focus-within]:font-normal group-[&:not(:focus):focus-within]:text-gray-500">
                    {person.name}
                  </span>
                )}
              </div>

              <div className="box-border absolute right-2 bottom-0 flex h-10 items-center justify-center gap-1 rounded border-none p-0 text-gray-600">
                <Combobox.Clear
                  className="box-border flex h-10 w-6 items-center justify-center rounded bg-transparent p-0 text-gray-600 border-none"
                  aria-label="Clear selection"
                >
                  <ClearIcon className="size-4" />
                </Combobox.Clear>
                <Combobox.Trigger
                  className="box-border flex h-10 w-6 items-center justify-center rounded bg-transparent p-0 text-gray-600 border-none"
                  aria-label="Open popup"
                >
                  <ChevronDownIcon className="size-4" />
                </Combobox.Trigger>
              </div>
            </div>
          )}
        </Combobox.Value>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className="outline-none" sideOffset={4}>
          <Combobox.Popup className="w-[var(--anchor-width)] max-h-[min(var(--available-height),23.5rem)] max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-y-auto scroll-pt-2 scroll-pb-2 overscroll-contain rounded-md bg-[canvas] py-2 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
            <Combobox.Empty className="px-4 py-2.5 text-[0.925rem] leading-4 text-gray-600 empty:m-0 empty:p-0">
              No people found.
            </Combobox.Empty>
            <Combobox.List>
              {(person: Person) => (
                <Combobox.Item
                  key={person.id}
                  value={person}
                  className="box-border grid cursor-default select-none grid-cols-[1.25rem_1fr_0.75rem] items-center gap-2 py-2 pr-5 pl-4 text-base leading-4 outline-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-100"
                >
                  <Combobox.Icon className="col-start-1 inline-flex size-5 items-center justify-center rounded-full bg-blue-800 text-[0.6rem] font-semibold text-white">
                    {initials(person.name)}
                  </Combobox.Icon>
                  <div className="col-start-2">{person.name}</div>
                  <Combobox.ItemIndicator className="col-start-3">
                    <CheckIcon className="size-3" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ClearIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" aria-hidden {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function PersonIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden width="12" height="12" {...props}>
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
    </svg>
  );
}

interface Person {
  id: string;
  name: string;
}

const people: Person[] = [
  { id: '1', name: 'Ada Lovelace' },
  { id: '2', name: 'Alan Turing' },
  { id: '3', name: 'Grace Hopper' },
  { id: '4', name: 'Katherine Johnson' },
  { id: '5', name: 'Donald Knuth' },
  { id: '6', name: 'Edsger Dijkstra' },
  { id: '7', name: 'Barbara Liskov' },
  { id: '8', name: 'Dennis Ritchie' },
  { id: '9', name: 'Guido van Rossum' },
  { id: '10', name: 'Margaret Hamilton' },
  { id: '11', name: 'Tim Berners-Lee' },
  { id: '12', name: 'Radia Perlman' },
  { id: '13', name: 'Bjarne Stroustrup' },
  { id: '14', name: 'James Gosling' },
  { id: '15', name: 'Ken Thompson' },
  { id: '16', name: 'Niklaus Wirth' },
  { id: '17', name: 'Adele Goldberg' },
  { id: '18', name: 'Hedy Lamarr' },
  { id: '19', name: 'Marie Curie' },
  { id: '20', name: 'Rosalind Franklin' },
  { id: '21', name: 'Jane Goodall' },
  { id: '22', name: 'Vera Rubin' },
  { id: '23', name: 'Sally Ride' },
  { id: '24', name: 'Mae Jemison' },
  { id: '25', name: 'Neil Armstrong' },
  { id: '26', name: 'David Attenborough' },
  { id: '27', name: 'Carl Sagan' },
  { id: '28', name: 'Mary Jackson' },
  { id: '29', name: 'Dorothy Vaughan' },
  { id: '30', name: 'Ellen Ochoa' },
];
