import clsx from 'clsx';
import * as React from 'react';

export function Root({ className, ...props }: React.ComponentProps<'figure'>) {
  return <figure className={clsx('CodeBlockRoot', className)} {...props} />;
}

export function Title({ className, ...props }: React.ComponentProps<'figcaption'>) {
  return <figcaption className={clsx('CodeBlockTitle', className)} {...props} />;
}

export function Pre({ className, ...props }: React.ComponentProps<'pre'>) {
  return <pre className={clsx('CodeBlockPre', className)} {...props} />;
}
