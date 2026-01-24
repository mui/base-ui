'use client';
import * as React from 'react';
import {
  InfiniteData,
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Check, ChevronDown, X } from 'lucide-react';
import { Combobox } from '@base-ui/react/combobox';
import { useTimeout } from '@base-ui/utils/useTimeout';
import styles from '../../../(docs)/react/components/combobox/demos/async-single/css-modules/index.module.css';
import {
  movies as allMovies,
  Movie,
} from '../../../(docs)/react/components/combobox/demos/tanstack-query/movies';

const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={appQueryClient}>
      <ExampleCombobox />
    </QueryClientProvider>
  );
}

function ExampleCombobox() {
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
      onOpenChange={(open) => {
        // reset items to the first page when the popup closes
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
          // fetch if the highlighted index is close to the end
          const shouldFetch = highlightedIndex >= items.length - 1;

          if (shouldFetch) {
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

  // Simulate occasional network errors (1% chance)
  if (Math.random() < 0.01 || query === 'will_error') {
    throw new Error('Failed to fetch movies. Please try again.');
  }

  const allMatches = allMovies.filter((movie) => {
    return filter(movie.title, query);
  });

  // Calculate pagination
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const movies = allMatches.slice(startIndex, endIndex);
  const hasMore = endIndex < allMatches.length;

  return {
    movies,
    nextPage: hasMore ? page + 1 : undefined,
    totalResults: allMatches.length,
  };
}
