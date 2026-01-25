'use client';
import * as React from 'react';
import {
  InfiniteData,
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Combobox } from '@base-ui/react/combobox';
import { useTimeout } from '@base-ui/utils/useTimeout';
import styles from './index.module.css';
import { movies, type Movie } from '../movies';

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <ExampleTanstackQueryCombobox />
    </QueryClientProvider>
  );
}

function ExampleTanstackQueryCombobox() {
  const id = React.useId();
  const popupRef = React.useRef<HTMLDivElement>(null);
  const scrollTimeout = useTimeout();
  const queryClient = useQueryClient();

  const [selectedValue, setSelectedValue] = React.useState<Movie | null>(null);
  const [searchValueUnwrapped, setSearchValue] = React.useState('');

  const { contains } = Combobox.useFilter();

  const searchValue = React.useDeferredValue(searchValueUnwrapped.trim());
  const isEmpty = searchValue === '';

  const {
    data,
    isPending,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['movies', searchValue, contains],
    queryFn: ({ pageParam, signal }) => searchMovies(searchValue, contains, pageParam, 10, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !isEmpty,
  });

  const searchResults = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.movies) ?? [];
  }, [data]);

  const error = queryError ? 'Failed to fetch movies. Please try again.' : null;

  const items = React.useMemo(() => {
    if (!selectedValue || searchResults.some((movie) => movie.id === selectedValue.id)) {
      return searchResults;
    }

    return [...searchResults, selectedValue];
  }, [searchResults, selectedValue]);

  React.useEffect(() => {
    const popupEl = popupRef.current;
    if (!popupEl) {
      return undefined;
    }

    let isThrottled = false;

    const handleScroll = () => {
      if (isThrottled) {
        return;
      }

      isThrottled = true;
      scrollTimeout.start(150, () => {
        isThrottled = false;

        const { scrollTop, scrollHeight, clientHeight } = popupEl;
        const scrolledToBottom = scrollTop + clientHeight >= scrollHeight;

        if (scrolledToBottom && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
    };

    popupEl.addEventListener('scroll', handleScroll);

    return () => {
      popupEl.removeEventListener('scroll', handleScroll);
      scrollTimeout.clear();
    };
  }, [scrollTimeout, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
      loopFocus={!hasNextPage && !isPending}
      onOpenChange={(open) => {
        // Reset items to the first page when the popup closes
        if (!open) {
          queryClient.setQueryData(
            ['movies', searchValue, contains],
            (queryData: InfiniteData<SearchMoviesResponse> | undefined) => {
              if (!queryData) {
                return queryData;
              }
              return {
                pages: queryData.pages.slice(0, 1),
                pageParams: queryData.pageParams.slice(0, 1),
              };
            },
          );
          setSearchValue('');
        }
      }}
      onValueChange={setSelectedValue}
      onInputValueChange={(nextSearchValue, { reason }) => {
        if (reason !== 'item-press') {
          setSearchValue(nextSearchValue);
        }
      }}
      onItemHighlighted={(highlightedItem, eventDetails) => {
        if (highlightedItem && hasNextPage && eventDetails.reason === 'keyboard') {
          const highlightedIndex = items.indexOf(highlightedItem);
          // Fetch if the highlighted index is close to the end
          if (highlightedIndex >= items.length - 1) {
            fetchNextPage();
          }
        }
      }}
    >
      <div className={styles.Label}>
        <label htmlFor={id}>Find a movie</label>
        <div className={styles.InputWrapper}>
          <Combobox.Input id={id} placeholder="e.g. Aliens" className={styles.Input} />
          <div className={styles.ActionButtons}>
            <Combobox.Clear className={styles.Clear} aria-label="Clear selection">
              <ClearIcon className={styles.ClearIcon} />
            </Combobox.Clear>
            <Combobox.Trigger className={styles.Trigger} aria-label="Open popup">
              <ChevronDownIcon className={styles.TriggerIcon} />
            </Combobox.Trigger>
          </div>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
          <Combobox.Popup
            ref={popupRef}
            className={styles.Popup}
            aria-busy={isPending || undefined}
          >
            <Combobox.Status className={styles.Status}>{getStatus()}</Combobox.Status>
            <Combobox.Empty className={styles.Empty}>{getEmptyMessage()}</Combobox.Empty>
            <Combobox.List>
              {(movie: Movie) => (
                <Combobox.Item key={movie.id} className={styles.Item} value={movie}>
                  <Combobox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon className={styles.ItemIndicatorIcon} />
                  </Combobox.ItemIndicator>
                  <div className={styles.ItemText}>
                    <div className={styles.ItemTitle}>{movie.title}</div>
                    <div className={styles.ItemSubtitle}>
                      <span className={styles.ItemYear}>{movie.releaseDate.slice(0, 4)}</span>
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

interface SearchMoviesResponse {
  movies: Movie[];
  nextPage: number | undefined;
  totalResults: number;
}

async function searchMovies(
  query: string,
  filter: (item: string, query: string) => boolean,
  page: number,
  pageSize: number = 10,
  signal?: AbortSignal,
): Promise<SearchMoviesResponse> {
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

  const allMatches = movies.filter((movie) => {
    return filter(movie.title, query);
  });

  // Calculate pagination
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const result = allMatches.slice(startIndex, endIndex);
  const hasMore = endIndex < allMatches.length;

  return {
    movies: result,
    nextPage: hasMore ? page + 1 : undefined,
    totalResults: allMatches.length,
  };
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
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
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
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
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
