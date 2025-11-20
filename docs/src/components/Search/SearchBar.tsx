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

interface BaseSearchResult {
  id?: string;
  title: string;
  description: string;
  slug: string;
  path: string;
  sectionTitle: string;
  prefix: string;
  keywords?: string;
  score?: number;
}

interface PageSearchResult extends BaseSearchResult {
  type: 'page';
  sections?: string;
  subsections?: string;
}

interface PartSearchResult extends BaseSearchResult {
  type: 'part';
  part: string;
  export: string;
  props?: string;
  dataAttributes?: string;
  cssVariables?: string;
}

interface ExportSearchResult extends BaseSearchResult {
  type: 'export';
  export: string;
  props?: string;
  dataAttributes?: string;
  cssVariables?: string;
}

interface SectionSearchResult extends BaseSearchResult {
  type: 'section';
  section: string;
}

interface SubsectionSearchResult extends BaseSearchResult {
  type: 'subsection';
  subsection: string;
}

type SearchResult =
  | PageSearchResult
  | PartSearchResult
  | ExportSearchResult
  | SectionSearchResult
  | SubsectionSearchResult;

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
          type: 'string',
          keywords: 'string',
          sections: 'string',
          subsections: 'string',
          part: 'string',
          export: 'string',
          section: 'string',
          subsection: 'string',
          props: 'string',
          dataAttributes: 'string',
          cssVariables: 'string',
          sectionTitle: 'string',
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

      // Flatten the sitemap data structure to a single array of pages
      const pages: SearchResult[] = [];
      const pageResults: SearchResult[] = [];

      Object.entries(sitemap.data).forEach(([_sectionKey, sectionData]: [string, any]) => {
        (sectionData.pages || []).forEach((page: any) => {
          // Extract top-level sections and all subsections with their slugs
          const sections: Array<{ title: string; slug: string }> = [];
          const subsections: Array<{
            title: string;
            slug: string;
            parentSlugs: string[];
            parentTitles: string[];
          }> = [];

          if (page.sections) {
            // Top-level sections are the direct children
            for (const [slug, sectionInfo] of Object.entries(page.sections)) {
              const s = sectionInfo as any;
              sections.push({ title: s.title, slug });

              // Subsections are all nested children (recursively)
              if (s.children && Object.keys(s.children).length > 0) {
                const extractWithSlugs = (
                  hierarchy: any,
                  parentSlugs: string[],
                  parentTitles: string[],
                ): Array<{
                  title: string;
                  slug: string;
                  parentSlugs: string[];
                  parentTitles: string[];
                }> => {
                  const items: Array<{
                    title: string;
                    slug: string;
                    parentSlugs: string[];
                    parentTitles: string[];
                  }> = [];
                  for (const [childSlug, childData] of Object.entries(hierarchy)) {
                    const child = childData as any;
                    const currentSlugs = [...parentSlugs, childSlug];
                    const currentTitles = [...parentTitles, child.title];
                    items.push({
                      title: child.title,
                      slug: childSlug,
                      parentSlugs: currentSlugs,
                      parentTitles: currentTitles,
                    });
                    if (child.children && Object.keys(child.children).length > 0) {
                      items.push(...extractWithSlugs(child.children, currentSlugs, currentTitles));
                    }
                  }
                  return items;
                };
                subsections.push(...extractWithSlugs(s.children, [slug], [s.title]));
              }
            }
          }

          const flattened: Record<string, string> = {};
          if (page.keywords?.length > 0) {
            flattened.keywords = page.keywords.join(' ');
          }

          if (sections?.length > 0) {
            flattened.sections = sections.map((s) => s.title).join(' ');
          }

          if (subsections?.length > 0) {
            flattened.subsections = subsections.map((s) => s.title).join(' ');
          }

          const basePage: SearchResult = {
            type: 'page',
            title: page.title,
            slug: page.slug,
            path: page.path,
            description: page.description,
            sectionTitle: sectionData.title,
            prefix: sectionData.prefix,
            ...flattened,
          };

          // Add to both arrays
          pages.push(basePage);
          if (pageResults.length < 10) {
            pageResults.push(basePage);
          }

          // Add entries for each part
          if (page.parts && Object.keys(page.parts).length > 0) {
            for (const [partName, partData] of Object.entries(page.parts)) {
              const part = partData as any;
              pages.push({
                type: 'part',
                part: partName,
                export: `${page.slug}.${partName}`,
                slug: page.slug,
                path: page.path,
                title: `${page.title} - ${partName}`,
                description: page.description,
                sectionTitle: sectionData.title,
                prefix: sectionData.prefix,
                props: part.props ? part.props.join(' ') : '',
                dataAttributes: part.dataAttributes ? part.dataAttributes.join(' ') : '',
                cssVariables: part.cssVariables ? part.cssVariables.join(' ') : '',
                keywords: page.keywords?.length > 0 ? page.keywords.join(' ') : '',
              });
            }
          }

          // Add entries for each export
          if (page.exports && Object.keys(page.exports).length > 0) {
            for (const [exportName, exportData] of Object.entries(page.exports)) {
              const exp = exportData as any;
              // If export name matches page slug (case-insensitive), use #api-reference
              const exportSlug =
                exportName.toLowerCase() === page.slug.toLowerCase()
                  ? 'api-reference'
                  : exportName.toLowerCase();
              pages.push({
                type: 'export',
                export: exportSlug,
                slug: page.slug,
                path: page.path,
                title: exportName,
                description: page.description,
                sectionTitle: sectionData.title,
                prefix: sectionData.prefix,
                props: exp.props ? exp.props.join(' ') : '',
                dataAttributes: exp.dataAttributes ? exp.dataAttributes.join(' ') : '',
                cssVariables: exp.cssVariables ? exp.cssVariables.join(' ') : '',
                keywords: page.keywords?.length > 0 ? page.keywords.join(' ') : '',
              });
            }
          }

          // Add entries for each section
          for (const sectionItem of sections) {
            pages.push({
              type: 'section',
              section: sectionItem.title,
              slug: `${page.slug}#${sectionItem.slug}`,
              path: page.path,
              title: `${page.title} - ${sectionItem.title}`,
              description: page.description,
              sectionTitle: sectionData.title,
              prefix: sectionData.prefix,
              keywords: page.keywords?.length > 0 ? page.keywords.join(' ') : '',
            });
          }

          // Add entries for each subsection
          for (const subsectionItem of subsections) {
            const fullTitle = subsectionItem.parentTitles.join(' - ');
            pages.push({
              type: 'subsection',
              subsection: fullTitle,
              slug: `${page.slug}#${subsectionItem.slug.toLowerCase()}`,
              path: page.path,
              title: `${page.title} - ${fullTitle}`,
              description: page.description,
              sectionTitle: sectionData.title,
              prefix: sectionData.prefix,
              keywords: page.keywords?.length > 0 ? page.keywords.join(' ') : '',
            });
          }
        });
      });

      insertMultiple(searchIndex, pages);
      setIndex(searchIndex);
      defaultResults.current = pageResults;
      setSearchResults(defaultResults.current);
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

      const formattedResults: SearchResult[] = results.hits.map((hit: any) => {
        const base = {
          id: hit.id,
          title: hit.document.title,
          description: hit.document.description || '',
          slug: hit.document.slug,
          sectionTitle: hit.document.sectionTitle,
          prefix: hit.document.prefix,
          path: hit.document.path,
          score: hit.score,
          keywords: hit.document.keywords,
        };

        const type = hit.document.type;

        if (type === 'part') {
          return {
            ...base,
            type: 'part',
            part: hit.document.part,
            export: hit.document.export,
            props: hit.document.props,
            dataAttributes: hit.document.dataAttributes,
            cssVariables: hit.document.cssVariables,
          } as PartSearchResult;
        }

        if (type === 'export') {
          return {
            ...base,
            type: 'export',
            export: hit.document.export,
            props: hit.document.props,
            dataAttributes: hit.document.dataAttributes,
            cssVariables: hit.document.cssVariables,
          } as ExportSearchResult;
        }

        if (type === 'section') {
          return {
            ...base,
            type: 'section',
            section: hit.document.section,
          } as SectionSearchResult;
        }

        if (type === 'subsection') {
          return {
            ...base,
            type: 'subsection',
            subsection: hit.document.subsection,
          } as SubsectionSearchResult;
        }

        // Default to page type
        return {
          ...base,
          type: 'page',
          sections: hit.document.sections,
          subsections: hit.document.subsections,
        } as PageSearchResult;
      });

      setSearchResults(formattedResults);
    },
    [index],
  );

  const handleItemClick = React.useCallback(
    (result: SearchResult) => {
      let url = result.path.startsWith('./')
        ? `${result.prefix}${result.path.replace(/^\.\//, '').replace(/\/page\.mdx$/, '')}`
        : result.path;

      // Add hash for non-page types
      if (result.type !== 'page') {
        let hash: string;
        if (result.type === 'section' || result.type === 'subsection') {
          // For sections and subsections, extract hash from the slug field
          // which already contains the page slug + hash (e.g., "button#api-reference")
          const hashIndex = result.slug.indexOf('#');
          hash = hashIndex !== -1 ? result.slug.substring(hashIndex + 1) : '';
        } else if (result.type === 'part') {
          hash = result.part.toLowerCase();
        } else {
          // type === 'export'
          hash = result.export; // already lowercase or api-reference
        }
        url += `#${hash}`;
      }

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
                      open // we never want to close the autocomplete, only the dialog
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
                                  <div className="flex items-baseline gap-2">
                                    <strong className="font-semibold">{result.title}</strong>
                                    <span className="text-xs opacity-50 capitalize">
                                      {result.type}
                                    </span>
                                  </div>
                                  {result.score && (
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
