'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useTimeout } from '@base-ui/utils/useTimeout';
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
  const { close } = React.useContext(MobileNavContext);
  const pathname = usePathname();
  const active = props.active ?? pathname === href;
  const scrollTimeout = useTimeout();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (href !== window.location.pathname || isModifiedEvent(event)) {
      return;
    }

    event.preventDefault();
    close();
    scrollTimeout.start(500, () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleNavigate = () => {
    ReactDOM.flushSync(close);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const linkProps = {
    ariaCurrent: active ? ('page' as const) : undefined,
    dataActive: active ? '' : undefined,
    className: 'MobileNavLink',
    href,
    rel: props.rel,
    onClick: handleClick,
  };

  return (
    <li {...props} className={clsx('MobileNavItem', props.className)}>
      {external ? (
        <a
          aria-current={linkProps.ariaCurrent}
          data-active={linkProps.dataActive}
          className={linkProps.className}
          href={linkProps.href}
          rel={linkProps.rel}
          onClick={linkProps.onClick}
        >
          {props.children}
        </a>
      ) : (
        <NextLink
          aria-current={linkProps.ariaCurrent}
          data-active={linkProps.dataActive}
          className={linkProps.className}
          href={linkProps.href}
          rel={linkProps.rel}
          // We handle scroll manually.
          scroll={false}
          onClick={linkProps.onClick}
          onNavigate={handleNavigate}
        >
          {props.children}
        </NextLink>
      )}
    </li>
  );
}

function isModifiedEvent(event: React.MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}
