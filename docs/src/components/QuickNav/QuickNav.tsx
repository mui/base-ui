'use client';
import * as React from 'react';
import clsx from 'clsx';
import { ownerWindow } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { useGoogleAnalytics } from 'docs/src/blocks/GoogleAnalyticsProvider';
import './QuickNav.css';

export function Container({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={clsx('QuickNavContainer', className)} {...props} />;
}

export function Root({ children, className, ...props }: React.ComponentProps<'div'>) {
  const sentinelRef = React.useRef<HTMLSpanElement>(null);
  const ref = React.useRef<HTMLElement>(null);
  const [isSticky, setIsSticky] = React.useState(false);

  useIsoLayoutEffect(() => {
    const sentinelElement = sentinelRef.current;
    const navElement = ref.current;

    if (!navElement || !sentinelElement) {
      return undefined;
    }

    const win = ownerWindow(navElement);
    const syncStickyState = () => {
      const cssTop = parseFloat(getComputedStyle(navElement).top) || 0;
      const navTop = navElement.getBoundingClientRect().top;
      const nextIsSticky = Math.abs(navTop - cssTop) <= 1 && win.scrollY > 0;
      setIsSticky((prevIsSticky) => (prevIsSticky === nextIsSticky ? prevIsSticky : nextIsSticky));
    };
    const IntersectionObserverCtor = (
      win as Window & { IntersectionObserver?: typeof IntersectionObserver }
    ).IntersectionObserver;

    if (typeof IntersectionObserverCtor === 'function') {
      let observer: IntersectionObserver | undefined;
      let raf = 0;

      const connectObserver = () => {
        const styles = getComputedStyle(navElement);
        const cssTop = parseFloat(styles.top) || 0;
        const marginTop = parseFloat(styles.marginTop) || 0;
        const stickyThreshold = marginTop - cssTop;

        observer?.disconnect();
        observer = new IntersectionObserverCtor(
          ([entry]) => {
            const nextIsSticky = !entry.isIntersecting && win.scrollY > 0;
            setIsSticky((prevIsSticky) =>
              prevIsSticky === nextIsSticky ? prevIsSticky : nextIsSticky,
            );
          },
          {
            root: null,
            rootMargin: `${stickyThreshold}px 0px 0px 0px`,
            threshold: 0,
          },
        );
        observer.observe(sentinelElement);

        // Sync on setup and one frame later for scroll restoration/layout settling.
        syncStickyState();
        win.requestAnimationFrame(syncStickyState);
      };

      const handleResize = () => {
        win.cancelAnimationFrame(raf);
        raf = win.requestAnimationFrame(connectObserver);
      };

      connectObserver();
      win.addEventListener('resize', handleResize);

      return () => {
        win.cancelAnimationFrame(raf);
        win.removeEventListener('resize', handleResize);
        observer?.disconnect();
      };
    }

    // Fallback for environments without IntersectionObserver.
    let raf = 0;
    const schedulePositionChange = () => {
      win.cancelAnimationFrame(raf);
      raf = win.requestAnimationFrame(syncStickyState);
    };

    schedulePositionChange();
    win.addEventListener('scroll', schedulePositionChange, { passive: true });
    win.addEventListener('resize', schedulePositionChange);

    return () => {
      win.cancelAnimationFrame(raf);
      win.removeEventListener('scroll', schedulePositionChange);
      win.removeEventListener('resize', schedulePositionChange);
    };
  }, []);

  return (
    <React.Fragment>
      <span aria-hidden="true" ref={sentinelRef} className="QuickNavStickySentinel" />
      <nav
        aria-label="On this page"
        ref={ref}
        data-sticky={isSticky || undefined}
        className={clsx('QuickNavRoot', isSticky && 'QuickNavRoot--sticky', className)}
        {...props}
      >
        <div className="QuickNavInner">
          <ScrollArea.Root>
            <ScrollArea.Viewport className="QuickNavViewport">{children}</ScrollArea.Viewport>
            <ScrollArea.Scrollbar className="QuickNavScrollbar" orientation="vertical">
              <ScrollArea.Thumb className="QuickNavScrollbarThumb" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </div>
      </nav>
    </React.Fragment>
  );
}

export function Title({ className, ...props }: React.ComponentProps<'header'>) {
  return <header className={clsx('QuickNavTitle', className)} {...props} />;
}

export function List({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={clsx('QuickNavList', className)} {...props} />;
}

export function Item({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={clsx('QuickNavItem', className)} {...props} />;
}

export function Link({ className, onClick, ...props }: React.ComponentProps<'a'>) {
  const ga = useGoogleAnalytics();
  const pathname = usePathname();

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      const slug = props.href ?? undefined;
      const tocId = slug ? `${pathname}${slug}` : pathname;
      ga?.trackEvent({
        category: 'table_of_contents',
        action: 'click',
        label: tocId,
        params: { click: tocId, slug: slug || '' },
      });
      onClick?.(event);
    },
    [ga, props.href, onClick, pathname],
  );

  // The anchor element is interactive via `href` from `...props`, but the
  // lint rules can't see through the spread to know that.
  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
  return <a className={clsx('QuickNavLink', className)} {...props} onClick={handleClick} />;
}
