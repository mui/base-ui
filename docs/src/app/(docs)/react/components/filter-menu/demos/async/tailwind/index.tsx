'use client';
import * as React from 'react';
import { FilterMenu } from '@base-ui/react/filter-menu';

export default function ExampleAsyncFilterMenu() {
  const [assignee, setAssignee] = React.useState<Person | null>(null);
  const [searchValue, setSearchValue] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Person[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [isPending, startTransition] = React.useTransition();

  const abortControllerRef = React.useRef<AbortController | null>(null);

  function runSearch(query: string) {
    const controller = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = controller;

    startTransition(async () => {
      setError(null);

      const result = await searchPeople(query);
      if (controller.signal.aborted) {
        return;
      }

      startTransition(() => {
        setSearchResults(result.people);
        setError(result.error);
      });
    });
  }

  const status = isPending ? (
    <React.Fragment>
      <span
        className="inline-block size-3 animate-spin rounded-full border border-current border-r-transparent rtl:border-r-current rtl:border-l-transparent"
        aria-hidden
      />
      Searching…
    </React.Fragment>
  ) : (
    error
  );

  return (
    <FilterMenu.Root
      filter={null}
      inputValue={searchValue}
      onInputValueChange={(value, details) => {
        if (details.reason !== 'popup-close') {
          setSearchValue(value);
          runSearch(value);
        }
      }}
      onOpenChange={(open) => {
        if (open) {
          runSearch('');
        }
      }}
      onOpenChangeComplete={(open) => {
        if (!open) {
          setSearchValue('');
        }
      }}
    >
      <FilterMenu.Trigger className="flex h-8 items-center justify-center gap-1.5 rounded-none border border-neutral-950 bg-white px-3 text-sm leading-none font-normal whitespace-nowrap text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 data-pressed:bg-neutral-100 focus-visible:-outline-offset-1 focus-visible:outline-2 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-pressed:bg-neutral-800 dark:focus-visible:outline-white">
        {assignee ? `Assigned to ${assignee.name}` : 'Assign to…'}
      </FilterMenu.Trigger>
      <FilterMenu.Portal>
        <FilterMenu.Positioner className="outline-0" sideOffset={8} align="start">
          <FilterMenu.Popup
            className="min-w-[max(16rem,var(--anchor-width))] origin-[var(--transform-origin)] overflow-hidden border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out outline-hidden data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none"
            aria-busy={isPending || undefined}
          >
            <div className="flex items-center border-b border-neutral-300 has-data-highlighted:border-neutral-950 has-data-highlighted:ring-1 has-data-highlighted:ring-neutral-950 has-data-highlighted:ring-inset dark:border-neutral-700 dark:has-data-highlighted:border-white dark:has-data-highlighted:ring-white">
              <FilterMenu.Input
                className="min-h-8 w-0 flex-1 bg-transparent px-2.5 text-sm leading-none outline-hidden placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
                aria-label="Search people"
                placeholder="e.g. Ada"
              />
            </div>
            <FilterMenu.Status className="flex items-center gap-2 p-3 text-sm leading-4 text-neutral-500 dark:text-neutral-400">
              {status}
            </FilterMenu.Status>
            {!isPending && !error && (
              <FilterMenu.Empty className="p-3 text-sm text-neutral-500 dark:text-neutral-400">
                No people found.
              </FilterMenu.Empty>
            )}
            <FilterMenu.List className="max-h-[min(22rem,var(--available-height))] overflow-y-auto py-1 outline-hidden scroll-py-1 empty:py-0">
              {searchResults.map((person) => (
                <FilterMenu.Item
                  key={person.id}
                  className="group flex cursor-default items-baseline gap-4 px-4 py-2 text-sm leading-4 outline-hidden select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-neutral-950 data-highlighted:before:content-[''] dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white"
                  onClick={() => setAssignee(person)}
                >
                  {person.name}
                  <span className="ms-auto text-xs text-neutral-500 group-data-highlighted:text-neutral-300 dark:text-neutral-400 dark:group-data-highlighted:text-neutral-700">
                    {person.role}
                  </span>
                </FilterMenu.Item>
              ))}
            </FilterMenu.List>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.Root>
  );
}

async function searchPeople(query: string): Promise<{ people: Person[]; error: string | null }> {
  // Simulate network delay
  await new Promise((resolve) => {
    setTimeout(resolve, Math.random() * 400 + 100);
  });

  // Simulate occasional network errors (1% chance)
  if (Math.random() < 0.01 || query === 'will_error') {
    return {
      people: [],
      error: 'Failed to fetch people. Please try again.',
    };
  }

  const loweredQuery = query.trim().toLowerCase();
  const people = team.filter((person) =>
    `${person.name} ${person.role}`.toLowerCase().includes(loweredQuery),
  );

  return {
    people,
    error: null,
  };
}

interface Person {
  id: string;
  name: string;
  role: string;
}

const team: Person[] = [
  { id: '1', name: 'Ada Sitompul', role: 'Design' },
  { id: '2', name: 'Bruno Costa', role: 'Engineering' },
  { id: '3', name: 'Chidi Okafor', role: 'Engineering' },
  { id: '4', name: 'Dana Whitfield', role: 'Support' },
  { id: '5', name: 'Emil Novak', role: 'Engineering' },
  { id: '6', name: 'Farah Haddad', role: 'Product' },
  { id: '7', name: 'Grete Lindqvist', role: 'Design' },
  { id: '8', name: 'Hiro Tanaka', role: 'Engineering' },
  { id: '9', name: 'Imani Njoroge', role: 'Product' },
  { id: '10', name: 'Jonas Berg', role: 'Support' },
  { id: '11', name: 'Katya Morozova', role: 'Engineering' },
  { id: '12', name: 'Luca Moretti', role: 'Design' },
  { id: '13', name: 'Maren Vogel', role: 'Product' },
  { id: '14', name: 'Nadia Rahal', role: 'Engineering' },
  { id: '15', name: 'Oskar Jensen', role: 'Support' },
];
