'use client';
import * as React from 'react';
import NextLink from 'next/link';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Drawer } from '@base-ui/react/drawer';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { useSearch } from '@mui/internal-docs-infra/useSearch';
import type {
  SearchResult,
  SearchResults,
  Sitemap,
} from '@mui/internal-docs-infra/useSearch/types';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { stringToUrl } from './QuickNav/rehypeSlug.mjs';

const sitemapPromise: () => Promise<{ sitemap?: Sitemap }> = () => import('../app/sitemap');
const showPrivatePages = process.env.SHOW_PRIVATE_PAGES === 'true';

// Semver pattern to detect version headings (e.g., v1.0.0, v1.0.0-rc.0).
// Matches the search slug behavior used by the desktop search dialog.
const SEMVER_PATTERN =
  /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

interface MobileNavDrawerProps extends Omit<Drawer.Root.Props, 'children' | 'handle'> {
  children?: React.ReactNode;
  handle: Drawer.Handle<unknown>;
}

export function MobileNavDrawer({ children, handle, onOpenChange, ...props }: MobileNavDrawerProps) {
  const [searchValue, setSearchValue] = React.useState('');

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean, eventDetails: Drawer.Root.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails);

      if (!nextOpen) {
        setSearchValue('');
      }
    },
    [onOpenChange],
  );

  return (
    <Drawer.Root swipeDirection="down" {...props} handle={handle} onOpenChange={handleOpenChange}>
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop className="MobileNavBackdrop" />
          <Drawer.Viewport className="MobileNavViewport">
            <Drawer.Popup className="MobileNavPopup">
              <Drawer.Title className="bui-sr-only">Docs navigation</Drawer.Title>
              <MobileNavPopupImpl
                handle={handle}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
              >
                {children}
              </MobileNavPopupImpl>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  );
}

function slugifyWithParentContext(text: string, parentTitles?: string[]): string {
  const slug = stringToUrl(text);

  if (parentTitles?.length && SEMVER_PATTERN.test(parentTitles[0])) {
    return `${parentTitles[0]}-${slug}`;
  }

  return slug;
}

function normalizeGroup(group: string) {
  return group.replace(/\s+Pages$/, '').replace(/^React\s+/, '');
}

interface MobileNavPopupImplProps extends React.PropsWithChildren {
  handle: Drawer.Handle<unknown>;
  searchValue: string;
  setSearchValue: (value: string) => void;
}

function MobileNavPopupImpl({
  children,
  handle,
  searchValue,
  setSearchValue,
}: MobileNavPopupImplProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const highlightedResultRef = React.useRef<SearchResult | undefined>(undefined);
  const hasQuery = searchValue.trim() !== '';
  const { results, search, defaultResults, buildResultUrl } = useSearch({
    sitemap: sitemapPromise,
    generateSlug: slugifyWithParentContext,
    tolerance: 0,
    limit: 20,
    enableStemming: true,
    includeCategoryInGroup: true,
    excludeSections: true,
    showPrivatePages,
  });

  const [searchResults, setSearchResults] =
    React.useState<ReturnType<typeof useSearch>['results']>(defaultResults);

  React.useEffect(() => {
    setSearchResults(results);
  }, [results]);

  const itemToStringValue = React.useCallback(
    (item: SearchResult | null) => (item ? item.title || item.slug : ''),
    [],
  );

  const handleValueChange = React.useCallback(
    async (value: string) => {
      setSearchValue(value);
      await search(value, { groupBy: { properties: ['group'], maxResult: 5 } });
    },
    [search, setSearchValue],
  );

  const handleClearSearch = React.useCallback(async () => {
    setSearchValue('');
    await search('', { groupBy: { properties: ['group'], maxResult: 5 } });
    inputRef.current?.focus();
  }, [search, setSearchValue]);

  const handleItemHighlighted = React.useCallback((item: SearchResult | undefined) => {
    highlightedResultRef.current = item;
  }, []);

  const handleResultNavigate = React.useCallback(() => {
    handle.close();
    setSearchValue('');
  }, [handle, setSearchValue]);

  const handleAutocompleteOpenChange = React.useCallback(
    (open: boolean, eventDetails: Autocomplete.Root.ChangeEventDetails) => {
      if (open || eventDetails.reason !== 'escape-key') {
        return;
      }

      if (searchValue) {
        setSearchValue('');
      } else {
        handle.close();
      }
    },
    [handle, searchValue, setSearchValue],
  );

  const handleKeyDownCapture = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && searchValue) {
        event.preventDefault();
        event.stopPropagation();
        setSearchValue('');
        return;
      }

      if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey && !event.altKey)) {
        return;
      }

      const highlightedResult = highlightedResultRef.current;
      if (!highlightedResult) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      window.open(buildResultUrl(highlightedResult), '_blank', 'noopener,noreferrer');
    },
    [buildResultUrl, searchValue, setSearchValue],
  );

  const renderResultsList = React.useCallback(
    (group: SearchResults[number]) => (
      <Autocomplete.Group key={group.group} items={group.items} className="MobileNavSection">
        {group.group !== 'Default' && (
          <Autocomplete.GroupLabel
            id={`mobile-nav-search-group-${group.group}`}
            className="MobileNavHeading"
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
                <NextLink
                  href={buildResultUrl(result)}
                  onNavigate={handleResultNavigate}
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

  return (
    <Autocomplete.Root
      items={searchResults.results}
      value={searchValue}
      onValueChange={handleValueChange}
      onOpenChange={handleAutocompleteOpenChange}
      onItemHighlighted={handleItemHighlighted}
      open={hasQuery}
      inline
      itemToStringValue={itemToStringValue}
      filter={null}
      autoHighlight={hasQuery}
    >
      <div className="MobileNavSearchHeader">
        <div className="MobileNavChromeRow">
          <div className="MobileNavHandle" />
          <Drawer.Close aria-label="Close the navigation" className="MobileNavClose">
            Close
          </Drawer.Close>
        </div>
        <div className="MobileNavSearchInputRoot">
          <MagnifyingGlassIcon className="MobileNavSearchIcon" />
          <Autocomplete.Input
            id="mobile-docs-search-input"
            ref={inputRef}
            aria-label="Search docs"
            placeholder="Search docs"
            className="MobileNavSearchInput"
            onKeyDownCapture={handleKeyDownCapture}
          />
          {searchValue && (
            <button
              type="button"
              aria-label="Clear search"
              className="MobileNavClearSearch"
              onClick={handleClearSearch}
              onPointerDown={(event) => event.preventDefault()}
            >
              <XIcon className="MobileNavClearSearchIcon" />
            </button>
          )}
        </div>
      </div>
      <Drawer.Content className="MobileNavContent">
        <ScrollArea.Root className="MobileNavScrollAreaRoot">
          <ScrollArea.Viewport className="MobileNavScrollAreaViewport">
            <ScrollArea.Content className="MobileNavScrollAreaContent">
              {hasQuery ? (
                <div className="MobileNavSearchResults">
                  {searchResults.results.length === 0 ? (
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
              ) : (
                <nav aria-label="Docs navigation" className="MobileNavPanel">
                  {children}
                </nav>
              )}
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
            <span className="MobileNavSearchBreadcrumbPart">{part}</span>
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
