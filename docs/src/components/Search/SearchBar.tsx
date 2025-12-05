'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearch } from '@mui/internal-docs-infra/useSearch';
import type {
  SearchResult,
  SearchResults,
  Sitemap,
} from '@mui/internal-docs-infra/useSearch/types';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import { Button } from '@base-ui-components/react/button';
import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { Search } from 'lucide-react';

function normalizeGroup(group: string) {
  return group.replace(/\s+Pages$/, '').replace(/^React\s+/, '');
}

function SearchItem({ result }: { result: SearchResult }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[0.9375rem] tracking-[0.016em] font-normal">{result.title}</span>
      </div>
      {process.env.NODE_ENV === 'development' && result.score && (
        <span className="text-xs opacity-70">{result.score.toFixed(2)}</span>
      )}
    </div>
  );
}

export function SearchBar({
  sitemap: sitemapImport,
  enableKeyboardShortcut = false,
  containedScroll = false,
}: {
  sitemap: () => Promise<{ sitemap?: Sitemap }>;
  enableKeyboardShortcut?: boolean;
  containedScroll?: boolean;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const openingRef = React.useRef(false);
  const closingRef = React.useRef(false);

  // Use the generic search hook with Base UI specific configuration
  const { results, search, defaultResults, buildResultUrl } = useSearch({
    sitemap: sitemapImport,
    tolerance: 1,
    limit: 20,
    enableStemming: true,
    includeCategoryInGroup: true,
  });

  const [searchResults, setSearchResults] =
    React.useState<ReturnType<typeof useSearch>['results']>(defaultResults);

  // Update search results when hook results change
  React.useEffect(() => {
    const updateResults = () => {
      setSearchResults(results);
    };

    // Delay empty results to avoid flashing "No results" while typing
    if (results.results.length === 0) {
      const timeoutId = setTimeout(updateResults, 400);
      return () => clearTimeout(timeoutId);
    }

    updateResults();
    return undefined;
  }, [results]);

  const handleOpenDialog = React.useCallback(() => {
    // Prevent double-opening across all instances
    if (openingRef.current) {
      return;
    }
    openingRef.current = true;

    setDialogOpen(true);

    // Reset after a short delay
    setTimeout(() => {
      openingRef.current = false;
    }, 100);
  }, []);

  const handleCloseDialog = React.useCallback(
    (open: boolean) => {
      if (!open) {
        // Prevent double-closing across all instances
        if (closingRef.current) {
          return;
        }
        closingRef.current = true;

        setDialogOpen(false);
        queueMicrotask(() => {
          setSearchResults(defaultResults);
        });

        // Reset after a short delay
        setTimeout(() => {
          closingRef.current = false;
        }, 100);
      } else {
        handleOpenDialog();
      }
    },
    [handleOpenDialog, defaultResults],
  );

  const handleAutocompleteEscape = React.useCallback(
    (open: boolean, eventDetails: Autocomplete.Root.ChangeEventDetails) => {
      if (!open && eventDetails.reason === 'escape-key') {
        handleCloseDialog(false);
      }
    },
    [handleCloseDialog],
  );

  const handleEscapeButtonClick = React.useCallback(() => {
    handleCloseDialog(false);
  }, [handleCloseDialog]);

  React.useEffect(() => {
    // Only enable keyboard shortcut if explicitly requested (for desktop version)
    if (!enableKeyboardShortcut) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        event.stopPropagation();

        // Only open if not already open or in the process of opening/closing
        if (!dialogOpen && !openingRef.current && !closingRef.current) {
          handleOpenDialog();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleOpenDialog, enableKeyboardShortcut, dialogOpen]);

  const handleValueChange = React.useCallback(
    async (value: string) => {
      await search(value, { groupBy: { properties: ['group'], maxResult: 5 } });
    },
    [search],
  );

  const handleItemClick = React.useCallback(
    (result: SearchResult) => {
      const url = buildResultUrl(result);
      router.push(url);
      handleCloseDialog(false);
    },
    [router, handleCloseDialog, buildResultUrl],
  );

  // Reusable search input component
  const searchInput = (
    <div className="flex items-center gap-2 h-8 rounded-lg bg-popover px-3">
      <Search className="search-icon h-4 w-4 shrink-0 text-gray-500" />
      <Autocomplete.Input
        id="search-input"
        ref={inputRef}
        placeholder="Search"
        className="w-full border-0 bg-transparent text-[0.9375rem] tracking-[0.016em] font-normal text-gray-900 placeholder:text-gray-500 focus:outline-none"
      />
      <Button
        onClick={handleEscapeButtonClick}
        className="expanding-box-content-right rounded border border-gray-300 bg-gray-50 px-1.5 hidden hover:bg-gray-100 active:bg-gray-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] active:border-t-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1 lg:flex"
      >
        <kbd className="text-xs text-gray-600 whitespace-nowrap">esc</kbd>
      </Button>
    </div>
  );

  // Reusable results list render function
  const renderResultsList = (group: SearchResults[number]) => (
    <Autocomplete.Group key={group.group} items={group.items} className="block">
      {group.group !== 'Default' && (
        <Autocomplete.GroupLabel
          id={`search-group-${group.group}`}
          className="search-results m-0 flex h-8 items-center pl-3.5 text-[0.9375rem] tracking-[0.00625em] font-normal leading-none text-gray-600 select-none"
        >
          {normalizeGroup(group.group)}
        </Autocomplete.GroupLabel>
      )}
      <Autocomplete.Collection>
        {(result: SearchResult, i) => (
          <Autocomplete.Item
            key={result.id || i}
            value={result}
            onClick={() => handleItemClick(result)}
            render={<Link href={buildResultUrl(result)} />}
            className="flex h-8 cursor-default select-none items-center rounded-lg px-9 text-[0.9375rem] tracking-[0.016em] font-normal leading-none outline-none data-highlighted:bg-gray-100"
          >
            <SearchItem result={result} />
          </Autocomplete.Item>
        )}
      </Autocomplete.Collection>
    </Autocomplete.Group>
  );

  // Reusable empty state
  const emptyState = (
    <div className="search-no-results px-3 py-6 text-center text-[0.9375rem] tracking-[0.016em] font-normal text-gray-600">
      No results found.
    </div>
  );

  return (
    <React.Fragment>
      <Button
        onClick={handleOpenDialog}
        className="search-button relative h-7 w-50 text-left text-sm font-normal text-gray-900 rounded-md pt-0.75 pb-0.75 pl-3 pr-3 border border-gray-200 bg-(--color-popup) hover:bg-gray-100 active:bg-gray-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] active:border-t-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1"
      >
        <div>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Search</span>
          </div>
          <div className="expanding-box-content-right pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 gap-1 rounded border border-gray-300 bg-gray-50 px-1.5 lg:flex">
            <kbd className="text-xs text-gray-600">⌘</kbd>
            <kbd className="text-xs text-gray-600">K</kbd>
          </div>
        </div>
      </Button>
      <Dialog.Root open={dialogOpen} onOpenChange={handleCloseDialog}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
          {containedScroll ? (
            <Dialog.Viewport className="group/dialog fixed inset-0 flex items-start justify-center overflow-hidden py-6">
              <Dialog.Popup
                ref={popupRef}
                initialFocus={inputRef}
                data-open={dialogOpen}
                className="search-dialog-popup relative flex rounded-2xl min-h-0 max-h-[min(29.5rem,calc(100vh-6rem))] w-[min(40rem,calc(100vw-2rem))] flex-col overflow-hidden bg-(--color-popup) text-gray-900 p-2 outline-1 outline-black/4 shadow-[0_.5px_1px_hsl(0_0%_0%/12%),0_1px_3px_-1px_hsl(0_0%_0%/4%),0_2px_4px_-1px_hsl(0_0%_0%/4%),0_4px_8px_-2px_hsl(0_0%_0%/4%),0_12px_14px_-4px_hsl(0_0%_0%/4%),0_24px_64px_-8px_hsl(0_0%_0%/4%),0_40px_48px_-32px_hsl(0_0%_0%/4%)]"
              >
                <Autocomplete.Root
                  items={searchResults.results}
                  onValueChange={handleValueChange}
                  onOpenChange={handleAutocompleteEscape}
                  open
                  inline
                  itemToStringValue={(item) => (item ? item.title || item.slug : '')}
                  filter={null}
                  autoHighlight
                >
                  <div className="shrink-0 border-b border-gray-200 -mx-3 px-3 pb-1.5">
                    {searchInput}
                  </div>
                  <div className="flex min-h-0 flex-1 mt-2">
                    <ScrollArea.Root className="search-results-scroll relative flex min-h-0 flex-1 overflow-hidden">
                      <ScrollArea.Viewport className="search-results-scroll-viewport flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-pt-9 scroll-pb-2">
                        <ScrollArea.Content>
                          {searchResults.results.length === 0 ? (
                            emptyState
                          ) : (
                            <Autocomplete.List className="outline-0 pb-2">
                              {renderResultsList}
                            </Autocomplete.List>
                          )}
                        </ScrollArea.Content>
                      </ScrollArea.Viewport>
                      <ScrollArea.Scrollbar className="pointer-events-none absolute m-1 flex w-1 z-50 justify-center rounded-2xl data-hovering:pointer-events-auto data-hovering:opacity-100 data-scrolling:pointer-events-auto data-scrolling:opacity-100 md:w-1.25">
                        <ScrollArea.Thumb className="w-full rounded-[inherit] bg-gray-500 before:absolute before:left-1/2 before:top-1/2 before:h-[calc(100%+1rem)] before:w-[calc(100%+1rem)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']" />
                      </ScrollArea.Scrollbar>
                    </ScrollArea.Root>
                  </div>
                  <div className="search-results-stats border-t border-gray-200 pt-1 -mb-3 -ml-4 -mr-4 flex justify-end p-2 pl-4 pr-4 text-gray-500 text-xs">
                    <div className={searchResults.elapsed.raw <= 0 ? 'opacity-0' : ''}>
                      Found {searchResults.count} items in {searchResults.elapsed.formatted}
                    </div>
                  </div>
                </Autocomplete.Root>
              </Dialog.Popup>
            </Dialog.Viewport>
          ) : (
            <Dialog.Viewport className="group/dialog fixed inset-0">
              <ScrollArea.Root
                style={{ position: undefined }}
                className="h-full overscroll-contain group-data-ending-style/dialog:pointer-events-none"
              >
                <ScrollArea.Viewport className="h-full overscroll-contain group-data-ending-style/dialog:pointer-events-none">
                  <ScrollArea.Content className="flex min-h-full items-start justify-center">
                    <Dialog.Popup
                      ref={popupRef}
                      initialFocus={inputRef}
                      data-open={dialogOpen}
                      className="search-dialog-popup relative mx-auto rounded-2xl my-18 w-[min(40rem,calc(100vw-2rem))] bg-(--color-popup) text-gray-900 p-2 outline-1 outline-black/4 shadow-[0_.5px_1px_hsl(0_0%_0%/12%),0_1px_3px_-1px_hsl(0_0%_0%/4%),0_2px_4px_-1px_hsl(0_0%_0%/4%),0_4px_8px_-2px_hsl(0_0%_0%/4%),0_12px_14px_-4px_hsl(0_0%_0%/4%),0_24px_64px_-8px_hsl(0_0%_0%/4%),0_40px_48px_-32px_hsl(0_0%_0%/4%)]"
                    >
                      <Autocomplete.Root
                        items={searchResults.results}
                        onValueChange={handleValueChange}
                        onOpenChange={handleAutocompleteEscape}
                        open
                        inline
                        itemToStringValue={(item) => (item ? item.title || item.slug : '')}
                        filter={null}
                        autoHighlight
                      >
                        <div className="border-b border-gray-200 -mx-2 px-2 pb-1.5">
                          {searchInput}
                        </div>
                        <div className="mt-2">
                          {searchResults.results.length === 0 ? (
                            emptyState
                          ) : (
                            <Autocomplete.List className="outline-0 overflow-y-auto scroll-pt-9 scroll-pb-2 overscroll-contain max-h-[min(22.5rem,var(--available-height))] rounded-b-[5px]">
                              {renderResultsList}
                            </Autocomplete.List>
                          )}
                        </div>
                      </Autocomplete.Root>
                    </Dialog.Popup>
                  </ScrollArea.Content>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar className="pointer-events-none absolute m-[0.4rem] flex w-1 justify-center rounded-2xl data-scrolling:pointer-events-auto data-scrolling:opacity-100 hover:pointer-events-auto hover:opacity-100 md:w-1.75">
                  <ScrollArea.Thumb className="w-full rounded-[inherit] bg-gray-500 before:absolute before:content-[''] before:top-1/2 before:left-1/2 before:h-[calc(100%+1rem)] before:w-[calc(100%+1rem)] before:-translate-x-1/2 before:-translate-y-1/2" />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            </Dialog.Viewport>
          )}
        </Dialog.Portal>
      </Dialog.Root>
    </React.Fragment>
  );
}
