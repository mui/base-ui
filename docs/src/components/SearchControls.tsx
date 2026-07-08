'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Dialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import { platform } from '@base-ui/utils/platform';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { MobileNavDrawer } from './MobileNavDrawer';
import { SearchDialog } from './Search/SearchDialog';
import { loadSearchSitemap } from './Search/searchSitemap';
import { MobileNavContext } from './MobileNavContext';
import './MobileNav.css';
import './SearchTrigger.css';

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
  const preloadTimeout = useTimeout();

  const isCmd = React.useSyncExternalStore(
    () => () => {},
    () => platform.os.mac,
    () => true,
  );

  const preloadSearchSitemap = React.useCallback(() => {
    void loadSearchSitemap().catch(() => undefined);
  }, []);

  const closeMobileNav = React.useCallback(() => {
    setOpenTarget(null);
  }, []);

  const mobileContextValue = React.useMemo(() => ({ close: closeMobileNav }), [closeMobileNav]);

  const handleDesktopTriggerClick = React.useCallback(
    (event: DialogTriggerClickEvent) => {
      event?.preventBaseUIHandler();
      preloadSearchSitemap();
      setOpenTarget('desktop');
    },
    [preloadSearchSitemap],
  );

  const handleMobileTriggerClick = React.useCallback(
    (event: DrawerTriggerClickEvent) => {
      event?.preventBaseUIHandler();
      preloadSearchSitemap();
      setOpenTarget('mobile');
    },
    [preloadSearchSitemap],
  );

  const handleDesktopTriggerPointerDown = React.useCallback(() => {
    preloadSearchSitemap();
  }, [preloadSearchSitemap]);

  const handleMobileTriggerPointerDown = React.useCallback(() => {
    preloadSearchSitemap();
  }, [preloadSearchSitemap]);

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

  React.useEffect(() => {
    preloadTimeout.start(250, preloadSearchSitemap);
    return preloadTimeout.clear;
  }, [preloadSearchSitemap, preloadTimeout]);

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
  }, [preloadSearchSitemap]);

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
        onPointerDown={handleDesktopTriggerPointerDown}
        onClick={handleDesktopTriggerClick}
      >
        Search
        <span className="SearchTriggerShortcut">
          ({isCmd ? <kbd>⌘</kbd> : <kbd>Ctrl+</kbd>}
          <kbd>k</kbd>)
        </span>
      </Dialog.Trigger>
      <SearchDialog
        handle={desktopHandle}
        open={desktopOpen}
        onOpenChange={handleDesktopOpenChange}
        sitemap={loadSearchSitemap}
        triggerId={desktopOpen ? desktopTriggerId : null}
      />

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
        <MobileNavDrawer
          handle={mobileHandle}
          focusSearchOnOpen={focusMobileSearchOnOpen}
          open={mobileOpen}
          onOpenChange={handleMobileOpenChange}
          sitemap={loadSearchSitemap}
          triggerId={mobileOpen ? mobileTriggerId : null}
        />
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
