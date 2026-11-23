'use client';
import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@base-ui/react/scroll-area';
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

export function Separator(props: React.ComponentProps<'hr'>) {
  return <hr {...props} className={clsx('SideNavSeparator', props.className)} />;
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
  icon?: React.ReactNode;
}

export function Item(props: ItemProps) {
  const { children, className, href, external, icon, ...other } = props;
  const ref = React.useRef<HTMLLIElement>(null);
  const pathname = usePathname();
  const exactActive = pathname === href;
  const active = exactActive || pathname.startsWith(`${href}/`);

  React.useEffect(() => {
    if (active) {
      // The item's `scroll-margin-block` keeps a gap between it and the nav's edge.
      ref.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [active]);

  const LinkComponent = external ? 'a' : NextLink;
  const ariaCurrent = exactActive ? 'page' : 'location';

  return (
    <li ref={ref} {...other} className={clsx('SideNavItem', className)}>
      <LinkComponent
        className="SideNavLink"
        href={href}
        scroll={external ? undefined : !exactActive}
        data-active={active || undefined}
        aria-current={active ? ariaCurrent : undefined}
        {...(exactActive
          ? {
              onClick: () => {
                // Scroll to top smoothly when clicking on the currently active item
                window.scrollTo({ top: 0, behavior: 'smooth' });
              },
            }
          : {})}
      >
        {icon ? (
          <div className="SideNavLinkIconContainer">
            {icon}
            {children}
          </div>
        ) : (
          children
        )}
      </LinkComponent>
    </li>
  );
}
