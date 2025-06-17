'use client';
import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import scrollIntoView from 'scroll-into-view-if-needed';
import { HEADER_HEIGHT } from './Header';

export function Root(props: React.ComponentProps<'div'>) {
  return (
    <nav aria-label="Main navigation" {...props} className={clsx('SideNavRoot', props.className)}>
      <ScrollArea.Root>
        <ScrollArea.Viewport data-side-nav-viewport className="SideNavViewport">
          {props.children}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar className="SideNavScrollbar" orientation="vertical">
          <ScrollArea.Thumb className="SideNavScrollbarThumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </nav>
  );
}

export function Section(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('SideNavSection', props.className)} />;
}

export function Heading(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('SideNavHeading', props.className)} />;
}

export function List(props: React.ComponentProps<'ul'>) {
  return <ul {...props} className={clsx('SideNavList', props.className)} />;
}

export function Label(props: React.ComponentProps<'span'>) {
  return <span {...props} className={clsx('SideNavLabel', props.className)} />;
}

export function Badge(props: React.ComponentProps<'span'>) {
  return <span {...props} className={clsx('SideNavBadge', props.className)} />;
}

interface ItemProps extends React.ComponentProps<'li'> {
  active?: boolean;
  href: string;
  isNew?: boolean;
}

const SCROLL_MARGIN = 48;

export function Item({ children, href, ...props }: ItemProps) {
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
          actions.forEach(({ top }) => {
            const dir = viewport.scrollTop > top ? -1 : 1;
            const offset = Math.max(0, headerHeight - Math.max(0, window.scrollY));
            viewport.scrollTop = top + offset + scrollMargin * dir;
          });
        },
      });
    }
  }, [active]);

  return (
    <li ref={ref} {...props} className={clsx('SideNavItem', props.className)}>
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
