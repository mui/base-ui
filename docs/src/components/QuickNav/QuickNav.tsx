'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { useGoogleAnalytics } from 'docs/src/blocks/GoogleAnalyticsProvider';
import './QuickNav.css';

const QuickNavOutletContext = React.createContext<HTMLElement | null>(null);

export function Container({ className, children, ...props }: React.ComponentProps<'div'>) {
  const [quickNavOutlet, setQuickNavOutlet] = React.useState<HTMLElement | null>(null);

  return (
    <QuickNavOutletContext.Provider value={quickNavOutlet}>
      <div className={clsx('QuickNavContainer', className)} {...props}>
        <div ref={setQuickNavOutlet} className="QuickNavOutlet" />
        <div className="QuickNavContent">{children}</div>
      </div>
    </QuickNavOutletContext.Provider>
  );
}

export function Root({ children, className, ...props }: React.ComponentProps<'div'>) {
  const quickNavOutlet = React.useContext(QuickNavOutletContext);

  const quickNav = (
    <nav aria-label="On this page" className={clsx('QuickNavRoot', className)} {...props}>
      <div className="QuickNavInner">
        <ScrollArea.Root>
          <ScrollArea.Viewport className="QuickNavViewport">{children}</ScrollArea.Viewport>
          <ScrollArea.Scrollbar className="QuickNavScrollbar" orientation="vertical">
            <ScrollArea.Thumb className="QuickNavScrollbarThumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>
    </nav>
  );

  if (quickNavOutlet) {
    return ReactDOM.createPortal(quickNav, quickNavOutlet);
  }

  return quickNav;
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
