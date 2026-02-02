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
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { useTimeout } from '@base-ui/utils/useTimeout';
import styles from '../../../(docs)/react/components/autocomplete/demos/async/css-modules/index.module.css';

interface Book {
  key: string;
  title: string;
  author?: string[];
  year?: number;
  cover?: number;
}

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
    queryKey: ['books', searchValue],
    queryFn: ({ pageParam, signal }) => searchBooks(searchValue, pageParam, 20, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !isEmpty,
  });

  const searchResults = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.books) ?? [];
  }, [data]);

  const error = queryError ? 'Failed to fetch books. Please try again.' : null;

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
      return 'Start typing to search books…';
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

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get('book');
    console.log('form submit', query);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Field.Root name="book">
        <Autocomplete.Root
          items={searchResults}
          value={searchValueUnwrapped}
          onValueChange={(nextSearchValue) => {
            setSearchValue(nextSearchValue);
          }}
          loopFocus={!isPending && !hasNextPage}
          submitOnItemClick={searchResults?.length === 0}
          itemToStringValue={(book: Book) => book.title}
          filter={null}
          onOpenChange={(open) => {
            // reset items to the first page when the popup closes
            if (!open) {
              queryClient.setQueryData(
                ['books', searchValue],
                (queryData: InfiniteData<SearchBooksResponse> | undefined) => {
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
              const shouldFetch = highlightedIndex >= searchResults.length - 6;

              if (shouldFetch) {
                fetchNextPage();
              }
            }
          }}
        >
          <Field.Label className={styles.Label}>
            Search openlibrary.org
            <Autocomplete.Input
              placeholder="e.g. “The Dark Tower” or “CS Lewis”"
              className={styles.Input}
            />
          </Field.Label>

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
                  {(book: Book) => (
                    <Autocomplete.Item
                      key={book.key}
                      className={styles.Item}
                      value={book}
                      render={
                        <a
                          href={`https://openlibrary.org${book.key}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <div className={styles.MovieItem}>
                            <div className={styles.MovieName}>{book.title}</div>
                            <div className={styles.MovieYear}>
                              {book.author?.[0] || 'Unknown author'}
                              {book.year && ` (${book.year})`}
                            </div>
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
      </Field.Root>
    </Form>
  );
}

interface SearchBooksResponse {
  books: Book[];
  nextPage: number | undefined;
  totalResults: number;
}

interface OpenLibraryResponse {
  start: number;
  num_found: number;
  docs: Array<{
    key: string;
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    cover_i?: number;
  }>;
}

async function searchBooks(
  query: string,
  page: number,
  pageSize: number = 20,
  signal?: AbortSignal,
): Promise<SearchBooksResponse> {
  // https://openlibrary.org/dev/docs/api/search
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('q', `title:${query} OR author:${query}`);
  url.searchParams.set('lang', 'en');
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(pageSize));
  url.searchParams.set('fields', 'key,title,author_name,first_publish_year,cover_i');

  const response = await fetch(url.toString(), { signal });

  if (!response.ok) {
    throw new Error('Failed to fetch books. Please try again.');
  }

  const data: OpenLibraryResponse = await response.json();

  const books: Book[] = data.docs.map((doc) => ({
    key: doc.key,
    title: doc.title,
    author: doc.author_name,
    year: doc.first_publish_year,
    cover: doc.cover_i,
  }));

  const hasMore = data.start + pageSize < data.num_found;

  return {
    books,
    nextPage: hasMore ? page + 1 : undefined,
    totalResults: data.num_found,
  };
}
