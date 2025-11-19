'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { create, insertMultiple, search as performSearch } from '@orama/orama';
import { stemmer, language } from '@orama/stemmers/english';
import { stopwords as englishStopwords } from '@orama/stopwords/english';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import { Dialog } from '@base-ui-components/react/dialog';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import './SearchBar.css';

interface SearchResult {
  id?: string;
  title: string;
  description: string;
  slug: string;
  section: string;
  prefix: string;
  score?: number;
}

export function SearchBar({
  sitemap: sitemapImport,
  enableKeyboardShortcut = false,
}: {
  sitemap: () => Promise<{ sitemap?: { schema: {}; data: {} } }>;
  enableKeyboardShortcut?: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = React.useState<any>(null);
  const defaultResults = React.useRef<SearchResult[]>([]);
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const openingRef = React.useRef(false);
  const closingRef = React.useRef(false);

  React.useEffect(() => {
    sitemapImport().then(({ sitemap }) => {
      if (!sitemap) {
        console.error('Sitemap is undefined');
        return;
      }

      const searchIndex = create({
        schema: {
          ...sitemap.schema,
          keywords: 'string',
          sections: 'string',
          subsections: 'string',
          parts: 'string',
          props: 'string',
          dataAttributes: 'string',
          cssVariables: 'string',
        },
        components: {
          tokenizer: {
            stemming: true,
            language,
            stemmer,
            stopWords: englishStopwords,
          },
        },
      });

      /**
       * Recursively extracts all section titles from a HeadingHierarchy structure
       * @param hierarchy The heading hierarchy object
       * @returns Array of all section titles (flattened)
       */
      function extractSubsections(hierarchy: any): string[] {
        const subsections: string[] = [];

        for (const section of Object.values(hierarchy)) {
          const { title, children } = section as any;
          subsections.push(title);

          if (children && Object.keys(children).length > 0) {
            subsections.push(...extractSubsections(children));
          }
        }

        return subsections;
      }

      // Flatten the sitemap data structure to a single array of pages
      const pages = Object.entries(sitemap.data).flatMap(
        ([_sectionKey, sectionData]: [string, any]) => {
          return (sectionData.pages || []).map((page: any) => {
            // Extract top-level sections and all subsections
            const sections: string[] = [];
            const subsections: string[] = [];

            if (page.sections) {
              // Top-level sections are the direct children
              sections.push(...Object.values(page.sections).map((s: any) => s.title));

              // Subsections are all nested children (recursively)
              for (const section of Object.values(page.sections)) {
                const { children } = section as any;
                if (children && Object.keys(children).length > 0) {
                  subsections.push(...extractSubsections(children));
                }
              }
            }

            const flattened: Record<string, string> = {};
            if (page.keywords?.length > 0) {
              flattened.keywords = page.keywords.join(' ');
            }

            if (sections?.length > 0) {
              flattened.sections = sections.join(' ');
            }

            if (subsections?.length > 0) {
              flattened.subsections = subsections.join(' ');
            }

            if (page.parts?.length > 0) {
              flattened.parts = page.parts.join(' ');
            }

            if (page.props?.length > 0) {
              flattened.props = page.props.join(' ');
            }

            if (page.dataAttributes?.length > 0) {
              flattened.dataAttributes = page.dataAttributes.join(' ');
            }

            if (page.cssVariables?.length > 0) {
              flattened.cssVariables = page.cssVariables.join(' ');
            }

            return {
              title: page.title,
              slug: page.slug,
              description: page.description,
              section: sectionData.title,
              prefix: sectionData.prefix,
              ...flattened,
            };
          });
        },
      );

      insertMultiple(searchIndex, pages);
      setIndex(searchIndex);
      setSearchResults(pages);
      defaultResults.current = pages;
    });
  }, [sitemapImport]);

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
          setSearchResults(defaultResults.current);
        });
      } else {
        setDialogOpen(false);
        setTimeout(() => {
          setSearchResults(defaultResults.current);
        }, 300);
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
      if (!index || !value.trim()) {
        setSearchResults([]);
        return;
      }

      const results = await performSearch(index, {
        term: value,
        tolerance: 1, // how many character differences are allowed for typos
        boost: {
          slug: 2,
          path: 2,
          title: 2,
          description: 2,
          parts: 1.5,
          props: 1.5,
          dataAttributes: 1.5,
          cssVariables: 1.5,
          sections: 2,
          subsections: 1.7,
          keywords: 1.7,
        },
      });
      const formattedResults: SearchResult[] = results.hits.map((hit: any) => ({
        id: hit.id,
        title: hit.document.title,
        description: hit.document.description || '',
        slug: hit.document.slug,
        section: hit.document.section,
        prefix: hit.document.prefix,
        score: hit.score,
      }));

      setSearchResults(formattedResults);
    },
    [index],
  );

  const handleItemClick = React.useCallback(
    (result: SearchResult) => {
      const url = `${result.prefix}${result.slug}`;
      handleCloseDialog(false);
      router.push(url);
    },
    [router, handleCloseDialog],
  );

  return (
    <React.Fragment>
      <button
        type="button"
        onClick={handleOpenDialog}
        className={`search-button relative h-7 w-52 rounded-md border border-gray-200 bg-gray-50 pl-3 pr-3 text-left text-sm font-normal text-gray-900 hover:bg-gray-100 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 lg:pr-16 ${dialogOpen ? 'search-button-hidden' : ''}`}
      >
        <span className="text-gray-600">Search...</span>
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
                      open
                      itemToStringValue={(item) => (item ? item.title : '')}
                      filter={null}
                      autoHighlight
                    >
                      <div className="border-b border-gray-200 px-4 py-3">
                        <label htmlFor="search-input" className="sr-only">
                          Search...
                        </label>
                        <Autocomplete.Input
                          id="search-input"
                          ref={inputRef}
                          placeholder="Search..."
                          className="w-full border-0 bg-transparent text-base text-gray-900 placeholder:text-gray-500 focus:outline-none"
                        />
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
                                  <strong className="font-semibold">{result.title}</strong>
                                  {result.score && (
                                    <span className="text-xs opacity-70">
                                      {result.score.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm opacity-70">
                                  {result.section.replace('React ', '')}
                                </div>
                                {result.description && (
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
