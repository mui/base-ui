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

type OpenTarget = 'desktop' | 'mobile' | 'mobile-search';
type DialogTriggerClickEvent = Parameters<NonNullable<Dialog.Trigger.Props['onClick']>>[0];
type DrawerTriggerClickEvent = Parameters<NonNullable<Drawer.Trigger.Props['onClick']>>[0];

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
  const focusMobileSearchOnOpenRef = React.useRef(false);
  const [openTarget, setOpenTarget] = React.useState<OpenTarget | null>(null);

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

        setOpenTarget(visibleTarget === desktopTriggerRef.current ? 'desktop' : 'mobile-search');
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  React.useEffect(() => {
    if (openTarget === null) {
      return;
    }

    if (openTarget === 'desktop') {
      if (!desktopHandle.isOpen) {
        if (mobileHandle.isOpen) {
          mobileHandle.close();
        }

        desktopHandle.open(desktopTriggerId);
      }
    } else if (hasMobileNav && !mobileHandle.isOpen) {
      focusMobileSearchOnOpenRef.current = openTarget === 'mobile-search';

      if (desktopHandle.isOpen) {
        desktopHandle.close();
      }

      mobileHandle.open(mobileTriggerId);
    }

    setOpenTarget(null);
  }, [desktopHandle, desktopTriggerId, hasMobileNav, mobileHandle, mobileTriggerId, openTarget]);

  const mobileContextValue = React.useMemo(() => ({ handle: mobileHandle }), [mobileHandle]);

  const handleDesktopTriggerClick = React.useCallback((event: DialogTriggerClickEvent) => {
    event?.preventBaseUIHandler();
    setOpenTarget('desktop');
  }, []);

  const handleMobileTriggerClick = React.useCallback((event: DrawerTriggerClickEvent) => {
    event?.preventBaseUIHandler();
    setOpenTarget('mobile');
  }, []);

  return (
    <React.Fragment>
      <Dialog.Trigger
        id={desktopTriggerId}
        ref={desktopTriggerRef}
        handle={desktopHandle}
        className={clsx('SearchTrigger', desktopTriggerClassName)}
        onClick={handleDesktopTriggerClick}
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
            onClick={handleMobileTriggerClick}
          >
            <MagnifyingGlassIcon className="MobileNavTriggerIcon" />
            Navigation
          </Drawer.Trigger>
          <React.Suspense fallback={null}>
            <LazyMobileNavDrawer
              handle={mobileHandle}
              focusMobileSearchOnOpenRef={focusMobileSearchOnOpenRef}
            >
              {mobileNavContent}
            </LazyMobileNavDrawer>
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
