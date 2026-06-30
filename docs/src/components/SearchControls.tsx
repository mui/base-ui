'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Dialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import { platform } from '@base-ui/utils/platform';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { loadSearchSitemap } from './Search/searchSitemap';
import { MobileNavContext } from './MobileNavContext';
import './MobileNav.css';
import './SearchTrigger.css';

const LazySearchDialog = React.lazy(() =>
  import('./Search/SearchDialog').then((module) => ({ default: module.SearchDialog })),
);
const LazyMobileNavDrawer = React.lazy(() =>
  import('./MobileNavDrawer').then((module) => ({ default: module.MobileNavDrawer })),
);

type ShortcutTarget = 'desktop' | 'mobile';

interface SearchControlsProps {
  desktopTriggerClassName?: string;
  mobileNavContent?: React.ReactNode;
  mobileTriggerClassName?: string;
}

export function SearchControls({
  desktopTriggerClassName,
  mobileNavContent,
  mobileTriggerClassName,
}: SearchControlsProps) {
  const [desktopHandle] = React.useState(() => Dialog.createHandle());
  const [mobileHandle] = React.useState(() => Drawer.createHandle());
  const desktopTriggerId = React.useId();
  const mobileTriggerId = React.useId();
  const desktopTriggerRef = React.useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [shortcutTarget, setShortcutTarget] = React.useState<ShortcutTarget | null>(null);

  const isCmd = React.useSyncExternalStore(
    () => () => {},
    () => platform.os.mac,
    () => true,
  );

  const hasMobileNav = mobileNavContent != null;

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        const visibleTarget =
          getVisibleTarget(desktopTriggerRef.current) ?? getVisibleTarget(mobileTriggerRef.current);

        if (!visibleTarget) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        setShortcutTarget(visibleTarget === desktopTriggerRef.current ? 'desktop' : 'mobile');
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  React.useEffect(() => {
    if (shortcutTarget === null) {
      return;
    }

    if (shortcutTarget === 'desktop') {
      if (!desktopHandle.isOpen) {
        if (mobileHandle.isOpen) {
          mobileHandle.close();
        }

        desktopHandle.open(desktopTriggerId);
      }
    } else if (hasMobileNav && !mobileHandle.isOpen) {
      if (desktopHandle.isOpen) {
        desktopHandle.close();
      }

      mobileHandle.open(mobileTriggerId);
    }

    setShortcutTarget(null);
  }, [
    desktopHandle,
    desktopTriggerId,
    hasMobileNav,
    mobileHandle,
    mobileTriggerId,
    shortcutTarget,
  ]);

  const mobileContextValue = React.useMemo(() => ({ handle: mobileHandle }), [mobileHandle]);

  return (
    <React.Fragment>
      <Dialog.Trigger
        id={desktopTriggerId}
        ref={desktopTriggerRef}
        handle={desktopHandle}
        className={clsx('SearchTrigger', desktopTriggerClassName)}
      >
        Search
        <span className="SearchTriggerShortcut">
          ({isCmd ? <kbd>⌘</kbd> : <kbd>Ctrl+</kbd>}
          <kbd>k</kbd>)
        </span>
      </Dialog.Trigger>
      <React.Suspense fallback={null}>
        <LazySearchDialog handle={desktopHandle} sitemap={loadSearchSitemap} />
      </React.Suspense>

      {hasMobileNav && (
        <MobileNavContext.Provider value={mobileContextValue}>
          <Drawer.Trigger
            id={mobileTriggerId}
            ref={mobileTriggerRef}
            handle={mobileHandle}
            className={clsx('SearchTrigger', mobileTriggerClassName)}
          >
            <MagnifyingGlassIcon className="MobileNavTriggerIcon" />
            Navigation
          </Drawer.Trigger>
          <React.Suspense fallback={null}>
            <LazyMobileNavDrawer handle={mobileHandle}>{mobileNavContent}</LazyMobileNavDrawer>
          </React.Suspense>
        </MobileNavContext.Provider>
      )}
    </React.Fragment>
  );
}

function getVisibleTarget(element: HTMLElement | null) {
  if (element?.getClientRects().length) {
    return element;
  }

  return null;
}
