'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { platform } from '@base-ui/utils/platform';
import './Search.css';

const sitemapPromise = () => import('../../app/sitemap');
const LazySearchDialog = React.lazy(() =>
  import('./SearchDialog').then((module) => ({ default: module.SearchDialog })),
);

interface SearchRenderProps {
  isCmd: boolean;
}

interface SearchProps {
  children?: React.ReactNode | ((props: SearchRenderProps) => React.ReactNode);
  triggerProps?: Omit<Dialog.Trigger.Props, 'children' | 'handle'>;
  enableKeyboardShortcut?: boolean;
}

export function Search({ children, triggerProps, enableKeyboardShortcut = false }: SearchProps) {
  const [handle] = React.useState(() => Dialog.createHandle());
  const generatedTriggerId = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const isCmd = React.useSyncExternalStore(
    () => () => {},
    () => platform.os.mac,
    () => true,
  );
  const triggerId = triggerProps?.id ?? generatedTriggerId;

  React.useEffect(() => {
    if (!enableKeyboardShortcut) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (!isVisible(triggerRef.current)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (!handle.isOpen) {
          handle.open(triggerId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [enableKeyboardShortcut, handle, triggerId]);

  return (
    <React.Fragment>
      <Dialog.Trigger {...triggerProps} ref={triggerRef} id={triggerId} handle={handle}>
        {typeof children === 'function' ? children({ isCmd }) : children}
      </Dialog.Trigger>
      <React.Suspense fallback={null}>
        <LazySearchDialog handle={handle} sitemap={sitemapPromise} />
      </React.Suspense>
    </React.Fragment>
  );
}

function isVisible(element: HTMLElement | null) {
  return Boolean(element?.getClientRects().length);
}
