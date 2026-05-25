'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { isMac } from '@base-ui/utils/detectBrowser';
import { SearchBar } from './SearchBar';

const sitemap = () => import('../../app/sitemap');

interface SearchContextValue {
  isCmd: boolean;
  handle: Dialog.Handle<unknown>;
}

const SearchContext = React.createContext<SearchContextValue | null>(null);

export function Search({
  children,
  enableKeyboardShortcut = false,
  containedScroll = false,
}: {
  children?: React.ReactNode;
  enableKeyboardShortcut?: boolean;
  containedScroll?: boolean;
}) {
  const [handle] = React.useState(() => Dialog.createHandle());

  const isCmd = React.useSyncExternalStore(
    () => () => {},
    () => isMac,
    () => true,
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
        event.preventDefault();
        event.stopPropagation();

        if (!handle.isOpen) {
          handle.open(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [enableKeyboardShortcut, handle]);

  const contextValue = React.useMemo(
    () => ({
      isCmd,
      handle,
    }),
    [handle, isCmd],
  );

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
      <SearchBar handle={handle} sitemap={sitemap} containedScroll={containedScroll} />
    </SearchContext.Provider>
  );
}

interface SearchTriggerRenderProps {
  isCmd: boolean;
}

interface SearchTriggerProps extends Omit<Dialog.Trigger.Props, 'children' | 'handle'> {
  children?: React.ReactNode | ((props: SearchTriggerRenderProps) => React.ReactNode);
}

export function SearchTrigger(props: SearchTriggerProps) {
  const { children, ...triggerProps } = props;
  const context = React.useContext(SearchContext);

  if (context === null) {
    throw new Error('SearchTrigger must be used within Search.');
  }

  const { handle, isCmd } = context;

  return (
    <Dialog.Trigger {...triggerProps} handle={handle}>
      {typeof children === 'function' ? children({ isCmd }) : children}
    </Dialog.Trigger>
  );
}
