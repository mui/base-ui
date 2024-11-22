'use client';
import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@base-ui-components/react/ScrollArea';
import scrollIntoView from 'scroll-into-view-if-needed';

export function Root({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <nav aria-label="Main navigation" className={clsx('SideNavRoot', className)} {...props}>
      <ScrollArea.Root>
        <ScrollArea.Viewport data-side-nav-viewport className="SideNavViewport">
          {children}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="SideNavScrollbar">
          <ScrollArea.Thumb className="SideNavScrollbarThumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </nav>
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
  const ref = React.useRef<HTMLLIElement>(null);
  const pathname = usePathname();
  const active = pathname === href;

  React.useEffect(() => {
    if (ref.current && active) {
      // TODO Vlad this should be rem
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
          actions.forEach(({ top }) => {
            const dir = viewport.scrollTop > top ? -1 : 1;
            const offset = Math.max(0, HEADER_HEIGHT - Math.max(0, window.scrollY));
            viewport.scrollTop = top + offset + SCROLL_MARGIN * dir;
          });
        },
      });
    }
  }, [active]);

  return (
    <li ref={ref} className={clsx('SideNavItem', className)} {...props}>
      <NextLink data-active={active || undefined} className="SideNavLink" href={href}>
        {children}
      </NextLink>
    </li>
  );
}
