'use client';
import * as React from 'react';
import NextLink from 'next/link';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Drawer } from '@base-ui/react/drawer';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type {
  SearchResult,
  SearchResults,
  Sitemap,
} from '@mui/internal-docs-infra/useSearch/types';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { getDisplayTitle } from '../utils/getDisplayTitle';
import { MobileNavContent } from './MobileNavContent';
import {
  handleModifiedEnterNavigation,
  normalizeSearchGroup,
  searchResultToString,
} from './Search/searchUtils';
import { loadSearchSitemap, type SearchSitemapLoader } from './Search/searchSitemap';
import { useDeferredSearchSitemap } from './Search/useDeferredSearchSitemap';
import { useDeferredEmptySearchResults } from './Search/useDeferredEmptySearchResults';
import { useDocsSearch } from './Search/useDocsSearch';
import { useSearchTracking } from './Search/useSearchTracking';

interface MobileNavDrawerProps extends Omit<Drawer.Root.Props, 'children' | 'handle'> {
  focusSearchOnOpen: boolean;
  handle: Drawer.Handle<unknown>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sitemap?: SearchSitemapLoader;
  triggerId: string | null;
}

export function MobileNavDrawer({
  focusSearchOnOpen,
  handle,
  onOpenChangeComplete,
  open,
  onOpenChange,
  sitemap,
  triggerId,
  ...props
}: MobileNavDrawerProps) {
  const [searchValue, setSearchValue] = React.useState('');
  const [searchIndexActive, setSearchIndexActive] = React.useState(false);
  const [navSitemap, setNavSitemap] = React.useState<Sitemap | null>(null);
  const searchTracking = useSearchTracking();
  const popupRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wasOpenRef = React.useRef(false);

  // The search hooks live here rather than in MobileNavPopupImpl so that the
  // search index survives the popup unmounting when the drawer closes. Activate
  // the deferred loader after opening completes so indexing doesn't land on the
  // first keystroke or during the drawer transition.
  const hasQuery = searchValue.trim() !== '';
  const sitemapImport = sitemap ?? loadSearchSitemap;
  const searchSitemap = useDeferredSearchSitemap(searchIndexActive, sitemapImport);
  const { results, defaultResults, buildResultUrl, isReady, performSearch } = useDocsSearch(
    searchSitemap,
    searchValue,
  );
  const isSearchPending = hasQuery && isReady && results === defaultResults;

  const searchResults = useDeferredEmptySearchResults({
    active: hasQuery && isReady && !isSearchPending,
    defaultResults,
    onResultCountChange: searchTracking.setResultCount,
    results,
  });

  React.useEffect(() => {
    let ignore = false;

    void sitemapImport().then(
      ({ sitemap: nextSitemap }) => {
        if (!ignore) {
          setNavSitemap(nextSitemap ?? null);
        }
      },
      () => {
        if (!ignore) {
          setNavSitemap(null);
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, [sitemapImport]);

  const handleOpenDrawer = React.useCallback(() => {
    searchTracking.handleOpen();
  }, [searchTracking]);

  const handleCloseDrawer = React.useCallback(() => {
    searchTracking.handleClose();
  }, [searchTracking]);

  const handleOpenChangeComplete = React.useCallback(
    (nextOpen: boolean) => {
      setSearchIndexActive(nextOpen);

      if (!nextOpen) {
        setSearchValue('');
        // The search state survives closing, so reset the results once the
        // drawer is hidden. Otherwise the closing animation would swap back to
        // the nav tree and reopening could show the previous query's results.
        void performSearch('');
      }

      onOpenChangeComplete?.(nextOpen);
    },
    [onOpenChangeComplete, performSearch],
  );

  React.useEffect(() => {
    if (open !== wasOpenRef.current) {
      if (open) {
        handleOpenDrawer();
      } else {
        handleCloseDrawer();
      }
    }

    wasOpenRef.current = open;
  }, [handleCloseDrawer, handleOpenDrawer, open]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  // `initialFocus` only runs when the drawer opens, so handle the shortcut
  // being pressed while the drawer is already open.
  React.useEffect(() => {
    if (open && focusSearchOnOpen) {
      inputRef.current?.focus();
    }
  }, [focusSearchOnOpen, open]);

  return (
    <Drawer.Root
      swipeDirection="down"
      {...props}
      handle={handle}
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      triggerId={triggerId}
    >
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop className="MobileNavBackdrop" />
          <Drawer.Viewport className="MobileNavViewport">
            <Drawer.Popup
              ref={popupRef}
              className="MobileNavPopup"
              initialFocus={() => (focusSearchOnOpen ? inputRef.current : popupRef.current)}
            >
              <Drawer.Title className="bui-sr-only">Docs navigation</Drawer.Title>
              <MobileNavPopupImpl
                buildResultUrl={buildResultUrl}
                hasQuery={hasQuery}
                inputRef={inputRef}
                isReady={isReady}
                isSearchPending={isSearchPending}
                navSitemap={navSitemap}
                onClose={() => onOpenChange(false)}
                performSearch={performSearch}
                searchResults={searchResults}
                searchValue={searchValue}
                onResultSelect={searchTracking.setSelectedResult}
                onSearchValueChange={searchTracking.handleSearchValueChange}
                setSearchValue={setSearchValue}
              />
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  );
}

interface MobileNavPopupImplProps {
  buildResultUrl: (result: SearchResult) => string;
  hasQuery: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isReady: boolean;
  isSearchPending: boolean;
  navSitemap: Sitemap | null;
  onClose: () => void;
  performSearch: (value: string) => Promise<void>;
  searchResults: ReturnType<typeof useDocsSearch>['results'];
  searchValue: string;
  onResultSelect: (result: SearchResult | null) => void;
  onSearchValueChange: (value: string) => void;
  setSearchValue: (value: string) => void;
}

function MobileNavPopupImpl({
  buildResultUrl,
  hasQuery,
  inputRef,
  isReady,
  isSearchPending,
  navSitemap,
  onClose,
  performSearch,
  searchResults,
  searchValue,
  onResultSelect,
  onSearchValueChange,
  setSearchValue,
}: MobileNavPopupImplProps) {
  const highlightedResultRef = React.useRef<SearchResult | undefined>(undefined);
  const scrollAreaViewportRef = React.useRef<HTMLDivElement>(null);
  const hadQueryRef = React.useRef(false);

  useIsoLayoutEffect(() => {
    if (hadQueryRef.current && !hasQuery) {
      scrollAreaViewportRef.current?.scrollTo({ top: 0, left: 0 });
    }

    if (!hasQuery) {
      highlightedResultRef.current = undefined;
    }

    hadQueryRef.current = hasQuery;
  }, [hasQuery]);

  const handleValueChange = React.useCallback(
    async (value: string) => {
      onSearchValueChange(value);
      setSearchValue(value);
      await performSearch(value);
    },
    [onSearchValueChange, performSearch, setSearchValue],
  );

  const handleItemHighlighted = React.useCallback((item: SearchResult | undefined) => {
    highlightedResultRef.current = item;
  }, []);

  const handleResultNavigate = React.useCallback(
    (result: SearchResult) => {
      onResultSelect(result);
      onClose();
    },
    [onClose, onResultSelect],
  );

  const handleAutocompleteOpenChange = React.useCallback(
    (open: boolean, eventDetails: Autocomplete.Root.ChangeEventDetails) => {
      if (open || eventDetails.reason !== 'escape-key') {
        return;
      }

      if (searchValue) {
        void handleValueChange('');
      } else {
        onClose();
      }
    },
    [handleValueChange, onClose, searchValue],
  );

  const handleKeyDownCapture = React.useCallback(
    (event: React.KeyboardEvent) => {
      // Pressing Escape during IME composition only cancels the composition;
      // it must not clear the committed query. `keyCode === 229` covers
      // Safari, where `isComposing` is unreliable.
      if (event.nativeEvent.isComposing || event.keyCode === 229) {
        return;
      }

      if (event.key === 'Escape' && searchValue) {
        event.preventDefault();
        event.stopPropagation();
        void handleValueChange('');
        return;
      }

      handleModifiedEnterNavigation(event, highlightedResultRef.current, buildResultUrl);
    },
    [buildResultUrl, handleValueChange, searchValue],
  );

  const renderResultsList = React.useCallback(
    (group: SearchResults[number]) => (
      <Autocomplete.Group key={group.group} items={group.items} className="MobileNavSection">
        {group.group !== 'Default' && (
          <Autocomplete.GroupLabel className="MobileNavHeading">
            {normalizeSearchGroup(group.group)}
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

  let mobileNavContent: React.ReactNode = null;

  if (hasQuery) {
    let mobileSearchResultsContent: React.ReactNode = null;

    if (!isSearchPending) {
      mobileSearchResultsContent =
        searchResults.results.length === 0 && isReady ? (
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
        );
    }

    mobileNavContent = <div className="MobileNavSearchResults">{mobileSearchResultsContent}</div>;
  } else {
    mobileNavContent = (
      <nav aria-label="Docs navigation" className="MobileNavPanel">
        <MobileNavContent sitemap={navSitemap} />
      </nav>
    );
  }

  return (
    <Autocomplete.Root
      items={isSearchPending ? [] : searchResults.results}
      value={searchValue}
      onValueChange={handleValueChange}
      onOpenChange={handleAutocompleteOpenChange}
      onItemHighlighted={handleItemHighlighted}
      open={hasQuery}
      inline
      itemToStringValue={searchResultToString}
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
              {mobileNavContent}
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
            <span className="MobileNavSearchBreadcrumbPart">{getDisplayTitle(part)}</span>
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
