'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
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
import { FileText, Blocks, Package, Heading1, Heading2, Search } from 'lucide-react';
import './SearchBar.css';
import { ExpandingBox } from './ExpandingBox';

function normalizeGroupName(name: string) {
  if (name.startsWith('React ')) {
    name = name.replace('React ', '');
  }

  if (name.endsWith(' page')) {
    return name.replace(' page', '');
  }

  if (name.endsWith(' export')) {
    return name.replace(' export', ' API Reference');
  }

  if (name.endsWith(' part')) {
    return name.replace(' part', ' API Reference');
  }

  return name;
}

export function SearchBar({
  sitemap: sitemapImport,
  enableKeyboardShortcut = false,
}: {
  sitemap: () => Promise<{ sitemap?: Sitemap }>;
  enableKeyboardShortcut?: boolean;
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
    maxDefaultResults: 10,
    tolerance: 1,
    limit: 20,
    enableStemming: true,
    boost: {
      type: 100,
      slug: 2,
      path: 2,
      title: 2,
      page: 3.5,
      pageKeywords: 15,
      description: 1.5,
      part: 1.5,
      export: 1.3,
      sectionTitle: 50,
      section: 3,
      subsection: 3,
      props: 1.5,
      dataAttributes: 1.5,
      cssVariables: 1.5,
      sections: 0.7,
      subsections: 0.3,
      keywords: 1.5,
    },
  });

  const [searchResults, setSearchResults] = React.useState<SearchResults>(defaultResults);

  // Update search results when hook results change
  React.useEffect(() => {
    setSearchResults(results);
  }, [results, defaultResults]);

  // Reset to default results when dialog closes
  React.useEffect(() => {
    if (!dialogOpen) {
      setSearchResults(defaultResults);
    }
  }, [dialogOpen, defaultResults]);

  const handleOpenDialog = React.useCallback(() => {
    // Prevent double-opening across all instances
    if (openingRef.current) {
      return;
    }
    openingRef.current = true;

    if ('startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        ReactDOM.flushSync(() => {
          setDialogOpen(true);
        });
      });
    } else {
      setDialogOpen(true);
    }

    // Reset after a short delay
    setTimeout(() => {
      openingRef.current = false;
    }, 100);
  }, []);

  const handleCloseDialog = React.useCallback((open: boolean) => {
    if (!open) {
      // Prevent double-closing across all instances
      if (closingRef.current) {
        return;
      }
      closingRef.current = true;

      if ('startViewTransition' in document) {
        const transition = (document as any).startViewTransition(() => {
          ReactDOM.flushSync(() => {
            setDialogOpen(false);
          });
        });

        transition.finished.then(() => {
          // Results will be reset by useEffect
        });
      } else {
        setDialogOpen(false);
        // Results will be reset by useEffect
      }

      // Reset after a short delay
      setTimeout(() => {
        closingRef.current = false;
      }, 100);
    } else {
      setDialogOpen(true);
    }
  }, []);

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
      await search(value, { groupBy: { properties: ['type'], maxResult: 5 } });
    },
    [search],
  );

  const handleItemClick = React.useCallback(
    (result: SearchResult) => {
      const url = buildResultUrl(result);
      handleCloseDialog(false);
      router.push(url);
    },
    [router, handleCloseDialog, buildResultUrl],
  );

  return (
    <React.Fragment>
      <Button
        onClick={handleOpenDialog}
        className={`search-button relative h-7 w-50 text-left text-sm font-normal text-gray-900 ${dialogOpen ? 'search-button-hidden' : ''}`}
      >
        <ExpandingBox isActive={!dialogOpen} className="pt-0.75 pb-0.75 pl-3 pr-3">
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
        </ExpandingBox>
      </Button>
      <Dialog.Root open={dialogOpen} onOpenChange={handleCloseDialog}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/5%)_0,rgb(0_0_0/10%)_50%)] opacity-100 transition-[backdrop-filter,opacity] duration-600 ease-out-fast backdrop-blur-[1.5px] data-starting-style:backdrop-blur-0 data-starting-style:opacity-0 data-ending-style:backdrop-blur-0 data-ending-style:opacity-0 data-ending-style:duration-350 data-ending-style:ease-in-slow dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
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
                    className="search-dialog-popup relative mx-auto my-18 w-[min(40rem,calc(100vw-2rem))] p-0 text-gray-900 transition-[transform,scale,opacity] duration-300 ease-out-fast data-starting-style:scale-90 data-starting-style:opacity-0 data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:duration-250 data-ending-style:ease-in-slow motion-reduce:transition-none"
                  >
                    <ExpandingBox isActive={dialogOpen} className="px-4 py-3">
                      <Autocomplete.Root
                        items={searchResults}
                        onValueChange={handleValueChange}
                        onOpenChange={handleAutocompleteEscape}
                        open // we never want to close the autocomplete, only the dialog
                        itemToStringValue={(item) => (item ? item.title || item.slug : '')}
                        filter={null}
                        autoHighlight
                      >
                        <div>
                          <label htmlFor="search-input" className="sr-only">
                            Search...
                          </label>
                          <div className="flex items-center gap-2">
                            <Search className="search-icon h-4 w-4 text-gray-500" />
                            <Autocomplete.Input
                              id="search-input"
                              ref={inputRef}
                              placeholder="Search"
                              className="w-full border-0 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none"
                            />
                            <Button
                              onClick={handleEscapeButtonClick}
                              className="expanding-box-content-right rounded border border-gray-300 bg-gray-50 px-1.5 hidden hover:bg-gray-100 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 lg:flex"
                            >
                              <kbd className="text-xs text-gray-600 whitespace-nowrap">esc</kbd>
                            </Button>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 mt-3 -ml-4 -mr-4">
                          {searchResults.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-600">
                              No results found.
                            </div>
                          ) : (
                            <Autocomplete.List className="outline-0 overflow-y-auto scroll-pt-[2.25rem] scroll-pb-[0.5rem] overscroll-contain max-h-[min(22.5rem,var(--available-height))]">
                              {(group: SearchResults[number]) => (
                                <Autocomplete.Group
                                  key={group.group}
                                  items={group.items}
                                  className="block pb-2"
                                >
                                  {group.group !== 'Default' && (
                                    <Autocomplete.GroupLabel className="sticky top-0 z-[1] m-0 w-100% bg-[canvas] px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider">
                                      {normalizeGroupName(group.group)}s
                                    </Autocomplete.GroupLabel>
                                  )}
                                  <Autocomplete.Collection>
                                    {(result: SearchResult, i) => (
                                      <Autocomplete.Item
                                        key={result.id || i}
                                        value={result}
                                        onClick={() => handleItemClick(result)}
                                        className="flex cursor-default select-none flex-col gap-1 px-4 py-3 text-base leading-4 outline-none hover:bg-gray-100 data-highlighted:bg-gray-900 data-highlighted:text-gray-50"
                                      >
                                        <div className="flex items-baseline justify-between gap-2">
                                          <div className="flex items-baseline gap-2">
                                            {result.type === 'page' && (
                                              <FileText className="h-4 w-4" />
                                            )}
                                            {result.type === 'part' && (
                                              <Blocks className="h-4 w-4" />
                                            )}
                                            {result.type === 'export' && (
                                              <Package className="h-4 w-4" />
                                            )}
                                            {result.type === 'section' && (
                                              <Heading1 className="h-4 w-4" />
                                            )}
                                            {result.type === 'subsection' && (
                                              <Heading2 className="h-4 w-4" />
                                            )}
                                            <strong className="font-semibold">
                                              {result.title}
                                            </strong>
                                            {result.type === 'page' && (
                                              <span className="text-xs opacity-50 capitalize">
                                                {result.sectionTitle.replace('React ', '')}
                                              </span>
                                            )}
                                          </div>
                                          {process.env.NODE_ENV === 'development' &&
                                            result.score && (
                                              <span className="text-xs opacity-70">
                                                {result.score.toFixed(2)}
                                              </span>
                                            )}
                                        </div>
                                        {result.type === 'page' && result.description && (
                                          <div className="mt-0.5 text-sm opacity-80">
                                            {result.description}
                                          </div>
                                        )}
                                      </Autocomplete.Item>
                                    )}
                                  </Autocomplete.Collection>
                                </Autocomplete.Group>
                              )}
                            </Autocomplete.List>
                          )}
                        </div>
                      </Autocomplete.Root>
                    </ExpandingBox>
                  </Dialog.Popup>
                </ScrollArea.Content>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className="pointer-events-none absolute m-[0.4rem] flex w-1 justify-center rounded-2xl opacity-0 transition-opacity duration-250 data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-75 data-scrolling:delay-0 hover:pointer-events-auto hover:opacity-100 hover:duration-75 hover:delay-0 md:w-1.75 group-data-ending-style/dialog:opacity-0 group-data-ending-style/dialog:duration-300">
                <ScrollArea.Thumb className="w-full rounded-[inherit] bg-gray-500 before:absolute before:content-[''] before:top-1/2 before:left-1/2 before:h-[calc(100%+1rem)] before:w-[calc(100%+1rem)] before:-translate-x-1/2 before:-translate-y-1/2" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </React.Fragment>
  );
}
