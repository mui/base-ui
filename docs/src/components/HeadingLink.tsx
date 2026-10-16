import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import './HeadingLink.css';

interface HeadingLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  href: string;
}

export function HeadingLink({ className, href, ...props }: HeadingLinkProps) {
  const Component = href.startsWith('#') ? 'a' : NextLink;
  return <Component className={clsx('HeadingLink', className)} href={href} {...props} />;
}
