'use client';
import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import scrollIntoView from 'scroll-into-view-if-needed';
// eslint-disable-next-line no-restricted-imports
import { useEnhancedEffect } from '@base-ui-components/react/utils/useEnhancedEffect';

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
          <Scrollbar />
        </ScrollArea.Root>
      </nav>
    </SideNavContext.Provider>
  );
}

function Scrollbar(props: React.ComponentProps<'div'>) {
  const { scrollingIntoView, setScrollingIntoView } = React.useContext(SideNavContext);
  const dataScrolling = (props as Record<string, string | undefined>)['data-scrolling'];
  const prevScrolling = React.useRef(dataScrolling);

  useEnhancedEffect(() => {
    // Clear `scrollingIntoView` state when the ScrollArea's
    // `state.scrolling` flips back to `false`
    if (prevScrolling.current && !dataScrolling && scrollingIntoView) {
      setScrollingIntoView(false);
    }
    prevScrolling.current = dataScrolling;
  }, [scrollingIntoView, setScrollingIntoView, dataScrolling]);

  return (
    <ScrollArea.Scrollbar
      // Prevent `data-scrolling` from being set when scrolling into view programmatically
      data-scrolling={scrollingIntoView ? undefined : dataScrolling}
      orientation="vertical"
      className="SideNavScrollbar"
    >
      <ScrollArea.Thumb className="SideNavScrollbarThumb" />
    </ScrollArea.Scrollbar>
  );
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

interface ItemProps extends React.ComponentProps<'li'> {
  active?: boolean;
  href: string;
}

export function Item({ children, className, href, ...props }: ItemProps) {
  const { setScrollingIntoView } = React.useContext(SideNavContext);
  const ref = React.useRef<HTMLLIElement>(null);
  const pathname = usePathname();
  const active = pathname === href;

  React.useEffect(() => {
    if (ref.current && active) {
      // TODO Vlad this should be rem, not 48px
      const HEADER_HEIGHT = 48;
      const SCROLL_MARGIN = 48;
      const viewport = document.querySelector('[data-side-nav-viewport]');

      if (!viewport) {
        return;
      }

      scrollIntoView(ref.current, {
        block: 'nearest',
        scrollMode: 'if-needed',
        boundary: (parent) => viewport.contains(parent),
        behavior: (actions) => {
          // We are scrolling into view, update upstream state
          setScrollingIntoView(true);
          actions.forEach(({ top }) => {
            const dir = viewport.scrollTop > top ? -1 : 1;
            const offset = Math.max(0, HEADER_HEIGHT - Math.max(0, window.scrollY));
            viewport.scrollTop = top + offset + SCROLL_MARGIN * dir;
          });
        },
      });
    }
  }, [active, setScrollingIntoView]);

  return (
    <li ref={ref} className={clsx('SideNavItem', className)} {...props}>
      <NextLink data-active={active || undefined} className="SideNavLink" href={href}>
        {children}
      </NextLink>
    </li>
  );
}
