'use client';
import * as React from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, X } from 'lucide-react';
import { Combobox } from '@base-ui/react/combobox';
import styles from '../../../(docs)/react/components/combobox/demos/async-single/css-modules/index.module.css';
import { MOVIES } from './data';

// Top ranked 4918 movies from TMDB
const allMovies = MOVIES.map((m) => ({
  id: m.id,
  title: m.title,
  overview: m.overview,
  releaseDate: m.release_date,
  posterPath: m.poster_path,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ExampleCombobox />
    </QueryClientProvider>
  );
}

function ExampleCombobox() {
  const id = React.useId();

  const [selectedValue, setSelectedValue] = React.useState<Movie | null>(null);
  const [searchValueUnwrapped, setSearchValue] = React.useState('');

  const { contains } = Combobox.useFilter();

  const searchValue = React.useDeferredValue(searchValueUnwrapped.trim());
  const isEmpty = searchValue === '';

  const {
    data: searchResults = [],
    isPending,
    error: queryError,
  } = useQuery({
    queryKey: ['movies', searchValue, contains],
    queryFn: ({ signal }) => searchMovies(searchValue, contains, signal),
    enabled: !isEmpty,
    select: (data) => data.slice(0, 30),
  });

  const error = queryError ? 'Failed to fetch movies. Please try again.' : null;

  const items = React.useMemo(() => {
    if (!selectedValue || searchResults.some((movie) => movie.id === selectedValue.id)) {
      return searchResults;
    }

    return [...searchResults, selectedValue];
  }, [searchResults, selectedValue]);

  function getStatus() {
    if (isEmpty) {
      return selectedValue ? null : 'Start typing to search movies…';
    }

    if (isPending) {
      return (
        <React.Fragment>
          <span className={styles.Spinner} aria-hidden />
          Searching…
        </React.Fragment>
      );
    }

    if (error) {
      return error;
    }

    if (searchResults.length === 0) {
      return `No matches for "${searchValue}".`;
    }

    return null;
  }

  function getEmptyMessage() {
    if (isEmpty || isPending || searchResults.length > 0 || error) {
      return null;
    }

    return 'Try a different search term.';
  }

  return (
    <Combobox.Root
      items={items}
      itemToStringLabel={(movie: Movie) => movie.title}
      filter={null}
      onValueChange={(nextSelectedValue) => {
        setSelectedValue(nextSelectedValue);
        setSearchValue('');
      }}
      onInputValueChange={(nextSearchValue, { reason }) => {
        if (reason !== 'item-press') {
          setSearchValue(nextSearchValue);
        }
      }}
    >
      <div className={styles.Label}>
        <label htmlFor={id}>Find a movie</label>
        <div className={styles.InputWrapper}>
          <Combobox.Input id={id} placeholder="e.g. Aliens" className={styles.Input} />
          <div className={styles.ActionButtons}>
            <Combobox.Clear className={styles.Clear} aria-label="Clear selection">
              <X className="size-4" />
            </Combobox.Clear>
            <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
              <ChevronDown className="size-4" />
            </Combobox.Trigger>
          </div>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup className={styles.Popup} aria-busy={isPending || undefined}>
            <Combobox.Status className={styles.Status}>{getStatus()}</Combobox.Status>
            <Combobox.Empty className={styles.Empty}>{getEmptyMessage()}</Combobox.Empty>
            <Combobox.List>
              {(movie: Movie) => (
                <Combobox.Item key={movie.id} className={styles.Item} value={movie}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <Check className="size-4" />
                  </Combobox.ItemIndicator>
                  <div className={styles.ItemText}>
                    <div className={styles.ItemTitle}>{movie.title}</div>
                    <div className={styles.ItemSubtitle}>
                      <span className={styles.ItemUsername}>{movie.releaseDate}</span>
                    </div>
                  </div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

interface Movie {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  posterPath: string | null;
}

async function searchMovies(
  query: string,
  filter: (item: string, query: string) => boolean,
  signal?: AbortSignal,
): Promise<Movie[]> {
  // Simulate network delay
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, Math.random() * 500 + 100);

    signal?.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new Error('Request cancelled'));
    });
  });

  if (signal?.aborted) {
    throw new Error('Request cancelled');
  }

  // Simulate occasional network errors (1% chance)
  if (Math.random() < 0.01 || query === 'will_error') {
    throw new Error('Failed to fetch movies. Please try again.');
  }

  const movies = allMovies.filter((movie) => {
    return filter(movie.title, query);
  });

  return movies;
}
