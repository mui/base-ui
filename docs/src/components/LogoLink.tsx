import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { Logo } from './Logo';
import './LogoLink.css';

type LogoLinkProps = Omit<React.ComponentProps<typeof NextLink>, 'href' | 'children'>;

export function LogoLink(props: LogoLinkProps) {
  const { className, ...rest } = props;

  return (
    <NextLink
      aria-label="Go to the homepage"
      {...rest}
      href="/"
      className={clsx('LogoLink', className)}
    >
      <Logo aria-hidden="true" />
    </NextLink>
  );
}
