'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { isMac } from '@base-ui/utils/detectBrowser';
import { SearchBar } from './SearchBar';

const sitemap = () => import('../../app/sitemap');

interface SearchRenderProps {
  isCmd: boolean;
}

interface SearchProps {
  children?: React.ReactNode | ((props: SearchRenderProps) => React.ReactNode);
  triggerProps?: Omit<Dialog.Trigger.Props, 'children' | 'handle'>;
  enableKeyboardShortcut?: boolean;
  containedScroll?: boolean;
}

export function Search({
  children,
  triggerProps,
  enableKeyboardShortcut = false,
  containedScroll = false,
}: SearchProps) {
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

  return (
    <React.Fragment>
      <Dialog.Trigger {...triggerProps} handle={handle}>
        {typeof children === 'function' ? children({ isCmd }) : children}
      </Dialog.Trigger>
      <SearchBar handle={handle} sitemap={sitemap} containedScroll={containedScroll} />
    </React.Fragment>
  );
}
