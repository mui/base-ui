'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from './index.module.css';

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
      <Menu.Trigger className={styles.Trigger}>Search…</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8} align="start">
          <Menu.Popup className={styles.Popup} aria-busy={isPending || undefined}>
            <div className={styles.InputContainer}>
              <Menu.FilterInput
                className={styles.Input}
                aria-label="Search apps, documents, and settings"
                placeholder="e.g. Sales Report Q3"
              />
              <span className={styles.SpinnerSlot}>
                {isPending && <span className={styles.Spinner} aria-hidden />}
              </span>
            </div>
            {!isPending && !error && (
              <Menu.FilterEmpty className={styles.Empty}>No results found.</Menu.FilterEmpty>
            )}
            <Menu.FilterList className={styles.List}>
              {searchResults.groups.map((group) => (
                <Menu.Group key={group.label}>
                  <Menu.GroupLabel className={styles.GroupLabel}>{group.label}</Menu.GroupLabel>
                  {group.items.map((item) => (
                    <Menu.Item key={item} className={styles.Item}>
                      {item}
                    </Menu.Item>
                  ))}
                </Menu.Group>
              ))}
            </Menu.FilterList>
            <Menu.FilterStatus className={styles.Status}>{status}</Menu.FilterStatus>
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
