import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { ExternalLinkIcon } from 'docs/src/components/icons/ExternalLinkIcon';

export function Link(props: React.ComponentProps<typeof NextLink>) {
  if (typeof props.href === 'string' && props.href.startsWith('http')) {
    return (
      <NextLink
        target="_blank"
        rel="noopener"
        {...props}
        className={clsx('Link inline-flex items-center gap-1', props.className)}
      >
        {props.children}
        <ExternalLinkIcon />
      </NextLink>
    );
  }
  return <NextLink {...props} className={clsx('Link', props.className)} />;
}
