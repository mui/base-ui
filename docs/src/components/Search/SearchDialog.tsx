'use client';
import * as React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import type { SearchResult, SearchResults } from '@mui/internal-docs-infra/useSearch/types';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Dialog } from '@base-ui/react/dialog';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { CornerDownLeft } from 'lucide-react';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { getDisplayTitle } from '../../utils/getDisplayTitle';
import {
  handleModifiedEnterNavigation,
  normalizeSearchGroup,
  searchResultToString,
} from './searchUtils';
import { loadSearchSitemap, type SearchSitemapLoader } from './searchSitemap';
import { useDeferredSearchSitemap } from './useDeferredSearchSitemap';
import { useDeferredEmptySearchResults } from './useDeferredEmptySearchResults';
import { useDocsSearch } from './useDocsSearch';
import { useSearchTracking } from './useSearchTracking';
import './Search.css';

const SearchItem = React.memo(function SearchItem({ result }: { result: SearchResult }) {
  return (
    <React.Fragment>
      {result.title?.split(' ‣ ').map((part, i, arr) => (
        <React.Fragment key={part}>
          <span className={clsx('SearchBreadcrumbPart', i === arr.length - 1 && 'last')}>
            {getDisplayTitle(part)}
          </span>
          {i !== arr.length - 1 && (
            <svg
              className="SearchBreadcrumbSeparator"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 16 16"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M5.47 13.03a.75.75 0 0 1 0-1.06L9.44 8 5.47 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0"
                clipRule="evenodd"
              />
            </svg>
          )}
        </React.Fragment>
      ))}
      {process.env.NODE_ENV !== 'production' && result.score && (
        <span className="SearchScore">{result.score.toFixed(2)}</span>
      )}
    </React.Fragment>
  );
});

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
  const inputRef = React.useRef<HTMLInputElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const searchTracking = useSearchTracking();
  const wasOpenRef = React.useRef(false);
  const lastReadySearchValueRef = React.useRef('');

  const searchSitemap = useDeferredSearchSitemap(open, sitemapImport);
  const { results, search, defaultResults, buildResultUrl, isReady } = useDocsSearch(searchSitemap);

  const searchResults = useDeferredEmptySearchResults({
    active: open && isReady,
    defaultResults,
    onResultCountChange: searchTracking.setResultCount,
    resetDelay: 200,
    results,
  });

  const handleOpenDialog = React.useCallback(() => {
    setSearchValue('');
    searchTracking.handleOpen();
  }, [searchTracking]);

  const handleCloseDialog = React.useCallback(() => {
    searchTracking.handleClose();
  }, [searchTracking]);

  React.useEffect(() => {
    if (open !== wasOpenRef.current) {
      if (open) {
        handleOpenDialog();
      } else {
        handleCloseDialog();
      }
    }

    wasOpenRef.current = open;
  }, [handleCloseDialog, handleOpenDialog, open]);

  React.useEffect(() => {
    const hasSearchValue = searchValue.trim() !== '';

    if (!hasSearchValue) {
      lastReadySearchValueRef.current = '';
      return;
    }

    if (!isReady || lastReadySearchValueRef.current === searchValue) {
      return;
    }

    lastReadySearchValueRef.current = searchValue;
    void search(searchValue, { groupBy: { properties: ['group'], maxResult: 5 } });
  }, [isReady, search, searchValue]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleAutocompleteEscape = React.useCallback(
    (open: boolean, eventDetails: Autocomplete.Root.ChangeEventDetails) => {
      if (!open && eventDetails.reason === 'escape-key') {
        handleOpenChange(false);
      }
    },
    [handleOpenChange],
  );

  const handleValueChange = React.useCallback(
    async (value: string) => {
      setSearchValue(value);
      searchTracking.handleSearchValueChange(value);
      lastReadySearchValueRef.current = isReady && value.trim() ? value : '';
      await search(value, { groupBy: { properties: ['group'], maxResult: 5 } });
    },
    [isReady, search, searchTracking],
  );

  const highlightedResultRef = React.useRef<SearchResult | undefined>(undefined);

  const handleItemClick = React.useCallback(() => {
    searchTracking.setSelectedResult(highlightedResultRef.current ?? null);
    handleOpenChange(false);
  }, [handleOpenChange, searchTracking]);

  const handleItemHighlighted = React.useCallback((item: SearchResult | undefined) => {
    highlightedResultRef.current = item;
  }, []);

  const handleKeyDownCapture = React.useCallback(
    (event: React.KeyboardEvent) => {
      handleModifiedEnterNavigation(event, highlightedResultRef.current, buildResultUrl);
    },
    [buildResultUrl],
  );

  // Memoized search input component
  const searchInput = React.useMemo(
    () => (
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
    ),
    [handleKeyDownCapture],
  );

  // Memoized render function for result groups
  const renderResultsList = React.useCallback(
    (group: SearchResults[number]) => (
      <Autocomplete.Group key={group.group} items={group.items} className="SearchGroup">
        {group.group !== 'Default' && (
          <Autocomplete.GroupLabel className="SearchGroupLabel">
            {normalizeSearchGroup(group.group)}
          </Autocomplete.GroupLabel>
        )}
        <Autocomplete.Collection>
          {(result: SearchResult, i) => (
            <Autocomplete.Item
              key={result.id || i}
              value={result}
              render={
                <Link href={buildResultUrl(result)} onNavigate={handleItemClick} tabIndex={-1} />
              }
              className="SearchOptionItem"
            >
              <SearchItem result={result} />
            </Autocomplete.Item>
          )}
        </Autocomplete.Collection>
      </Autocomplete.Group>
    ),
    [buildResultUrl, handleItemClick],
  );

  const hasSearchValue = searchValue.trim() !== '';
  let searchResultsContent: React.ReactNode = null;

  if (searchResults.results.length === 0 && hasSearchValue && isReady) {
    searchResultsContent = (
      <Autocomplete.Status className="SearchEmptyState">No results found.</Autocomplete.Status>
    );
  } else if (searchResults.results.length > 0) {
    searchResultsContent = (
      <Autocomplete.List className="SearchList" onKeyDownCapture={handleKeyDownCapture}>
        {renderResultsList}
      </Autocomplete.List>
    );
  }

  return (
    <Dialog.Root handle={handle} open={open} onOpenChange={handleOpenChange} triggerId={triggerId}>
      <Dialog.Portal>
        <Dialog.Backdrop className="SearchBackdrop" />
        <Dialog.Viewport className="SearchViewport">
          <Dialog.Popup
            ref={popupRef}
            initialFocus={inputRef}
            data-open={open}
            className="SearchPopup"
          >
            <Dialog.Title className="bui-sr-only">Search documentation</Dialog.Title>
            <Autocomplete.Root
              items={searchResults.results}
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
                  <ScrollArea.Scrollbar className="SearchScrollbar ">
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
