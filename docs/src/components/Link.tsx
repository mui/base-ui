import * as React from 'react';
import NextLink from 'next/link';
import clsx from 'clsx';

export function Link({ className, ...props }: React.ComponentProps<typeof NextLink>) {
  return <NextLink className={clsx('Link', className)} {...props} />;
}
