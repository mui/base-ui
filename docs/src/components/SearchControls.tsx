'use client';
import * as React from 'react';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import { platform } from '@base-ui/utils/platform';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { loadSearchSitemap } from './Search/searchSitemap';
import { MobileNavContext } from './MobileNavContext';
import './MobileNav.css';
import './SearchTrigger.css';

const SearchDialog = React.lazy(async () => ({
  default: (await import('./Search/SearchDialog')).SearchDialog,
}));

const MobileNavDrawer = React.lazy(async () => ({
  default: (await import('./MobileNavDrawer')).MobileNavDrawer,
}));

function preloadSearchSitemap() {
  void loadSearchSitemap().catch(() => undefined);
}

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
  const scrollTopAfterMobileCloseRef = React.useRef(false);
  const scrollTopAfterMobileNavigationRef = React.useRef<string | null>(null);
  const [openTarget, setOpenTarget] = React.useState<OpenTarget | null>(null);
  const preloadTimeout = useTimeout();
  const pathname = usePathname();

  const isCmd = React.useSyncExternalStore(
    () => () => {},
    () => platform.os.mac,
    () => true,
  );

  const closeMobileNav = React.useCallback(() => {
    scrollTopAfterMobileCloseRef.current = false;
    scrollTopAfterMobileNavigationRef.current = null;
    setOpenTarget(null);
  }, []);

  const closeMobileNavAndScrollTop = React.useCallback(() => {
    scrollTopAfterMobileCloseRef.current = true;
    scrollTopAfterMobileNavigationRef.current = null;
    setOpenTarget(null);
  }, []);

  const closeMobileNavAndScrollTopAfterNavigation = React.useCallback((nextPathname: string) => {
    scrollTopAfterMobileCloseRef.current = false;
    scrollTopAfterMobileNavigationRef.current = nextPathname;
  }, []);

  const mobileContextValue = React.useMemo(
    () => ({
      close: closeMobileNav,
      closeAndScrollTop: closeMobileNavAndScrollTop,
      closeAndScrollTopAfterNavigation: closeMobileNavAndScrollTopAfterNavigation,
    }),
    [closeMobileNav, closeMobileNavAndScrollTop, closeMobileNavAndScrollTopAfterNavigation],
  );

  const handleDesktopTriggerClick = React.useCallback((event: DialogTriggerClickEvent) => {
    event?.preventBaseUIHandler();
    preloadSearchSitemap();
    setOpenTarget('desktop');
  }, []);

  const handleMobileTriggerClick = React.useCallback((event: DrawerTriggerClickEvent) => {
    event?.preventBaseUIHandler();
    preloadSearchSitemap();
    scrollTopAfterMobileCloseRef.current = false;
    setOpenTarget('mobile');
  }, []);

  const handleDesktopOpenChange = React.useCallback((open: boolean) => {
    if (open) {
      setOpenTarget('desktop');
      return;
    }

    setOpenTarget((target) => {
      if (target === 'desktop') {
        return null;
      }

      return target;
    });
  }, []);

  const handleMobileOpenChange = React.useCallback((open: boolean) => {
    if (open) {
      scrollTopAfterMobileCloseRef.current = false;
      setOpenTarget('mobile');
      return;
    }

    setOpenTarget((target) => {
      if (target === 'mobile' || target === 'mobile-search') {
        return null;
      }

      return target;
    });
  }, []);

  const handleMobileOpenChangeComplete = React.useCallback((open: boolean) => {
    if (open || !scrollTopAfterMobileCloseRef.current) {
      return;
    }

    scrollTopAfterMobileCloseRef.current = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    // Warm the search chunk shortly after mount without competing with initial hydration.
    preloadTimeout.start(250, preloadSearchSitemap);
    return preloadTimeout.clear;
  }, [preloadTimeout]);

  React.useEffect(() => {
    if (scrollTopAfterMobileNavigationRef.current !== pathname) {
      return;
    }

    scrollTopAfterMobileNavigationRef.current = null;
    setOpenTarget(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

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

        preloadSearchSitemap();
        setOpenTarget(nextOpenTarget);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  const desktopOpen = openTarget === 'desktop';
  const mobileOpen = openTarget === 'mobile' || openTarget === 'mobile-search';
  const focusMobileSearchOnOpen = openTarget === 'mobile-search';

  return (
    <React.Fragment>
      <Dialog.Trigger
        id={desktopTriggerId}
        ref={desktopTriggerRef}
        handle={desktopHandle}
        className={clsx('SearchTrigger', desktopTriggerClassName)}
        onPointerDown={preloadSearchSitemap}
        onClick={handleDesktopTriggerClick}
      >
        Search
        <span className="SearchTriggerShortcut">
          ({isCmd ? <kbd>⌘</kbd> : <kbd>Ctrl+</kbd>}
          <kbd>k</kbd>)
        </span>
      </Dialog.Trigger>
      <React.Suspense fallback={null}>
        <SearchDialog
          handle={desktopHandle}
          open={desktopOpen}
          onOpenChange={handleDesktopOpenChange}
          triggerId={desktopOpen ? desktopTriggerId : null}
        />
      </React.Suspense>

      <MobileNavContext.Provider value={mobileContextValue}>
        <Drawer.Trigger
          id={mobileTriggerId}
          ref={mobileTriggerRef}
          handle={mobileHandle}
          className={clsx('SearchTrigger', mobileTriggerClassName)}
          onPointerDown={preloadSearchSitemap}
          onClick={handleMobileTriggerClick}
        >
          <MagnifyingGlassIcon className="MobileNavTriggerIcon" />
          Navigation
        </Drawer.Trigger>
        <React.Suspense fallback={null}>
          <MobileNavDrawer
            handle={mobileHandle}
            focusSearchOnOpen={focusMobileSearchOnOpen}
            open={mobileOpen}
            onOpenChange={handleMobileOpenChange}
            onOpenChangeComplete={handleMobileOpenChangeComplete}
            triggerId={mobileOpen ? mobileTriggerId : null}
          />
        </React.Suspense>
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
