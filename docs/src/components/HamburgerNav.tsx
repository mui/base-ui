'use client';
import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog } from '@base-ui-components/react/dialog';

export function Root(props: Dialog.Root.Props) {
  return <Dialog.Root {...props} />;
}

export const Trigger = Dialog.Trigger;

export function Backdrop({ className, ...props }: Dialog.Backdrop.Props) {
  return <Dialog.Backdrop className={clsx('HamburgerNavBackdrop', className)} {...props} />;
}

export function Popup({ children, className, ...props }: Dialog.Popup.Props) {
  return (
    <Dialog.Popup
      aria-label="Main navigation"
      data-hamburger-nav-viewport
      className={clsx('HamburgerNavPopup', className)}
      render={<nav />}
      {...props}
    >
      <div className="HamburgerNavViewport">{children}</div>
      <Dialog.Close aria-label="Close the navigation" className="HamburgerNavClose">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.75 0.75L6 6M11.25 11.25L6 6M6 6L0.75 11.25M6 6L11.25 0.75"
            stroke="currentcolor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Dialog.Close>
    </Dialog.Popup>
  );
}

export function Section({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={clsx('HamburgerNavSection', className)} {...props} />;
}

export function Heading({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={clsx('HamburgerNavHeading', className)} {...props}>
      <div className="HamburgerNavHeadingInner">{children}</div>
    </div>
  );
}

export function List({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={clsx('HamburgerNavList', className)} {...props} />;
}

interface ItemProps extends React.ComponentPropsWithoutRef<'li'> {
  active?: boolean;
  href: string;
}

export function Item({ children, className, href, ...props }: ItemProps) {
  return (
    <li className={clsx('HamburgerNavItem', className)} {...props}>
      <NextLink className="HamburgerNavLink" href={href}>
        {children}
      </NextLink>
    </li>
  );
}
