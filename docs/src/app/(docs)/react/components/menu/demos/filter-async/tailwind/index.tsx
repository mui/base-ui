'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';

export default function ExampleAsyncMenuFilter() {
  const [searchValue, setSearchValue] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResults>(SUGGESTIONS);
  const [error, setError] = React.useState<string | null>(null);

  const [isPending, startTransition] = React.useTransition();

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const { contains } = Menu.useFilter();

  function runSearch(query: string) {
    const controller = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = controller;

    startTransition(async () => {
      setError(null);

      const result = await searchIndex(query, contains);
      if (controller.signal.aborted) {
        return;
      }

      startTransition(() => {
        setSearchResults(result.results);
        setError(result.error);
      });
    });
  }

  let status: React.ReactNode = null;
  if (error) {
    status = error;
  } else if (searchResults.total > searchResults.shown) {
    status = `Showing top ${searchResults.shown} of ${searchResults.total} results`;
  }

  return (
    <Menu.FilterRoot
      filter={null}
      inputValue={searchValue}
      onInputValueChange={(value, details) => {
        if (details.reason === 'popup-close') {
          return;
        }

        setSearchValue(value);

        // The suggestions are local, so an emptied query restores them without a request.
        if (value.trim() === '') {
          abortControllerRef.current?.abort();
          setSearchResults(SUGGESTIONS);
          setError(null);
          return;
        }

        runSearch(value);
      }}
      onOpenChangeComplete={(open) => {
        if (!open) {
          abortControllerRef.current?.abort();
          setSearchValue('');
          setSearchResults(SUGGESTIONS);
          setError(null);
        }
      }}
    >
      <Menu.Trigger className="flex h-8 items-center justify-center gap-1.5 rounded-none border border-neutral-950 bg-white px-3 text-sm leading-none font-normal whitespace-nowrap text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 data-pressed:bg-neutral-100 focus-visible:-outline-offset-1 focus-visible:outline-2 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-pressed:bg-neutral-800 dark:focus-visible:outline-white">
        Search…
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="outline-0" sideOffset={8} align="start">
          <Menu.Popup
            className="min-w-[max(16rem,var(--anchor-width))] origin-[var(--transform-origin)] overflow-hidden border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out outline-hidden data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none"
            aria-busy={isPending || undefined}
          >
            <div className="flex items-center border-b border-neutral-300 has-data-highlighted:border-neutral-950 has-data-highlighted:ring-1 has-data-highlighted:ring-neutral-950 has-data-highlighted:ring-inset dark:border-neutral-700 dark:has-data-highlighted:border-white dark:has-data-highlighted:ring-white">
              <Menu.FilterInput
                className="min-h-8 w-0 flex-1 bg-transparent px-2.5 text-sm leading-none outline-hidden placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
                aria-label="Search apps, documents, and settings"
                placeholder="e.g. Sales Report Q3"
              />
              <span className="flex size-8 items-center justify-center text-neutral-500 dark:text-neutral-400">
                {isPending && (
                  <span
                    className="inline-block size-3 animate-spin rounded-full border border-current border-r-transparent rtl:border-r-current rtl:border-l-transparent"
                    aria-hidden
                  />
                )}
              </span>
            </div>
            {!isPending && !error && (
              <Menu.FilterEmpty className="p-3 text-sm text-neutral-500 dark:text-neutral-400">
                No results found.
              </Menu.FilterEmpty>
            )}
            <Menu.FilterList className="max-h-[min(22rem,var(--available-height))] overflow-y-auto py-1 outline-hidden scroll-py-1 empty:py-0">
              {searchResults.groups.map((group) => (
                <Menu.Group key={group.label}>
                  <Menu.GroupLabel className="pt-1.5 pr-8 pb-1 pl-4 text-xs leading-4 font-medium text-neutral-500 select-none dark:text-neutral-400">
                    {group.label}
                  </Menu.GroupLabel>
                  {group.items.map((item) => (
                    <Menu.Item
                      key={item}
                      className="flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-neutral-950 data-highlighted:before:content-[''] dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white"
                    >
                      {item}
                    </Menu.Item>
                  ))}
                </Menu.Group>
              ))}
            </Menu.FilterList>
            <Menu.FilterStatus className="border-t border-neutral-300 px-3 py-2 text-xs leading-4 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              {status}
            </Menu.FilterStatus>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.FilterRoot>
  );
}

const RESULTS_PER_GROUP = 6;

async function searchIndex(
  query: string,
  filter: (itemText: string, query: string) => boolean,
): Promise<{ results: SearchResults; error: string | null }> {
  // Simulate network delay
  await new Promise((resolve) => {
    setTimeout(resolve, Math.random() * 400 + 100);
  });

  // Simulate occasional network errors (1% chance)
  if (Math.random() < 0.01 || query === 'will_error') {
    return {
      results: EMPTY_RESULTS,
      error: 'Failed to search. Please try again.',
    };
  }

  const trimmedQuery = query.trim();

  const groups: ResultGroup[] = [];
  let total = 0;
  let shown = 0;

  for (const source of sources) {
    const matches = source.items.filter((item) => filter(item, trimmedQuery));
    total += matches.length;

    if (matches.length > 0) {
      const topMatches = matches.slice(0, RESULTS_PER_GROUP);
      shown += topMatches.length;
      groups.push({ label: source.label, items: topMatches });
    }
  }

  return {
    results: { groups, total, shown },
    error: null,
  };
}

interface ResultGroup {
  label: string;
  items: string[];
}

interface SearchResults {
  groups: ResultGroup[];
  total: number;
  shown: number;
}

const EMPTY_RESULTS: SearchResults = { groups: [], total: 0, shown: 0 };

const applications = [
  'Calendar',
  'Mail',
  'Notes',
  'Music',
  'Photos',
  'Terminal',
  'Maps',
  'Messages',
  'Reminders',
  'Weather',
  'Calculator',
  'Contacts',
  'Books',
  'Podcasts',
  'News',
];

const settingsPanes = [
  'Wi-Fi',
  'Bluetooth',
  'Display',
  'Sound',
  'Keyboard',
  'Trackpad',
  'Battery',
  'Storage',
  'Network',
  'Privacy',
  'Notifications',
  'Wallpaper',
];

// A generated index of 1,280 document names stands in for a server-side source.
const documents: string[] = [];
for (const team of [
  'Sales',
  'Marketing',
  'Finance',
  'Design',
  'Platform',
  'Support',
  'Growth',
  'Legal',
]) {
  for (const kind of [
    'Report',
    'Forecast',
    'Roadmap',
    'Notes',
    'Summary',
    'Review',
    'Budget',
    'Plan',
  ]) {
    for (const quarter of ['Q1', 'Q2', 'Q3', 'Q4']) {
      for (const year of [2022, 2023, 2024, 2025, 2026]) {
        documents.push(`${team} ${kind} ${quarter} ${year}`);
      }
    }
  }
}

const sources: ResultGroup[] = [
  { label: 'Applications', items: applications },
  { label: 'Documents', items: documents },
  { label: 'System Settings', items: settingsPanes },
];

const suggestedApplications = applications.slice(0, 8);
const SUGGESTIONS: SearchResults = {
  groups: [{ label: 'Suggestions', items: suggestedApplications }],
  total: suggestedApplications.length,
  shown: suggestedApplications.length,
};
