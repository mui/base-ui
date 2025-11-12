'use client';
import * as React from 'react';
import { create, insertMultiple, search as performSearch } from '@orama/orama';
import { Autocomplete } from '@base-ui-components/react/autocomplete';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  slug: string;
  section: string;
  prefix: string;
  score: number;
}

export function SearchBar({
  sitemap: sitemapImport,
}: {
  sitemap: () => Promise<{ sitemap?: { schema: {}; data: {} } }>;
}) {
  const [index, setIndex] = React.useState<any>(null);
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    sitemapImport().then(({ sitemap }) => {
      if (!sitemap) {
        console.error('Sitemap is undefined');
        return;
      }

      const searchIndex = create({ schema: sitemap.schema });

      // Flatten the sitemap data structure to a single array of pages
      const pages = Object.entries(sitemap.data).flatMap(
        ([_sectionKey, sectionData]: [string, any]) => {
          return (sectionData.pages || []).map((page: any) => ({
            ...page,
            section: sectionData.title,
            prefix: sectionData.prefix,
          }));
        },
      );

      insertMultiple(searchIndex, pages);
      setIndex(searchIndex);
    });
  }, [sitemapImport]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleValueChange = React.useCallback(
    async (value: string) => {
      if (!index || !value.trim()) {
        setSearchResults([]);
        return;
      }

      const results = await performSearch(index, {
        term: value,
        properties: ['title', 'description'],
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

  const handleItemClick = React.useCallback((result: SearchResult) => {
    const url = `${result.prefix}${result.slug}`;
    window.location.href = url;
  }, []);

  return (
    <Autocomplete.Root
      items={searchResults}
      onValueChange={handleValueChange}
      itemToStringValue={(item) => (item ? item.title : '')}
      autoHighlight
    >
      <label className="sr-only">Search documentation</label>
      <div className="relative">
        <Autocomplete.Input
          ref={inputRef}
          placeholder="Search"
          className="h-7 w-full max-w-70 rounded-md border border-gray-200 bg-[canvas] pl-3 pr-3 text-sm font-normal text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800 lg:pr-16"
        />
        <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 gap-1 rounded border border-gray-300 bg-gray-50 px-1.5 lg:flex">
          <kbd className="text-xs text-gray-600">⌘</kbd>
          <kbd className="text-xs text-gray-600">K</kbd>
        </div>
      </div>

      <Autocomplete.Portal>
        <Autocomplete.Positioner className="outline-none" sideOffset={4}>
          <Autocomplete.Popup className="max-h-[min(var(--available-height),23rem)] w-[var(--anchor-width)] max-w-[var(--available-width)] overflow-y-auto overscroll-contain scroll-pb-2 scroll-pt-2 rounded-md bg-[canvas] py-2 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 dark:-outline-offset-1 dark:shadow-none dark:outline-gray-300">
            <Autocomplete.Empty className="empty:m-0 empty:p-0 px-4 py-2 text-[0.925rem] leading-4 text-gray-600">
              No results found.
            </Autocomplete.Empty>
            <Autocomplete.List>
              {(result: SearchResult) => (
                <Autocomplete.Item
                  key={result.id}
                  value={result}
                  onClick={() => handleItemClick(result)}
                  className="flex cursor-default select-none flex-col gap-1 py-2 pl-4 pr-8 text-base leading-4 outline-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded data-[highlighted]:before:bg-gray-900"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <strong className="font-semibold">{result.title}</strong>
                    <span className="text-xs opacity-70">{result.score.toFixed(2)}</span>
                  </div>
                  <div className="text-sm opacity-70">
                    {result.section} → {result.slug}
                  </div>
                  {result.description && (
                    <div className="mt-0.5 text-sm opacity-80">{result.description}</div>
                  )}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
