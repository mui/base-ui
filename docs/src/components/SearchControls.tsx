'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Dialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import { platform } from '@base-ui/utils/platform';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { loadSearchSitemap } from './Search/searchSitemap';
import { MobileNavContext } from './MobileNavContext';
import './MobileNav.css';
import './SearchTrigger.css';

const importSearchDialog = () => import('./Search/SearchDialog');
const importMobileNavDrawer = () => import('./MobileNavDrawer');

let searchDialogPromise: ReturnType<typeof importSearchDialog> | undefined;
let mobileNavDrawerPromise: ReturnType<typeof importMobileNavDrawer> | undefined;

function loadSearchDialog() {
  searchDialogPromise ??= importSearchDialog().catch((error) => {
    searchDialogPromise = undefined;
    throw error;
  });

  return searchDialogPromise;
}

function loadMobileNavDrawer() {
  mobileNavDrawerPromise ??= importMobileNavDrawer().catch((error) => {
    mobileNavDrawerPromise = undefined;
    throw error;
  });

  return mobileNavDrawerPromise;
}

const LazySearchDialog = React.lazy(() =>
  loadSearchDialog().then((module) => ({ default: module.SearchDialog })),
);
const LazyMobileNavDrawer = React.lazy(() =>
  loadMobileNavDrawer().then((module) => ({ default: module.MobileNavDrawer })),
);

type OpenTarget = 'desktop' | 'mobile' | 'mobile-search';
type DialogTriggerClickEvent = Parameters<NonNullable<Dialog.Trigger.Props['onClick']>>[0];
type DrawerTriggerClickEvent = Parameters<NonNullable<Drawer.Trigger.Props['onClick']>>[0];

interface SearchControlsProps {
  desktopTriggerClassName?: string;
  mobileTriggerClassName?: string;
}

export function SearchControls({
  desktopTriggerClassName,
  mobileTriggerClassName,
}: SearchControlsProps) {
  const [desktopHandle] = React.useState(() => Dialog.createHandle());
  const [mobileHandle] = React.useState(() => Drawer.createHandle());
  const desktopTriggerId = React.useId();
  const mobileTriggerId = React.useId();
  const desktopTriggerRef = React.useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [openTarget, setOpenTarget] = React.useState<OpenTarget | null>(null);
  const [desktopRequested, setDesktopRequested] = React.useState(false);
  const [mobileRequested, setMobileRequested] = React.useState(false);
  const [desktopReady, setDesktopReady] = React.useState(false);
  const [mobileReady, setMobileReady] = React.useState(false);
  const preloadTimeout = useTimeout();

  const isCmd = React.useSyncExternalStore(
    () => () => {},
    () => platform.os.mac,
    () => true,
  );

  const preloadTarget = React.useCallback((target: OpenTarget) => {
    if (target === 'desktop') {
      void loadSearchDialog();
      return;
    }

    void loadMobileNavDrawer();
  }, []);

  const requestTarget = React.useCallback(
    (target: OpenTarget) => {
      preloadTarget(target);

      if (target === 'desktop') {
        setDesktopRequested(true);
        return;
      }

      setMobileRequested(true);
    },
    [preloadTarget],
  );

  const closeMobileNav = React.useCallback(() => {
    setOpenTarget(null);
  }, []);

  const mobileContextValue = React.useMemo(() => ({ close: closeMobileNav }), [closeMobileNav]);

  const handleDesktopTriggerClick = React.useCallback(
    (event: DialogTriggerClickEvent) => {
      event?.preventBaseUIHandler();
      requestTarget('desktop');
      setOpenTarget('desktop');
    },
    [requestTarget],
  );

  const handleMobileTriggerClick = React.useCallback(
    (event: DrawerTriggerClickEvent) => {
      event?.preventBaseUIHandler();
      requestTarget('mobile');
      setOpenTarget('mobile');
    },
    [requestTarget],
  );

  const handleDesktopTriggerPointerDown = React.useCallback(() => {
    requestTarget('desktop');
  }, [requestTarget]);

  const handleMobileTriggerPointerDown = React.useCallback(() => {
    requestTarget('mobile');
  }, [requestTarget]);

  const handleDesktopReady = React.useCallback(() => {
    setDesktopReady(true);
  }, []);

  const handleMobileReady = React.useCallback(() => {
    setMobileReady(true);
  }, []);

  const handleDesktopOpenChange = React.useCallback(
    (open: boolean) => {
      if (open) {
        setOpenTarget('desktop');
        return;
      }

      setOpenTarget((target) => {
        if (target === 'desktop' && desktopReady) {
          return null;
        }

        return target;
      });
    },
    [desktopReady],
  );

  const handleMobileOpenChange = React.useCallback(
    (open: boolean) => {
      if (open) {
        setOpenTarget('mobile');
        return;
      }

      setOpenTarget((target) => {
        if ((target === 'mobile' || target === 'mobile-search') && mobileReady) {
          return null;
        }

        return target;
      });
    },
    [mobileReady],
  );

  React.useEffect(() => {
    const preload = () => {
      void loadSearchSitemap().catch(() => undefined);

      const target = getShortcutTarget(desktopTriggerRef.current, mobileTriggerRef.current);
      preloadTarget(target);

      if (target === 'desktop') {
        setDesktopRequested(true);
        return;
      }

      setMobileRequested(true);
    };

    preloadTimeout.start(250, preload);
    return preloadTimeout.clear;
  }, [preloadTarget, preloadTimeout]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        const nextOpenTarget = getShortcutTarget(
          desktopTriggerRef.current,
          mobileTriggerRef.current,
        );

        event.preventDefault();
        event.stopPropagation();

        requestTarget(nextOpenTarget);
        setOpenTarget(nextOpenTarget);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [requestTarget]);

  const desktopOpen = openTarget === 'desktop' && desktopReady;
  const mobileOpen = (openTarget === 'mobile' || openTarget === 'mobile-search') && mobileReady;
  const focusMobileSearchOnOpen = openTarget === 'mobile-search';

  return (
    <React.Fragment>
      <Dialog.Trigger
        id={desktopTriggerId}
        ref={desktopTriggerRef}
        handle={desktopHandle}
        className={clsx('SearchTrigger', desktopTriggerClassName)}
        onPointerDown={handleDesktopTriggerPointerDown}
        onClick={handleDesktopTriggerClick}
      >
        Search
        <span className="SearchTriggerShortcut">
          ({isCmd ? <kbd>⌘</kbd> : <kbd>Ctrl+</kbd>}
          <kbd>k</kbd>)
        </span>
      </Dialog.Trigger>
      {desktopRequested && (
        <React.Suspense fallback={null}>
          <LazySearchDialog
            handle={desktopHandle}
            onReady={handleDesktopReady}
            open={desktopOpen}
            onOpenChange={handleDesktopOpenChange}
            sitemap={loadSearchSitemap}
            triggerId={desktopOpen ? desktopTriggerId : null}
          />
        </React.Suspense>
      )}

      <MobileNavContext.Provider value={mobileContextValue}>
        <Drawer.Trigger
          id={mobileTriggerId}
          ref={mobileTriggerRef}
          handle={mobileHandle}
          className={clsx('SearchTrigger', mobileTriggerClassName)}
          onPointerDown={handleMobileTriggerPointerDown}
          onClick={handleMobileTriggerClick}
        >
          <MagnifyingGlassIcon className="MobileNavTriggerIcon" />
          Navigation
        </Drawer.Trigger>
        {mobileRequested && (
          <React.Suspense fallback={null}>
            <LazyMobileNavDrawer
              handle={mobileHandle}
              focusSearchOnOpen={focusMobileSearchOnOpen}
              onReady={handleMobileReady}
              open={mobileOpen}
              onOpenChange={handleMobileOpenChange}
              sitemap={loadSearchSitemap}
              triggerId={mobileOpen ? mobileTriggerId : null}
            />
          </React.Suspense>
        )}
      </MobileNavContext.Provider>
    </React.Fragment>
  );
}

function getVisibleTarget(element: HTMLElement | null) {
  if (element?.getClientRects().length) {
    return element;
  }

  return null;
}

function getShortcutTarget(
  desktopTrigger: HTMLElement | null,
  mobileTrigger: HTMLElement | null,
): Extract<OpenTarget, 'desktop' | 'mobile-search'> {
  const visibleTarget = getVisibleTarget(desktopTrigger) ?? getVisibleTarget(mobileTrigger);
  return visibleTarget === desktopTrigger ? 'desktop' : 'mobile-search';
}
