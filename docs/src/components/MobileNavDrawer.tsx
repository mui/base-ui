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
  open,
  onOpenChange,
  sitemap,
  triggerId,
  ...props
}: MobileNavDrawerProps) {
  const [searchValue, setSearchValue] = React.useState('');
  const searchTracking = useSearchTracking();
  const popupRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wasOpenRef = React.useRef(false);

  const handleOpenDrawer = React.useCallback(() => {
    searchTracking.handleOpen();
  }, [searchTracking]);

  const handleCloseDrawer = React.useCallback(() => {
    searchTracking.handleClose();
    setSearchValue('');
  }, [searchTracking]);

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

  return (
    <Drawer.Root
      swipeDirection="down"
      {...props}
      handle={handle}
      open={open}
      onOpenChange={handleOpenChange}
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
                inputRef={inputRef}
                onClose={() => onOpenChange(false)}
                searchValue={searchValue}
                onResultCountChange={searchTracking.setResultCount}
                onResultSelect={searchTracking.setSelectedResult}
                onSearchValueChange={searchTracking.handleSearchValueChange}
                sitemap={sitemap}
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
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  searchValue: string;
  onResultCountChange: (resultCount: number) => void;
  onResultSelect: (result: SearchResult | null) => void;
  onSearchValueChange: (value: string) => void;
  sitemap?: SearchSitemapLoader;
  setSearchValue: (value: string) => void;
}

function MobileNavPopupImpl({
  inputRef,
  onClose,
  searchValue,
  onResultCountChange,
  onResultSelect,
  onSearchValueChange,
  sitemap,
  setSearchValue,
}: MobileNavPopupImplProps) {
  const highlightedResultRef = React.useRef<SearchResult | undefined>(undefined);
  const scrollAreaViewportRef = React.useRef<HTMLDivElement>(null);
  const hadQueryRef = React.useRef(false);
  const lastReadySearchValueRef = React.useRef('');
  const [navSitemap, setNavSitemap] = React.useState<Sitemap | null>(null);
  const hasQuery = searchValue.trim() !== '';
  const sitemapImport = sitemap ?? loadSearchSitemap;
  const searchSitemap = useDeferredSearchSitemap(hasQuery, sitemapImport);
  const { results, search, defaultResults, buildResultUrl, isReady } = useDocsSearch(searchSitemap);

  const searchResults = useDeferredEmptySearchResults({
    active: hasQuery && isReady,
    defaultResults,
    onResultCountChange,
    results,
  });

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
    if (hasQuery) {
      return undefined;
    }

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
  }, [hasQuery, sitemapImport]);

  React.useEffect(() => {
    if (!hasQuery) {
      lastReadySearchValueRef.current = '';
      return;
    }

    if (!isReady || lastReadySearchValueRef.current === searchValue) {
      return;
    }

    lastReadySearchValueRef.current = searchValue;
    void search(searchValue, { groupBy: { properties: ['group'], maxResult: 5 } });
  }, [hasQuery, isReady, search, searchValue]);

  const handleValueChange = React.useCallback(
    async (value: string) => {
      onSearchValueChange(value);
      setSearchValue(value);
      lastReadySearchValueRef.current = isReady && value.trim() ? value : '';
      await search(value, { groupBy: { properties: ['group'], maxResult: 5 } });
    },
    [isReady, onSearchValueChange, search, setSearchValue],
  );

  const handleItemHighlighted = React.useCallback((item: SearchResult | undefined) => {
    highlightedResultRef.current = item;
  }, []);

  const handleResultNavigate = React.useCallback(
    (result: SearchResult) => {
      onResultSelect(result);
      onClose();
      setSearchValue('');
    },
    [onClose, onResultSelect, setSearchValue],
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
    mobileNavContent = (
      <div className="MobileNavSearchResults">
        {searchResults.results.length === 0 && isReady ? (
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
    );
  } else {
    mobileNavContent = (
      <nav aria-label="Docs navigation" className="MobileNavPanel">
        <MobileNavContent sitemap={navSitemap} />
      </nav>
    );
  }

  return (
    <Autocomplete.Root
      items={searchResults.results}
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
