'use client';
import * as React from 'react';
import NextLink from 'next/link';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Drawer } from '@base-ui/react/drawer';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useSearch } from '@mui/internal-docs-infra/useSearch';
import type {
  SearchResult,
  SearchResults,
  Sitemap,
} from '@mui/internal-docs-infra/useSearch/types';
import { useGoogleAnalytics } from 'docs/src/blocks/GoogleAnalyticsProvider';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { stringToUrl } from './QuickNav/rehypeSlug.mjs';

const sitemapPromise: () => Promise<{ sitemap?: Sitemap }> = () => import('../app/sitemap');
const showPrivatePages = process.env.SHOW_PRIVATE_PAGES === 'true';

// Semver pattern to detect version headings (e.g., v1.0.0, v1.0.0-rc.0).
// Matches the search slug behavior used by the desktop search dialog.
const SEMVER_PATTERN =
  /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

interface MobileNavDrawerProps extends Omit<Drawer.Root.Props, 'children' | 'handle'> {
  children?: React.ReactNode;
  focusMobileSearchOnOpenRef: React.RefObject<boolean>;
  handle: Drawer.Handle<unknown>;
}

export function MobileNavDrawer({
  children,
  focusMobileSearchOnOpenRef,
  handle,
  onOpenChange,
  ...props
}: MobileNavDrawerProps) {
  const [searchValue, setSearchValue] = React.useState('');
  const ga = useGoogleAnalytics();
  const searchQueryRef = React.useRef('');
  const resultCountRef = React.useRef(0);
  const attemptRef = React.useRef(0);
  const selectedResultRef = React.useRef<SearchResult | null>(null);
  const lastTrackedQueryRef = React.useRef('');
  const queryDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    return () => {
      if (queryDebounceRef.current) {
        clearTimeout(queryDebounceRef.current);
      }
    };
  }, []);

  const handleOpenDrawer = React.useCallback(() => {
    searchQueryRef.current = '';
    resultCountRef.current = 0;
    attemptRef.current = 0;
    selectedResultRef.current = null;
    lastTrackedQueryRef.current = '';
    if (queryDebounceRef.current) {
      clearTimeout(queryDebounceRef.current);
      queryDebounceRef.current = null;
    }
    ga?.trackEvent({ category: 'search', action: 'open' });
  }, [ga]);

  const handleCloseDrawer = React.useCallback(() => {
    if (queryDebounceRef.current) {
      clearTimeout(queryDebounceRef.current);
      queryDebounceRef.current = null;
    }

    if (searchQueryRef.current) {
      const selected = selectedResultRef.current;
      ga?.trackEvent({
        category: 'search',
        action: selected ? 'select' : 'dismiss',
        label: searchQueryRef.current,
        params: {
          search_term: searchQueryRef.current,
          result_count: resultCountRef.current,
          attempt: attemptRef.current,
          ...(selected
            ? {
                selected_result: selected.title || selected.slug,
                selected_type: selected.type || '',
              }
            : { failed: searchQueryRef.current }),
        },
      });
      lastTrackedQueryRef.current = searchQueryRef.current;
    }

    setSearchValue('');
  }, [ga]);

  const handleResultCountChange = React.useCallback((resultCount: number) => {
    resultCountRef.current = resultCount;
  }, []);

  const handleSearchValueChange = React.useCallback(
    (value: string) => {
      if (queryDebounceRef.current) {
        clearTimeout(queryDebounceRef.current);
        queryDebounceRef.current = null;
      }

      const previousLength = searchQueryRef.current?.length ?? 0;
      searchQueryRef.current = value;
      if (value) {
        if (previousLength === 0 && value.length > 0) {
          attemptRef.current += 1;
        }

        queryDebounceRef.current = setTimeout(() => {
          if (searchQueryRef.current && searchQueryRef.current !== lastTrackedQueryRef.current) {
            ga?.trackEvent({
              category: 'search',
              action: 'query',
              label: searchQueryRef.current,
              params: {
                search_term: searchQueryRef.current,
                result_count: resultCountRef.current,
                attempt: attemptRef.current,
              },
            });
            lastTrackedQueryRef.current = searchQueryRef.current;
          }
        }, 1500);
      }
    },
    [ga],
  );

  const handleResultSelect = React.useCallback((result: SearchResult | null) => {
    selectedResultRef.current = result;
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean, eventDetails: Drawer.Root.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails);

      if (nextOpen) {
        handleOpenDrawer();
      } else {
        handleCloseDrawer();
      }
    },
    [handleCloseDrawer, handleOpenDrawer, onOpenChange],
  );

  return (
    <Drawer.Root swipeDirection="down" {...props} handle={handle} onOpenChange={handleOpenChange}>
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop className="MobileNavBackdrop" />
          <Drawer.Viewport className="MobileNavViewport">
            <Drawer.Popup
              ref={popupRef}
              className="MobileNavPopup"
              initialFocus={() =>
                focusMobileSearchOnOpenRef.current ? inputRef.current : popupRef.current
              }
            >
              <Drawer.Title className="bui-sr-only">Docs navigation</Drawer.Title>
              <MobileNavPopupImpl
                handle={handle}
                inputRef={inputRef}
                searchValue={searchValue}
                onResultCountChange={handleResultCountChange}
                onResultSelect={handleResultSelect}
                onSearchValueChange={handleSearchValueChange}
                setSearchValue={setSearchValue}
              >
                {children}
              </MobileNavPopupImpl>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  );
}

function slugifyWithParentContext(text: string, parentTitles?: string[]): string {
  const slug = stringToUrl(text);

  if (parentTitles?.length && SEMVER_PATTERN.test(parentTitles[0])) {
    return `${parentTitles[0]}-${slug}`;
  }

  return slug;
}

function normalizeGroup(group: string) {
  return group.replace(/\s+Pages$/, '').replace(/^React\s+/, '');
}

interface MobileNavPopupImplProps extends React.PropsWithChildren {
  handle: Drawer.Handle<unknown>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchValue: string;
  onResultCountChange: (resultCount: number) => void;
  onResultSelect: (result: SearchResult | null) => void;
  onSearchValueChange: (value: string) => void;
  setSearchValue: (value: string) => void;
}

function MobileNavPopupImpl({
  children,
  handle,
  inputRef,
  searchValue,
  onResultCountChange,
  onResultSelect,
  onSearchValueChange,
  setSearchValue,
}: MobileNavPopupImplProps) {
  const highlightedResultRef = React.useRef<SearchResult | undefined>(undefined);
  const scrollAreaViewportRef = React.useRef<HTMLDivElement>(null);
  const hadQueryRef = React.useRef(false);
  const hasQuery = searchValue.trim() !== '';
  const { results, search, defaultResults, buildResultUrl } = useSearch({
    sitemap: sitemapPromise,
    generateSlug: slugifyWithParentContext,
    tolerance: 0,
    limit: 20,
    enableStemming: true,
    includeCategoryInGroup: true,
    excludeSections: true,
    showPrivatePages,
  });

  const [searchResults, setSearchResults] =
    React.useState<ReturnType<typeof useSearch>['results']>(defaultResults);

  useIsoLayoutEffect(() => {
    if (hadQueryRef.current && !hasQuery) {
      scrollAreaViewportRef.current?.scrollTo({ top: 0, left: 0 });
    }

    if (!hasQuery) {
      highlightedResultRef.current = undefined;
    }

    hadQueryRef.current = hasQuery;
  }, [hasQuery]);

  React.useEffect(() => {
    if (!hasQuery) {
      onResultCountChange(0);
      setSearchResults(defaultResults);
      return;
    }

    const totalResults = results.results.reduce((sum, group) => sum + group.items.length, 0);
    onResultCountChange(totalResults);
    setSearchResults(results);
  }, [defaultResults, hasQuery, onResultCountChange, results]);

  const itemToStringValue = React.useCallback(
    (item: SearchResult | null) => (item ? item.title || item.slug : ''),
    [],
  );

  const handleValueChange = React.useCallback(
    async (value: string) => {
      onSearchValueChange(value);
      setSearchValue(value);
      await search(value, { groupBy: { properties: ['group'], maxResult: 5 } });
    },
    [onSearchValueChange, search, setSearchValue],
  );

  const handleItemHighlighted = React.useCallback((item: SearchResult | undefined) => {
    highlightedResultRef.current = item;
  }, []);

  const handleResultNavigate = React.useCallback(
    (result: SearchResult) => {
      onResultSelect(result);
      handle.close();
      setSearchValue('');
    },
    [handle, onResultSelect, setSearchValue],
  );

  const handleAutocompleteOpenChange = React.useCallback(
    (open: boolean, eventDetails: Autocomplete.Root.ChangeEventDetails) => {
      if (open || eventDetails.reason !== 'escape-key') {
        return;
      }

      if (searchValue) {
        void handleValueChange('');
      } else {
        handle.close();
      }
    },
    [handle, handleValueChange, searchValue],
  );

  const handleKeyDownCapture = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && searchValue) {
        event.preventDefault();
        event.stopPropagation();
        void handleValueChange('');
        return;
      }

      if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey && !event.altKey)) {
        return;
      }

      const highlightedResult = highlightedResultRef.current;
      if (!highlightedResult) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      window.open(buildResultUrl(highlightedResult), '_blank', 'noopener,noreferrer');
    },
    [buildResultUrl, handleValueChange, searchValue],
  );

  const renderResultsList = React.useCallback(
    (group: SearchResults[number]) => (
      <Autocomplete.Group key={group.group} items={group.items} className="MobileNavSection">
        {group.group !== 'Default' && (
          <Autocomplete.GroupLabel className="MobileNavHeading">
            {normalizeGroup(group.group)}
          </Autocomplete.GroupLabel>
        )}
        <Autocomplete.Collection>
          {(result: SearchResult, i) => (
            <Autocomplete.Item
              key={result.id || i}
              value={result}
              render={
                <NextLink
                  href={buildResultUrl(result)}
                  onNavigate={() => handleResultNavigate(result)}
                  tabIndex={-1}
                />
              }
              className="MobileNavSearchOption"
            >
              <SearchResultItem result={result} />
            </Autocomplete.Item>
          )}
        </Autocomplete.Collection>
      </Autocomplete.Group>
    ),
    [buildResultUrl, handleResultNavigate],
  );

  return (
    <Autocomplete.Root
      items={searchResults.results}
      value={searchValue}
      onValueChange={handleValueChange}
      onOpenChange={handleAutocompleteOpenChange}
      onItemHighlighted={handleItemHighlighted}
      open={hasQuery}
      inline
      itemToStringValue={itemToStringValue}
      filter={null}
      autoHighlight={hasQuery}
    >
      <div className="MobileNavSearchHeader">
        <div className="MobileNavHandle" />
        <div className="MobileNavSearchInputRoot">
          <MagnifyingGlassIcon className="MobileNavSearchIcon" />
          <Autocomplete.Input
            id="mobile-docs-search-input"
            ref={inputRef}
            aria-label="Search"
            placeholder="Search"
            className="MobileNavSearchInput"
            onKeyDownCapture={handleKeyDownCapture}
          />
          <Autocomplete.Clear aria-label="Clear search" className="MobileNavClearSearch">
            <XIcon className="MobileNavClearSearchIcon" />
          </Autocomplete.Clear>
        </div>
      </div>
      <Drawer.Content className="MobileNavContent">
        <ScrollArea.Root className="MobileNavScrollAreaRoot">
          <ScrollArea.Viewport ref={scrollAreaViewportRef} className="MobileNavScrollAreaViewport">
            <ScrollArea.Content className="MobileNavScrollAreaContent">
              {hasQuery ? (
                <div className="MobileNavSearchResults">
                  {searchResults.results.length === 0 ? (
                    <Autocomplete.Status className="MobileNavEmptyState">
                      No results found.
                    </Autocomplete.Status>
                  ) : (
                    <Autocomplete.List
                      className="MobileNavSearchList"
                      onKeyDownCapture={handleKeyDownCapture}
                    >
                      {renderResultsList}
                    </Autocomplete.List>
                  )}
                </div>
              ) : (
                <nav aria-label="Docs navigation" className="MobileNavPanel">
                  {children}
                </nav>
              )}
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className="MobileNavScrollbar">
            <ScrollArea.Thumb className="MobileNavScrollbarThumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </Drawer.Content>
    </Autocomplete.Root>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 2.5 11 11m-11 0 11-11" />
    </svg>
  );
}

function SearchResultItem({ result }: { result: SearchResult }) {
  return (
    <React.Fragment>
      <span className="MobileNavSearchBreadcrumbText">
        {result.title?.split(' ‣ ').map((part, i, arr) => (
          <React.Fragment key={part}>
            <span className="MobileNavSearchBreadcrumbPart">{part}</span>
            {i !== arr.length - 1 && (
              <svg
                className="MobileNavSearchBreadcrumbSeparator"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  d="M6.5 3.5 11 8l-4.5 4.5"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </React.Fragment>
        ))}
      </span>
      {process.env.NODE_ENV !== 'production' && result.score && (
        <span className="MobileNavSearchScore">{result.score.toFixed(2)}</span>
      )}
    </React.Fragment>
  );
}
