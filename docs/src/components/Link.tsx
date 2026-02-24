import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { ExternalLinkIcon } from 'docs/src/icons/ExternalLinkIcon';

interface LinkProps extends React.ComponentProps<typeof NextLink> {
  skipExternalIcon?: boolean;
}

export function Link(props: LinkProps) {
  const { href, className, skipExternalIcon, ...rest } = props;
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
        {...rest}
        href={href}
        className={clsx('Link', className)}
      >
        {props.children}
        {!skipExternalIcon && <ExternalLinkIcon />}
      </NextLink>
    );
  }

  if (pathname.endsWith('.md') || pathname.endsWith('.txt')) {
    // Relative URL, but outside the Next.js router
    return <a {...rest} href={pathname} className={clsx('Link', className)} />;
  }

  return <NextLink {...rest} href={href} className={clsx('Link', className)} />;
}
