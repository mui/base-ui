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
        // fetch when 75% of the list has been scrolled
        const shouldFetch = scrollTop >= (scrollHeight - clientHeight) * 0.75;

        if (shouldFetch && hasNextPage && !isFetchingNextPage) {
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
          <span
            className="size-3 animate-spin rounded-full border border-current border-r-transparent rtl:border-r-current rtl:border-l-transparent"
            aria-hidden
          />
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
          if (highlightedIndex >= items.length - 6) {
            fetchNextPage();
          }
        }
      }}
    >
      <div className="relative flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
        <label htmlFor={id}>Find a movie</label>
        <div className="relative w-64 sm:w-80 has-[.combobox-clear]:[&>input]:pr-[calc(0.5rem+1.5rem*2)]">
          <Combobox.Input
            id={id}
            placeholder="e.g. Aliens"
            className="h-10 w-full rounded-md font-normal border border-gray-200 pl-3.5 pr-[calc(0.5rem+1.5rem)] text-base text-gray-900 bg-[canvas] focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
          />
          <div className="absolute right-2 bottom-0 flex h-10 items-center justify-center text-gray-600">
            <Combobox.Clear
              className="combobox-clear flex h-10 w-6 items-center justify-center rounded bg-transparent p-0"
              aria-label="Clear selection"
            >
              <ClearIcon className="size-4" />
            </Combobox.Clear>
            <Combobox.Trigger
              className="flex h-10 w-6 items-center justify-center rounded bg-transparent p-0"
              aria-label="Open popup"
            >
              <ChevronDownIcon className="size-4" />
            </Combobox.Trigger>
          </div>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner className="outline-none" sideOffset={4}>
          <Combobox.Popup
            ref={popupRef}
            className="w-[var(--anchor-width)] max-h-[min(var(--available-height),23rem)] max-w-[var(--available-width)] origin-[var(--transform-origin)] rounded-md bg-[canvas] text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 transition-[transform,opacity] data-[ending-style]:opacity-0 data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300 duration-100 overflow-y-auto scroll-py-2 overscroll-contain py-2"
            aria-busy={isPending || undefined}
          >
            <Combobox.Status className="flex items-center gap-2 py-1 pl-4 pr-5 text-sm leading-5 text-gray-600 empty:hidden">
              {getStatus()}
            </Combobox.Status>
            <Combobox.Empty className="text-sm leading-4 text-gray-600 py-2 px-4 empty:m-0 empty:p-0">
              {getEmptyMessage()}
            </Combobox.Empty>
            <Combobox.List>
              {(movie: Movie) => (
                <Combobox.Item
                  key={movie.id}
                  className="box-border outline-none cursor-default select-none py-2 px-4 pr-5 grid gap-2 items-start grid-cols-[0.75rem_1fr] text-base leading-[1.2rem] data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-900 data-[highlighted]:before:content-[''] data-[highlighted]:before:z-[-1] data-[highlighted]:before:absolute data-[highlighted]:before:inset-y-0 data-[highlighted]:before:inset-x-2 data-[highlighted]:before:rounded data-[highlighted]:before:bg-gray-100"
                  value={movie}
                >
                  <Combobox.ItemIndicator className="col-start-1 mt-1">
                    <CheckIcon className="block size-3" />
                  </Combobox.ItemIndicator>
                  <div className="col-start-2 flex flex-col gap-1">
                    <div className="text-[0.95rem] font-medium">{movie.title}</div>
                    <div className="flex flex-wrap gap-3 text-[0.8125rem] text-gray-600">
                      <span>{movie.releaseDate.slice(0, 4)}</span>
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
