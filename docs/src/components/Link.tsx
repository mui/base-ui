import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { ExternalLinkIcon } from 'docs/src/icons/ExternalLinkIcon';

export function Link(props: React.ComponentProps<typeof NextLink>) {
  const { href, className } = props;
  let pathname = typeof href === 'string' ? href : href.pathname!;

  // Sometimes link come from component descriptions; in this case, remove the domain
  if (pathname.startsWith('https://base-ui.com/')) {
    pathname = pathname.replace('https://base-ui.com/', '/');
  }

  if (pathname.startsWith('http')) {
    return (
      <NextLink
        target="_blank"
        rel="noopener"
        {...props}
        href={href}
        className={clsx('Link mr-[0.125em] inline-flex items-center gap-[0.25em]', className)}
      >
        {props.children}
        <ExternalLinkIcon />
      </NextLink>
    );
  }

  if (pathname.endsWith('.md') || pathname.endsWith('.txt')) {
    // Relative URL, but outside the Next.js router
    return <a {...props} href={pathname} className={clsx('Link', className)} />;
  }

  return <NextLink {...props} className={clsx('Link', className)} />;
}
