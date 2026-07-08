'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileNavContext } from './MobileNavContext';
import './MobileNav.css';

export function Section(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('MobileNavSection', props.className)} />;
}

export function Heading(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('MobileNavHeading', props.className)} />;
}

export function List(props: React.ComponentProps<'ul'>) {
  return <ul {...props} className={clsx('MobileNavList', props.className)} />;
}

export function Badge(props: React.ComponentProps<'span'>) {
  return <span {...props} className={clsx('MobileNavBadge', props.className)} />;
}

interface ItemProps extends React.ComponentPropsWithoutRef<'li'> {
  active?: boolean;
  href: string;
  rel?: string;
  external?: boolean;
}

export function Item({ href, external, ...props }: ItemProps) {
  const { close, closeAndScrollTop } = React.useContext(MobileNavContext);
  const pathname = usePathname();
  const active = props.active ?? pathname === href;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (href !== window.location.pathname || isModifiedEvent(event)) {
      return;
    }

    event.preventDefault();
    closeAndScrollTop();
  };

  const handleNavigate = () => {
    ReactDOM.flushSync(close);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const linkProps = {
    'aria-current': active ? ('page' as const) : undefined,
    'data-active': active ? '' : undefined,
    className: 'MobileNavLink',
    href,
    rel: props.rel,
    onClick: handleClick,
  };

  return (
    <li {...props} className={clsx('MobileNavItem', props.className)}>
      {external ? (
        <a {...linkProps}>{props.children}</a>
      ) : (
        // We handle scroll manually
        <NextLink {...linkProps} scroll={false} onNavigate={handleNavigate}>
          {props.children}
        </NextLink>
      )}
    </li>
  );
}

function isModifiedEvent(event: React.MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}
