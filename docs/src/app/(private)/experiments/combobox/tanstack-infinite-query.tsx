'use client';
import * as React from 'react';
import {
  InfiniteData,
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { useTimeout } from '@base-ui/utils/useTimeout';
import styles from '../../../(docs)/react/components/autocomplete/demos/async/css-modules/index.module.css';
import {
  movies as allMovies,
  Movie,
} from '../../../(docs)/react/components/combobox/demos/tanstack-query/movies';

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
      <ExampleAutocomplete />
    </QueryClientProvider>
  );
}

function ExampleAutocomplete() {
  const popupRef = React.useRef<HTMLDivElement>(null);
  const scrollTimeout = useTimeout();
  const queryClient = useQueryClient();

  const [searchValueUnwrapped, setSearchValue] = React.useState('');

  const { contains } = Autocomplete.useFilter();

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
      return 'Start typing to search movies…';
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

    return `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} found`;
  }

  const status = getStatus();

  return (
    <Autocomplete.Root
      items={searchResults}
      value={searchValueUnwrapped}
      onValueChange={(nextSearchValue) => {
        setSearchValue(nextSearchValue);
      }}
      itemToStringValue={(movie: Movie) => movie.title}
      filter={null}
      loopFocus={!isPending && !hasNextPage}
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
        }
      }}
      onItemHighlighted={(highlightedItem, eventDetails) => {
        if (highlightedItem && hasNextPage && eventDetails.reason === 'keyboard') {
          const highlightedIndex = searchResults.indexOf(highlightedItem);
          // fetch if the highlighted index is close to the end
          const shouldFetch = highlightedIndex >= searchResults.length - 1;

          if (shouldFetch) {
            fetchNextPage();
          }
        }
      }}
    >
      <label className={styles.Label}>
        Search movies by name
        <Autocomplete.Input placeholder="e.g. Aliens" className={styles.Input} />
      </label>

      <Autocomplete.Portal hidden={!status}>
        <Autocomplete.Positioner className={styles.Positioner} sideOffset={4} align="start">
          <Autocomplete.Popup
            ref={popupRef}
            className={styles.Popup}
            aria-busy={isPending || undefined}
          >
            <Autocomplete.Status>
              {status && <div className={styles.Status}>{status}</div>}
            </Autocomplete.Status>
            <Autocomplete.List>
              {(movie: Movie) => (
                <Autocomplete.Item
                  key={movie.id}
                  className={styles.Item}
                  value={movie}
                  render={
                    <a
                      href={`https://www.themoviedb.org/movie/${movie.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className={styles.MovieItem}>
                        <div className={styles.MovieName}>{movie.title}</div>
                        <div className={styles.MovieYear}>{movie.releaseDate.slice(0, 4)}</div>
                      </div>
                    </a>
                  }
                />
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
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
