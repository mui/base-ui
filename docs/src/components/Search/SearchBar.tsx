'use client';
import * as React from 'react';
import Link from 'next/link';
import { useSearch } from '@mui/internal-docs-infra/useSearch';
import type {
  SearchResult,
  SearchResults,
  Sitemap,
} from '@mui/internal-docs-infra/useSearch/types';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Button } from '@base-ui/react/button';
import { Dialog } from '@base-ui/react/dialog';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { isMac } from '@base-ui/utils/detectBrowser';
import { CornerDownLeft, Search } from 'lucide-react';
import { stringToUrl } from '../QuickNav/rehypeSlug.mjs';
import './SearchBar.css';

// Semver pattern to detect version headings (e.g., v1.0.0, v1.0.0-rc.0)
// Used to match the behavior of rehypeConcatHeadings on the Releases page
const SEMVER_PATTERN =
  /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Slugify function that handles parent context concatenation.
 * Matches the behavior of rehypeConcatHeadings for Releases/Forms pages
 * where child heading IDs are prefixed with parent heading text.
 */
function slugifyWithParentContext(text: string, parentTitles?: string[]): string {
  const slug = stringToUrl(text);

  // If there's a parent title that looks like a semver version, prepend it
  // This matches the behavior of rehypeConcatHeadings on the Releases page
  // which generates IDs like: v1.0.0-rc.0-autocomplete
  if (parentTitles?.length && SEMVER_PATTERN.test(parentTitles[0])) {
    return `${parentTitles[0]}-${slug}`;
  }

  return slug;
}

function normalizeGroup(group: string) {
  return group.replace(/\s+Pages$/, '').replace(/^React\s+/, '');
}

const SearchItem = React.memo(function SearchItem({ result }: { result: SearchResult }) {
  return (
    <React.Fragment>
      {result.title?.split(' ‣ ').map((part, i, arr) => (
        <React.Fragment key={part}>
          <span
            className={`flex h-full items-center ${i === arr.length - 1 ? 'truncate text-ellipsis' : 'whitespace-nowrap'}`}
          >
            {part}
          </span>
          {i !== arr.length - 1 && (
            <svg
              className="text-gray-300"
              xmlns="http://www.w3.org/2000/svg"
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
        <span className="text-xs opacity-70 whitespace-nowrap ml-1.5">
          {result.score.toFixed(2)}
        </span>
      )}
    </React.Fragment>
  );
});

const EmptyState = React.memo(function EmptyState() {
  return (
    <div className="px-3 py-6 text-center text-[0.9375rem] tracking-[0.016em] font-normal text-gray-600">
      No results found.
    </div>
  );
});

export function SearchBar({
  sitemap: sitemapImport,
  enableKeyboardShortcut = false,
  containedScroll = false,
}: {
  sitemap: () => Promise<{ sitemap?: Sitemap }>;
  enableKeyboardShortcut?: boolean;
  containedScroll?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);

  // Use the generic search hook with Base UI specific configuration
  const { results, search, defaultResults, buildResultUrl } = useSearch({
    sitemap: sitemapImport,
    generateSlug: slugifyWithParentContext,
    tolerance: 0,
    limit: 20,
    enableStemming: true,
    includeCategoryInGroup: true,
    excludeSections: true,
  });

  // Update search results when hook results change
  const [searchResults, setSearchResults] =
    React.useState<ReturnType<typeof useSearch>['results']>(defaultResults);
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
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = React.useCallback(
    (open: boolean) => {
      if (!open) {
        setDialogOpen(false);

        // Wait for the closing animation to complete before resetting state
        setTimeout(() => {
          setSearchResults(defaultResults);
        }, 200);
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
        if (!dialogOpen) {
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

  const highlightedResultRef = React.useRef<SearchResult | undefined>(undefined);

  const handleItemClick = React.useCallback(() => {
    handleCloseDialog(false);
  }, [handleCloseDialog]);

  const handleItemHighlighted = React.useCallback((item: SearchResult | undefined) => {
    highlightedResultRef.current = item;
  }, []);

  const handleKeyDownCapture = React.useCallback(
    (event: React.KeyboardEvent) => {
      // Only handle Enter with modifiers
      if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey && !event.altKey)) {
        return;
      }

      const highlightedResult = highlightedResultRef.current;
      if (!highlightedResult) {
        return;
      }

      // Prevent the Input/List handlers from processing this
      event.preventDefault();
      event.stopPropagation();

      // Open in new tab
      const url = buildResultUrl(highlightedResult);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [buildResultUrl],
  );

  const showCmdSymbol = React.useSyncExternalStore(
    () => () => {},
    () => enableKeyboardShortcut && isMac,
    () => true, // Show Cmd symbol on server-side render
  );

  // Memoized search input component
  const searchInput = React.useMemo(
    () => (
      <div className="flex items-center gap-2 h-8 rounded-lg bg-popover px-3">
        <Search className="h-4 w-4 shrink-0 text-gray-500" />
        <Autocomplete.Input
          id="search-input"
          ref={inputRef}
          placeholder="Search"
          className="w-full border-0 bg-transparent text-base tracking-[0.016em] font-normal text-gray-900 placeholder:text-gray-500 focus:outline-none"
          onKeyDownCapture={handleKeyDownCapture}
        />
      </div>
    ),
    [handleKeyDownCapture],
  );

  // Memoized callback for itemToStringValue
  const itemToStringValue = React.useCallback(
    (item: SearchResult | null) => (item ? item.title || item.slug : ''),
    [],
  );

  // Memoized render function for result groups
  const renderResultsList = React.useCallback(
    (group: SearchResults[number]) => (
      <Autocomplete.Group key={group.group} items={group.items} className="block">
        {group.group !== 'Default' && (
          <Autocomplete.GroupLabel
            id={`search-group-${group.group}`}
            className="m-0 flex h-8 items-center pl-3.5 text-[0.9375rem] tracking-[0.00625em] font-normal leading-none text-gray-600 select-none"
          >
            {normalizeGroup(group.group)}
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
              className="flex h-8 cursor-default select-none items-center rounded-lg pl-9 pr-2 text-[0.9375rem] tracking-[0.016em] font-normal leading-none outline-none data-highlighted:bg-gray-100 gap-1 text-gray-900"
            >
              <SearchItem result={result} />
            </Autocomplete.Item>
          )}
        </Autocomplete.Collection>
      </Autocomplete.Group>
    ),
    [buildResultUrl, handleItemClick],
  );

  return (
    <React.Fragment>
      <Button onClick={handleOpenDialog} aria-label="Search" className={`SearchTrigger`}>
        <Search className="h-4 w-4 text-gray-500" />
        <div className="SearchTriggerKbd hidden lg:inline-flex lg:-mr-2">
          {showCmdSymbol ? (
            <kbd className="text-lg text-gray-600">⌘</kbd>
          ) : (
            <React.Fragment>
              <kbd className="text-xs text-gray-600">Ctrl</kbd>
              <span className="text-xs text-gray-400">+</span>
            </React.Fragment>
          )}
          <kbd className="text-xs text-gray-600">K</kbd>
        </div>
      </Button>
      <Dialog.Root open={dialogOpen} onOpenChange={handleCloseDialog}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-all duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
          {containedScroll ? (
            <Dialog.Viewport className="group/dialog fixed inset-0 flex items-start justify-center overflow-hidden pt-18">
              <Dialog.Popup
                ref={popupRef}
                initialFocus={inputRef}
                data-open={dialogOpen}
                className="relative flex rounded-2xl min-h-0 max-h-[min(29.5rem,calc(100vh-6rem))] w-[min(34rem,calc(100vw-2rem))] flex-col overflow-hidden bg-white text-gray-900 outline-1 outline-black/4 shadow-[0_.5px_1px_hsl(0_0%_0%/12%),0_1px_3px_-1px_hsl(0_0%_0%/4%),0_2px_4px_-1px_hsl(0_0%_0%/4%),0_4px_8px_-2px_hsl(0_0%_0%/4%),0_12px_14px_-4px_hsl(0_0%_0%/4%),0_24px_64px_-8px_hsl(0_0%_0%/4%),0_40px_48px_-32px_hsl(0_0%_0%/4%)] transition-all duration-150 data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:-translate-y-4 data-starting-style:scale-90 data-starting-style:opacity-0 data-starting-style:-translate-y-4 dark:bg-[oklch(20%_0.5%_264deg)] dark:outline-white/25"
              >
                <Autocomplete.Root
                  items={searchResults.results}
                  onValueChange={handleValueChange}
                  onOpenChange={handleAutocompleteEscape}
                  onItemHighlighted={handleItemHighlighted}
                  open
                  inline
                  itemToStringValue={itemToStringValue}
                  filter={null}
                  autoHighlight="always"
                  keepHighlight
                >
                  <div className="shrink-0 border-b border-gray-100 pt-2 px-2 pb-1.5">
                    {searchInput}
                  </div>
                  <div className="flex min-h-0 flex-1">
                    <ScrollArea.Root className="relative flex min-h-0 flex-1 overflow-hidden">
                      <ScrollArea.Viewport className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-pt-9 scroll-pb-2">
                        <ScrollArea.Content style={{ minWidth: '100%' }}>
                          {searchResults.results.length === 0 ? (
                            <EmptyState />
                          ) : (
                            <Autocomplete.List
                              className="outline-0 p-2"
                              onKeyDownCapture={handleKeyDownCapture}
                            >
                              {renderResultsList}
                            </Autocomplete.List>
                          )}
                        </ScrollArea.Content>
                      </ScrollArea.Viewport>
                      <ScrollArea.Scrollbar className="SearchScrollbar ">
                        <ScrollArea.Thumb className="SearchScrollbarThumb" />
                      </ScrollArea.Scrollbar>
                    </ScrollArea.Root>
                  </div>
                  <div className="border-t border-gray-100 py-2 flex pl-3 pr-2 text-gray-500 text-xs">
                    <div className={`flex items-center gap-3`}>
                      <kbd
                        aria-label="Enter"
                        className="flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-gray-50 text-[10px] text-gray-600"
                      >
                        <CornerDownLeft size={12} />
                      </kbd>
                      <span>Go to page</span>
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
                      className="relative mx-auto rounded-2xl mt-18 mb-18 w-[min(40rem,calc(100vw-2rem))] bg-white text-gray-900 outline-1 outline-black/4 shadow-[0_.5px_1px_hsl(0_0%_0%/12%),0_1px_3px_-1px_hsl(0_0%_0%/4%),0_2px_4px_-1px_hsl(0_0%_0%/4%),0_4px_8px_-2px_hsl(0_0%_0%/4%),0_12px_14px_-4px_hsl(0_0%_0%/4%),0_24px_64px_-8px_hsl(0_0%_0%/4%),0_40px_48px_-32px_hsl(0_0%_0%/4%)] transition-all duration-150 data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:-translate-y-4 data-starting-style:scale-90 data-starting-style:opacity-0 data-starting-style:-translate-y-4 dark:bg-[oklch(20%_0.5%_264deg)] dark:outline-white/25"
                    >
                      <Autocomplete.Root
                        items={searchResults.results}
                        onValueChange={handleValueChange}
                        onOpenChange={handleAutocompleteEscape}
                        onItemHighlighted={handleItemHighlighted}
                        open
                        inline
                        itemToStringValue={itemToStringValue}
                        filter={null}
                        autoHighlight
                      >
                        <div className="border-b border-gray-100 p-2 pb-1.5">{searchInput}</div>
                        <div>
                          {searchResults.results.length === 0 ? (
                            <EmptyState />
                          ) : (
                            <Autocomplete.List
                              className="outline-0 overflow-y-auto p-2 scroll-pt-9 scroll-pb-2 overscroll-contain max-h-[min(22.5rem,var(--available-height))] rounded-b-[5px]"
                              onKeyDownCapture={handleKeyDownCapture}
                            >
                              {renderResultsList}
                            </Autocomplete.List>
                          )}
                        </div>
                      </Autocomplete.Root>
                    </Dialog.Popup>
                  </ScrollArea.Content>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar className="SearchScrollbar ">
                  <ScrollArea.Thumb className="SearchScrollbarThumb" />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            </Dialog.Viewport>
          )}
        </Dialog.Portal>
      </Dialog.Root>
    </React.Fragment>
  );
}
