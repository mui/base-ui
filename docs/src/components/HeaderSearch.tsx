'use client';
import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import { platform } from '@base-ui/utils/platform';
import { MagnifyingGlassIcon } from 'docs/src/icons/MagnifyingGlassIcon';
import { MobileNavContext } from './MobileNavContext';
import './MobileNav.css';
import './SearchTrigger.css';

const LazySearchDialog = React.lazy(() =>
  import('./Search/SearchDialog').then((module) => ({ default: module.SearchDialog })),
);
const LazyMobileNavDrawer = React.lazy(() =>
  import('./MobileNavDrawer').then((module) => ({ default: module.MobileNavDrawer })),
);

interface HeaderSearchProps {
  mobileNavContent: React.ReactNode;
}

export function HeaderSearch({ mobileNavContent }: HeaderSearchProps) {
  const [desktopHandle] = React.useState(() => Dialog.createHandle());
  const [mobileHandle] = React.useState(() => Drawer.createHandle());
  const desktopTriggerId = React.useId();
  const mobileTriggerId = React.useId();
  const desktopTriggerRef = React.useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = React.useRef<HTMLButtonElement>(null);

  const isCmd = React.useSyncExternalStore(
    () => () => {},
    () => platform.os.mac,
    () => true,
  );

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

        if (visibleTarget === desktopTriggerRef.current) {
          if (!desktopHandle.isOpen) {
            desktopHandle.open(desktopTriggerId);
          }
        } else if (!mobileHandle.isOpen) {
          mobileHandle.open(mobileTriggerId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [desktopHandle, desktopTriggerId, mobileHandle, mobileTriggerId]);

  const mobileContextValue = React.useMemo(() => ({ handle: mobileHandle }), [mobileHandle]);

  return (
    <div className="HeaderSearch">
      {/* Desktop search */}
      <Dialog.Trigger
        id={desktopTriggerId}
        ref={desktopTriggerRef}
        handle={desktopHandle}
        className="HeaderSearchDesktopTrigger SearchTrigger"
      >
        <SearchTriggerContent isCmd={isCmd} />
      </Dialog.Trigger>
      <React.Suspense fallback={null}>
        <LazySearchDialog handle={desktopHandle} containedScroll />
      </React.Suspense>

      {/* Mobile nav/search */}
      <MobileNavContext.Provider value={mobileContextValue}>
        <Drawer.Trigger
          id={mobileTriggerId}
          ref={mobileTriggerRef}
          handle={mobileHandle}
          className="HeaderSearchMobileTrigger HeaderButton HeaderNavTrigger MobileNavHeaderTrigger"
        >
          <MobileNavTriggerContent />
        </Drawer.Trigger>
        <React.Suspense fallback={null}>
          <LazyMobileNavDrawer handle={mobileHandle}>{mobileNavContent}</LazyMobileNavDrawer>
        </React.Suspense>
      </MobileNavContext.Provider>
    </div>
  );
}

function getVisibleTarget(element: HTMLElement | null) {
  if (element?.getClientRects().length) {
    return element;
  }

  return null;
}

function SearchTriggerContent({ isCmd }: { isCmd: boolean }) {
  return (
    <React.Fragment>
      Search
      <span className="SearchTriggerShortcut">
        ({isCmd ? <kbd>⌘</kbd> : <kbd>Ctrl+</kbd>}
        <kbd>k</kbd>)
      </span>
    </React.Fragment>
  );
}

function MobileNavTriggerContent() {
  return (
    <React.Fragment>
      <MagnifyingGlassIcon className="MobileNavTriggerIcon" />
      Navigation
    </React.Fragment>
  );
}
