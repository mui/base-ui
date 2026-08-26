'use client';
import * as React from 'react';
import { FilterMenu } from '@base-ui/react/filter-menu';
import styles from './index.module.css';

export default function ExampleAsyncFilterMenu() {
  const [searchValue, setSearchValue] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResults>(SUGGESTIONS);
  const [error, setError] = React.useState<string | null>(null);

  const [isPending, startTransition] = React.useTransition();

  const abortControllerRef = React.useRef<AbortController | null>(null);

  function runSearch(query: string) {
    const controller = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = controller;

    startTransition(async () => {
      setError(null);

      const result = await searchIndex(query);
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
    <FilterMenu.Root
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
      <FilterMenu.Trigger className={styles.Trigger}>Search…</FilterMenu.Trigger>
      <FilterMenu.Portal>
        <FilterMenu.Positioner className={styles.Positioner} sideOffset={8} align="start">
          <FilterMenu.Popup className={styles.Popup} aria-busy={isPending || undefined}>
            <div className={styles.InputContainer}>
              <FilterMenu.Input
                className={styles.Input}
                aria-label="Search apps, documents, and settings"
                placeholder="e.g. Sales Report Q3"
              />
              <span className={styles.SpinnerSlot}>
                {isPending && <span className={styles.Spinner} aria-hidden />}
              </span>
            </div>
            {!isPending && !error && (
              <FilterMenu.Empty className={styles.Empty}>No results found.</FilterMenu.Empty>
            )}
            <FilterMenu.List className={styles.List}>
              {searchResults.groups.map((group) => (
                <FilterMenu.Group key={group.label}>
                  <FilterMenu.GroupLabel className={styles.GroupLabel}>
                    {group.label}
                  </FilterMenu.GroupLabel>
                  {group.items.map((item) => (
                    <FilterMenu.Item key={item} className={styles.Item}>
                      {item}
                    </FilterMenu.Item>
                  ))}
                </FilterMenu.Group>
              ))}
            </FilterMenu.List>
            <FilterMenu.Status className={styles.Status}>{status}</FilterMenu.Status>
          </FilterMenu.Popup>
        </FilterMenu.Positioner>
      </FilterMenu.Portal>
    </FilterMenu.Root>
  );
}

const RESULTS_PER_GROUP = 6;

async function searchIndex(
  query: string,
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

  const loweredQuery = query.trim().toLowerCase();

  const groups: ResultGroup[] = [];
  let total = 0;
  let shown = 0;

  for (const source of sources) {
    const matches = source.items.filter((item) => item.toLowerCase().includes(loweredQuery));
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
