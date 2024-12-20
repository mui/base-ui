import * as React from 'react';
import clsx from 'clsx';
import { LinkIcon } from 'docs/src/icons/LinkIcon';

export function HeadingLink({
  children,
  className,
  id,
  ...otherProps
}: React.ComponentPropsWithoutRef<'a'>) {
  return (
    <a
      className={clsx('HeadingLink mr-[0.5em] inline-flex items-center gap-[0.5em]', className)}
      href={`#${id}`}
      {...otherProps}
    >
      {children}
      <LinkIcon aria-hidden />
    </a>
  );
}
