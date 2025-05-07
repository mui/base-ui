'use client';
import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { ScrollArea, SCROLL_TIMEOUT } from '@base-ui-components/react/scroll-area';
import scrollIntoView from 'scroll-into-view-if-needed';
import { HEADER_HEIGHT } from './Header';

interface SideNavContextValue {
  /**
   * Whether we are programmatically scrolling an item into view.
   * We make sure that the scrollbar is visible only during user interaction.
   */
  scrollingIntoView: boolean;
  setScrollingIntoView: (value: boolean) => void;
}

const SideNavContext = React.createContext<SideNavContextValue>({
  scrollingIntoView: false,
  setScrollingIntoView: () => undefined,
});

export function Root({ children, className, ...props }: React.ComponentProps<'div'>) {
  const [scrollingIntoView, setScrollingIntoView] = React.useState(false);
  const contextValue = React.useMemo(
    () => ({ scrollingIntoView, setScrollingIntoView }),
    [scrollingIntoView, setScrollingIntoView],
  );

  return (
    <SideNavContext.Provider value={contextValue}>
      <nav aria-label="Main navigation" className={clsx('SideNavRoot', className)} {...props}>
        <ScrollArea.Root>
          <ScrollArea.Viewport data-side-nav-viewport className="SideNavViewport">
            {children}
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            className="SideNavScrollbar"
            orientation="vertical"
            render={<Scrollbar />}
          >
            <ScrollArea.Thumb className="SideNavScrollbarThumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </nav>
    </SideNavContext.Provider>
  );
}

function Scrollbar(props: Record<string, unknown>) {
  const { scrollingIntoView } = React.useContext(SideNavContext);

  // Prevent `data-scrolling` from being set when scrolling into view programmatically
  const dataScrolling = scrollingIntoView ? undefined : props['data-scrolling'];
  return <div {...props} data-scrolling={dataScrolling} />;
}

export function Section({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={clsx('SideNavSection', className)} {...props} />;
}

export function Heading({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={clsx('SideNavHeading', className)} {...props} />;
}

export function List({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={clsx('SideNavList', className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={clsx('SideNavLabel', className)} {...props} />;
}

export function Badge({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={clsx('SideNavBadge', className)} {...props} />;
}

export function CornerBadge({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={clsx('SideNavBadgeCorner', className)} {...props} />;
}

export function EndBadge({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={clsx('SideNavBadgeEnd', className)} {...props} />;
}

interface ItemProps extends React.ComponentProps<'li'> {
  active?: boolean;
  href: string;
  isNew?: boolean;
}

const SCROLL_MARGIN = 48;

export function Item({ children, className, href, ...props }: ItemProps) {
  const { setScrollingIntoView } = React.useContext(SideNavContext);
  const ref = React.useRef<HTMLLIElement>(null);
  const pathname = usePathname();
  const active = pathname === href;
  const rem = React.useRef(16);

  React.useEffect(() => {
    rem.current = parseFloat(getComputedStyle(document.documentElement).fontSize);
  }, []);

  React.useEffect(() => {
    if (ref.current && active) {
      const scrollMargin = (SCROLL_MARGIN * rem.current) / 16;
      const headerHeight = (HEADER_HEIGHT * rem.current) / 16;
      const viewport = document.querySelector('[data-side-nav-viewport]');

      if (!viewport) {
        return;
      }

      scrollIntoView(ref.current, {
        block: 'nearest',
        scrollMode: 'if-needed',
        boundary: (parent) => viewport.contains(parent),
        behavior: (actions) => {
          if (actions.length > 0) {
            // We are scrolling into view, update upstream state
            setScrollingIntoView(true);
            // Sync flag removal with ScrollArea's own scrolling state timeout
            setTimeout(() => setScrollingIntoView(false), SCROLL_TIMEOUT + 50);
          }
          actions.forEach(({ top }) => {
            const dir = viewport.scrollTop > top ? -1 : 1;
            const offset = Math.max(0, headerHeight - Math.max(0, window.scrollY));
            viewport.scrollTop = top + offset + scrollMargin * dir;
          });
        },
      });
    }
  }, [active, setScrollingIntoView]);

  return (
    <li ref={ref} className={clsx('SideNavItem', className)} {...props}>
      <NextLink
        aria-current={active ? 'page' : undefined}
        data-active={active || undefined}
        className="SideNavLink"
        href={href}
        scroll={!active}
        onClick={() => {
          // Scroll to top smoothly when clicking on the currently active item
          if (active) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      >
        {children}
      </NextLink>
    </li>
  );
}
