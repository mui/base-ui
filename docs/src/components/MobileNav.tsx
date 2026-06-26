'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
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
import './MobileNav.css';

const sitemapPromise: () => Promise<{ sitemap?: Sitemap }> = () => import('../app/sitemap');
const showPrivatePages = process.env.SHOW_PRIVATE_PAGES === 'true';

// Semver pattern to detect version headings (e.g., v1.0.0, v1.0.0-rc.0).
// Matches the search slug behavior used by the desktop search dialog.
const SEMVER_PATTERN =
  /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

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

const MobileNavState = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
}>({
  open: false,
  setOpen: () => undefined,
  searchValue: '',
  setSearchValue: () => undefined,
});

interface RootProps extends Drawer.Root.Props {
  enableKeyboardShortcut?: boolean;
  keyboardShortcutMediaQuery?: string;
}

export function Root({
  enableKeyboardShortcut = false,
  keyboardShortcutMediaQuery,
  onOpenChange,
  ...props
}: RootProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean, eventDetails: Drawer.Root.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails);
      setOpen(nextOpen);

      if (!nextOpen) {
        setSearchValue('');
      }
    },
    [onOpenChange],
  );

  React.useEffect(() => {
    if (!enableKeyboardShortcut) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (keyboardShortcutMediaQuery && !window.matchMedia(keyboardShortcutMediaQuery).matches) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [enableKeyboardShortcut, keyboardShortcutMediaQuery]);

  const contextValue = React.useMemo(
    () => ({ open, setOpen, searchValue, setSearchValue }),
    [open, searchValue],
  );

  return (
    <MobileNavState.Provider value={contextValue}>
      <Drawer.Root swipeDirection="down" {...props} open={open} onOpenChange={handleOpenChange} />
    </MobileNavState.Provider>
  );
}

export const Trigger = Drawer.Trigger;

export function Backdrop(props: Drawer.Backdrop.Props) {
  return <Drawer.Backdrop {...props} className={clsx('MobileNavBackdrop', props.className)} />;
}

export function Portal(props: Drawer.Portal.Props) {
  return (
    <Drawer.VirtualKeyboardProvider>
      <Drawer.Portal {...props} />
    </Drawer.VirtualKeyboardProvider>
  );
}

export function Popup({ children, ...props }: Drawer.Popup.Props) {
  return (
    <Drawer.Viewport className="MobileNavViewport">
      <Drawer.Popup {...props} className={clsx('MobileNavPopup', props.className)}>
        <Drawer.Title className="bui-sr-only">Docs navigation</Drawer.Title>
        <PopupImpl>{children}</PopupImpl>
      </Drawer.Popup>
    </Drawer.Viewport>
  );
}

function PopupImpl(props: React.PropsWithChildren) {
  const { searchValue, setSearchValue, setOpen } = React.useContext(MobileNavState);
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
    setOpen(false);
    setSearchValue('');
  }, [setOpen, setSearchValue]);

  const handleAutocompleteOpenChange = React.useCallback(
    (open: boolean, eventDetails: Autocomplete.Root.ChangeEventDetails) => {
      if (open || eventDetails.reason !== 'escape-key') {
        return;
      }

      if (searchValue) {
        setSearchValue('');
      } else {
        setOpen(false);
      }
    },
    [searchValue, setOpen, setSearchValue],
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
            <div className="MobileNavHeadingInner">{normalizeGroup(group.group)}</div>
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
                  {props.children}
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
      {result.title?.split(' ‣ ').map((part, i, arr) => (
        <React.Fragment key={part}>
          <span className={clsx('MobileNavSearchBreadcrumbPart', i === arr.length - 1 && 'last')}>
            {part}
          </span>
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
      {process.env.NODE_ENV !== 'production' && result.score && (
        <span className="MobileNavSearchScore">{result.score.toFixed(2)}</span>
      )}
    </React.Fragment>
  );
}

export function Section(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('MobileNavSection', props.className)} />;
}

export function Heading(props: React.ComponentProps<'div'>) {
  return (
    <div {...props} className={clsx('MobileNavHeading', props.className)}>
      <div className="MobileNavHeadingInner">{props.children}</div>
    </div>
  );
}

export function List(props: React.ComponentProps<'ul'>) {
  return <ul {...props} className={clsx('MobileNavList', props.className)} />;
}

export function Badge(props: React.ComponentProps<'span'>) {
  return <span {...props} className={clsx('MobileNavBadge', props.className)} />;
}

interface ItemProps extends React.ComponentPropsWithoutRef<'li'> {
  active?: boolean;
  href: string;
  rel?: string;
  external?: boolean;
}

export function Item({ href, external, ...props }: ItemProps) {
  const { setOpen } = React.useContext(MobileNavState);
  const pathname = usePathname();
  const active = props.active ?? pathname === href;

  const LinkComponent = external ? 'a' : NextLink;

  return (
    <li {...props} className={clsx('MobileNavItem', props.className)}>
      <LinkComponent
        aria-current={active ? 'page' : undefined}
        data-active={active ? '' : undefined}
        className="MobileNavLink"
        href={href}
        rel={props.rel}
        // We handle scroll manually
        scroll={external ? undefined : false}
        onClick={() => {
          if (href === window.location.pathname) {
            // If the URL is the same, close, wait a little, and scroll to top smoothly
            setOpen(false);
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 500);
          } else {
            // Otherwise, wait for the URL change before closing and scroll up instantly
            onUrlChange(() => {
              ReactDOM.flushSync(() => setOpen(false));
              window.scrollTo({ top: 0, behavior: 'instant' });
            });
          }
        }}
      >
        {props.children}
      </LinkComponent>
    </li>
  );
}

function onUrlChange(callback: () => void) {
  const initialUrl = window.location.href;

  function rafRecursively() {
    requestAnimationFrame(() => {
      if (initialUrl === window.location.href) {
        rafRecursively();
      } else {
        callback();
      }
    });
  }

  rafRecursively();
}
