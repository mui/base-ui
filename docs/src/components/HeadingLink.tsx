import * as React from 'react';
import clsx from 'clsx';
import { LinkIcon } from 'docs/src/icons/LinkIcon';

export function HeadingLink({
  children,
  className,
  id,
  ...props
}: React.ComponentPropsWithoutRef<'a'>) {
  return (
    <a
      className={clsx('HeadingLink inline-flex items-center gap-1', className)}
      href={`#${id}`}
      {...props}
    >
      {children}
      <LinkIcon aria-hidden />
    </a>
  );
}
