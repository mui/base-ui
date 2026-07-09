'use client';
import * as React from 'react';
import type { SearchResult } from '@mui/internal-docs-infra/useSearch/types';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Dialog } from '@base-ui/react/dialog';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { CornerDownLeft } from 'lucide-react';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { handleModifiedEnterNavigation, searchResultToString } from './searchUtils';
import { loadSearchSitemap, type SearchSitemapLoader } from './searchSitemap';
import { SearchResultsList } from './SearchResultsList';
import { useDeferredSearchSitemap } from './useDeferredSearchSitemap';
import { useDeferredEmptySearchResults } from './useDeferredEmptySearchResults';
import { useDocsSearch } from './useDocsSearch';
import { useSearchTracking } from './useSearchTracking';
import './Search.css';

const searchResultClasses = {
  group: 'SearchGroup',
  groupLabel: 'SearchGroupLabel',
  item: 'SearchOptionItem',
  breadcrumbPart: 'SearchBreadcrumbPart',
  breadcrumbPartLast: 'last',
  separator: 'SearchBreadcrumbSeparator',
  score: 'SearchScore',
};

export interface SearchDialogProps {
  handle: Dialog.Handle<unknown>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sitemap?: SearchSitemapLoader;
  triggerId: string | null;
}

export function SearchDialog({
  handle,
  open,
  onOpenChange,
  sitemap: sitemapImport = loadSearchSitemap,
  triggerId,
}: SearchDialogProps) {
  const [searchValue, setSearchValue] = React.useState('');
  const [searchIndexActive, setSearchIndexActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const indexWarmupTimeout = useTimeout();

  // Build the search index shortly after mount so the default results are ready
  // before the first open, instead of popping in once the open transition
  // completes. The delay keeps the index build from competing with hydration.
  React.useEffect(() => {
    indexWarmupTimeout.start(250, () => {
      setSearchIndexActive(true);
    });
    return indexWarmupTimeout.clear;
  }, [indexWarmupTimeout]);

  const searchSitemap = useDeferredSearchSitemap(searchIndexActive, sitemapImport);
  const { results, defaultResults, buildResultUrl, isReady, performSearch } = useDocsSearch(
    searchSitemap,
    searchValue,
  );
  const hasSearchValue = searchValue.trim() !== '';
  const isSearchPending = hasSearchValue && isReady && results === defaultResults;
  const searchTracking = useSearchTracking({
    open,
    onOpen: () => {
      setSearchValue('');
    },
    onClose: () => {
      // The dialog stays mounted after closing, so reset the results while it's
      // hidden. Otherwise reopening would show the previous query's results.
      void performSearch('');
    },
  });

  const searchResults = useDeferredEmptySearchResults({
    active: open && isReady && !isSearchPending,
    defaultResults,
    onResultCountChange: searchTracking.setResultCount,
    resetDelay: 200,
    results,
  });

  const handleOpenChangeComplete = React.useCallback((nextOpen: boolean) => {
    // Fallback in case the dialog is opened before the warmup timeout fires.
    // Never deactivate: the built index persists and must stay ready for reopens.
    if (nextOpen) {
      setSearchIndexActive(true);
    }
  }, []);

  const handleAutocompleteEscape = React.useCallback(
    (open: boolean, eventDetails: Autocomplete.Root.ChangeEventDetails) => {
      if (!open && eventDetails.reason === 'escape-key') {
        onOpenChange(false);
      }
    },
    [onOpenChange],
  );

  const handleValueChange = React.useCallback(
    async (value: string) => {
      setSearchValue(value);
      searchTracking.handleSearchValueChange(value);
      await performSearch(value);
    },
    [performSearch, searchTracking],
  );

  const highlightedResultRef = React.useRef<SearchResult | undefined>(undefined);

  const handleItemClick = React.useCallback(() => {
    searchTracking.setSelectedResult(highlightedResultRef.current ?? null);
    onOpenChange(false);
  }, [onOpenChange, searchTracking]);

  const handleItemHighlighted = React.useCallback((item: SearchResult | undefined) => {
    highlightedResultRef.current = item;
  }, []);

  const handleKeyDownCapture = React.useCallback(
    (event: React.KeyboardEvent) => {
      handleModifiedEnterNavigation(event, highlightedResultRef.current, buildResultUrl);
    },
    [buildResultUrl],
  );

  const searchInput = (
    <div className="SearchInputRoot">
      <MagnifyingGlassIcon className="SearchInputIcon" />
      <Autocomplete.Input
        id="search-input"
        ref={inputRef}
        aria-label="Search"
        placeholder="Search"
        className="SearchInput"
        onKeyDownCapture={handleKeyDownCapture}
      />
    </div>
  );

  let searchResultsContent: React.ReactNode = null;

  if (searchResults.results.length === 0 && hasSearchValue && isReady && !isSearchPending) {
    searchResultsContent = (
      <Autocomplete.Status className="SearchEmptyState">No results found.</Autocomplete.Status>
    );
  } else if (searchResults.results.length > 0 && !isSearchPending) {
    searchResultsContent = (
      <SearchResultsList
        buildResultUrl={buildResultUrl}
        className="SearchList"
        classes={searchResultClasses}
        onKeyDownCapture={handleKeyDownCapture}
        onResultNavigate={handleItemClick}
        separatorVariant="filled"
      />
    );
  }

  return (
    <Dialog.Root
      handle={handle}
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      triggerId={triggerId}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="SearchBackdrop" />
        <Dialog.Viewport className="SearchViewport">
          <Dialog.Popup initialFocus={inputRef} className="SearchPopup">
            <Dialog.Title className="bui-sr-only">Search documentation</Dialog.Title>
            <Autocomplete.Root
              items={isSearchPending ? [] : searchResults.results}
              onValueChange={handleValueChange}
              onOpenChange={handleAutocompleteEscape}
              onItemHighlighted={handleItemHighlighted}
              open
              inline
              itemToStringValue={searchResultToString}
              filter={null}
              autoHighlight="always"
              keepHighlight
            >
              <div className="SearchHead">{searchInput}</div>
              <div className="SearchBody">
                <ScrollArea.Root className="SearchScrollAreaRoot">
                  <ScrollArea.Viewport className="SearchScrollAreaViewport">
                    <ScrollArea.Content style={{ minWidth: '100%' }}>
                      {searchResultsContent}
                    </ScrollArea.Content>
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar className="SearchScrollbar">
                    <ScrollArea.Thumb className="SearchScrollbarThumb" />
                  </ScrollArea.Scrollbar>
                </ScrollArea.Root>
              </div>
              <div className="SearchFooter">
                <div className="SearchFooterHint">
                  <kbd aria-label="Enter" className="SearchFooterEnter">
                    <CornerDownLeft size={12} />
                  </kbd>
                  <span>Go to page</span>
                </div>
              </div>
            </Autocomplete.Root>
            <Dialog.Close className="SearchClose">Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
