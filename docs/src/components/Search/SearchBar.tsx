'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { useSearch } from '@mui/internal-docs-infra/useSearch';
import type { SearchResult, Sitemap } from '@mui/internal-docs-infra/useSearch/types';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import { Button } from '@base-ui-components/react/button';
import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { FileText, Blocks, Package, Heading1, Heading2, Search } from 'lucide-react';
import './SearchBar.css';

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
      type: 3,
      slug: 2,
      path: 2,
      title: 2,
      description: 1.5,
      part: 1.5,
      export: 1.3,
      section: 2,
      subsection: 1.8,
      props: 1.5,
      dataAttributes: 1.5,
      cssVariables: 1.5,
      sections: 0.7,
      subsections: 0.3,
      keywords: 1.7,
    },
  });

  const [searchResults, setSearchResults] = React.useState<SearchResult[]>(defaultResults);

  // Update search results when hook results change
  React.useEffect(() => {
    setSearchResults(results.length > 0 ? results : defaultResults);
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
      await search(value);
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
      <button
        type="button"
        onClick={handleOpenDialog}
        className={`search-button relative h-7 w-50 rounded-md border border-gray-200 bg-gray-50 pl-3 pr-3 text-left text-sm font-normal text-gray-900 hover:bg-gray-100 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 lg:pr-16 ${dialogOpen ? 'search-button-hidden' : ''}`}
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">Search</span>
        </div>
        <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 gap-1 rounded border border-gray-300 bg-gray-50 px-1.5 lg:flex">
          <kbd className="text-xs text-gray-600">⌘</kbd>
          <kbd className="text-xs text-gray-600">K</kbd>
        </div>
      </button>
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
                    className="search-dialog-popup outline-0 relative mx-auto my-18 w-[min(40rem,calc(100vw-2rem))] rounded-lg bg-gray-50 p-0 text-gray-900 shadow-[0_10px_64px_-10px_rgba(36,40,52,0.2),0_0.25px_0_1px_rgba(229,231,235,1)] transition-[transform,scale,opacity] duration-300 ease-out-fast data-starting-style:scale-90 data-starting-style:opacity-0 data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:duration-250 data-ending-style:ease-in-slow dark:outline-1 dark:outline-gray-300 motion-reduce:transition-none"
                  >
                    <Autocomplete.Root
                      items={searchResults}
                      onValueChange={handleValueChange}
                      onOpenChange={handleAutocompleteEscape}
                      open // we never want to close the autocomplete, only the dialog
                      itemToStringValue={(item) => (item ? item.title : '')}
                      filter={null}
                      autoHighlight
                    >
                      <div className="border-b border-gray-200 px-4 py-3">
                        <label htmlFor="search-input" className="sr-only">
                          Search...
                        </label>
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-gray-500" />
                          <Autocomplete.Input
                            id="search-input"
                            ref={inputRef}
                            placeholder="Search"
                            className="w-full border-0 bg-transparent text-base text-gray-900 placeholder:text-gray-500 focus:outline-none"
                          />
                          <Button
                            onClick={handleEscapeButtonClick}
                            className="rounded border border-gray-300 bg-gray-50 px-1.5 hidden hover:bg-gray-100 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 lg:flex"
                          >
                            <kbd className="text-xs text-gray-600 whitespace-nowrap">esc</kbd>
                          </Button>
                        </div>
                      </div>

                      <div className="py-2">
                        {searchResults.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-gray-600">
                            No results found.
                          </div>
                        ) : (
                          <Autocomplete.List>
                            {(result: SearchResult, i) => (
                              <Autocomplete.Item
                                key={result.id || i}
                                value={result}
                                onClick={() => handleItemClick(result)}
                                className="flex cursor-default select-none flex-col gap-1 px-4 py-3 text-base leading-4 outline-none hover:bg-gray-100 data-highlighted:bg-gray-900 data-highlighted:text-gray-50"
                              >
                                <div className="flex items-baseline justify-between gap-2">
                                  <div className="flex items-baseline gap-2">
                                    {result.type === 'page' && <FileText className="h-4 w-4" />}
                                    {result.type === 'part' && <Blocks className="h-4 w-4" />}
                                    {result.type === 'export' && <Package className="h-4 w-4" />}
                                    {result.type === 'section' && <Heading1 className="h-4 w-4" />}
                                    {result.type === 'subsection' && (
                                      <Heading2 className="h-4 w-4" />
                                    )}
                                    <strong className="font-semibold">{result.title}</strong>
                                    <span className="text-xs opacity-50 capitalize">
                                      {result.type}
                                    </span>
                                  </div>
                                  {process.env.NODE_ENV === 'development' && result.score && (
                                    <span className="text-xs opacity-70">
                                      {result.score.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm opacity-70">
                                  {result.sectionTitle.replace('React ', '')}
                                </div>
                                {result.type === 'page' && result.description && (
                                  <div className="mt-0.5 text-sm opacity-80">
                                    {result.description}
                                  </div>
                                )}
                              </Autocomplete.Item>
                            )}
                          </Autocomplete.List>
                        )}
                      </div>
                    </Autocomplete.Root>
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
