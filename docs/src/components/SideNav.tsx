'use client';
import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@base-ui/react/scroll-area';
import scrollIntoView from 'scroll-into-view-if-needed';
import { HEADER_HEIGHT } from './Header';
import {
  getSideNavScrollTop,
  normalizeSideNavPathname,
  SIDE_NAV_PREHYDRATED_PATH_ATTRIBUTE,
  SIDE_NAV_SCROLL_MARGIN,
  SIDE_NAV_VIEWPORT_SELECTOR,
} from '../utils/sideNavScroll';
import './SideNav.css';

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

export function Badge(props: React.ComponentProps<'span'>) {
  return <span {...props} className={clsx('SideNavBadge', props.className)} />;
}

interface ItemProps extends React.ComponentProps<'li'> {
  active?: boolean;
  href: string;
  isNew?: boolean;
  external?: boolean;
}

export function Item(props: ItemProps) {
  const { children, className, href, external, ...other } = props;
  const ref = React.useRef<HTMLLIElement>(null);
  const pathname = usePathname();
  const active = pathname === href;
  const rem = React.useRef(16);

  React.useEffect(() => {
    rem.current = parseFloat(getComputedStyle(document.documentElement).fontSize);
  }, []);

  React.useEffect(() => {
    if (ref.current && active) {
      const scrollMargin = (SIDE_NAV_SCROLL_MARGIN * rem.current) / 16;
      const headerHeight = (HEADER_HEIGHT * rem.current) / 16;
      const viewport = document.querySelector(SIDE_NAV_VIEWPORT_SELECTOR);

      if (!(viewport instanceof HTMLElement)) {
        return;
      }

      const prehydratedPath = document.documentElement.getAttribute(
        SIDE_NAV_PREHYDRATED_PATH_ATTRIBUTE,
      );
      if (prehydratedPath === normalizeSideNavPathname(pathname)) {
        document.documentElement.removeAttribute(SIDE_NAV_PREHYDRATED_PATH_ATTRIBUTE);
        return;
      }

      scrollIntoView(ref.current, {
        block: 'nearest',
        scrollMode: 'if-needed',
        boundary: (parent) => viewport.contains(parent),
        behavior: (actions) => {
          actions.forEach(({ top }) => {
            viewport.scrollTop = getSideNavScrollTop({
              viewportScrollTop: viewport.scrollTop,
              targetTop: top,
              headerHeight,
              scrollMargin,
              windowScrollY: window.scrollY,
            });
          });
        },
      });
    }
  }, [active, pathname]);

  const LinkComponent = external ? 'a' : NextLink;

  return (
    <li ref={ref} {...other} className={clsx('SideNavItem', className)}>
      <LinkComponent
        className="SideNavLink"
        href={href}
        scroll={external ? undefined : !active}
        {...(active
          ? {
              'aria-current': true,
              'data-active': true,
              onClick: () => {
                // Scroll to top smoothly when clicking on the currently active item
                window.scrollTo({ top: 0, behavior: 'smooth' });
              },
            }
          : {})}
      >
        {children}
      </LinkComponent>
    </li>
  );
}
