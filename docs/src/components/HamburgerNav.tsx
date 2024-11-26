'use client';
import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog } from '@base-ui-components/react/dialog';
import scrollIntoView from 'scroll-into-view-if-needed';
import useForkRef from '@mui/utils/useForkRef';

export function Root(props: Dialog.Root.Props) {
  return <Dialog.Root {...props} />;
}

export const Trigger = Dialog.Trigger;

export function Backdrop({ className, ...props }: Dialog.Backdrop.Props) {
  return <Dialog.Backdrop className={clsx('HamburgerNavBackdrop', className)} {...props} />;
}

export function Popup({ className, ...props }: Dialog.Popup.Props) {
  return (
    <Dialog.Popup
      aria-label="Main navigation"
      data-hamburger-nav-viewport
      className={clsx('HamburgerNavPopup', className)}
      render={<nav />}
      {...props}
    />
  );
}

export function Section({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={clsx('HamburgerNavSection', className)} {...props} />;
}

export function Heading({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={clsx('HamburgerNavHeading', className)} {...props} />;
}

export function List({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={clsx('HamburgerNavList', className)} {...props} />;
}

interface ItemProps extends React.ComponentPropsWithoutRef<'li'> {
  ref?: React.Ref<HTMLAnchorElement>;
  active?: boolean;
  href: string;
}

export function Item({ children, className, href, ref: refProp, ...props }: ItemProps) {
  const ref = React.useRef<HTMLAnchorElement>(null);
  const pathname = usePathname();
  const active = pathname === href;

  React.useEffect(() => {
    if (ref.current && active) {
      // TODO Vlad this should be rem, not 48px
      const HEADER_HEIGHT = 48;
      const SCROLL_MARGIN = 48;
      const viewport = document.querySelector('[data-hamburger-nav-viewport]');

      if (!viewport) {
        return;
      }

      scrollIntoView(ref.current.parentElement!, {
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
    <li className={clsx('HamburgerNavItem', className)} {...props}>
      <NextLink
        ref={useForkRef(ref, refProp)}
        data-active={active ? '' : undefined}
        className="HamburgerNavLink"
        href={href}
      >
        {children}
      </NextLink>
    </li>
  );
}
