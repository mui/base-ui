import * as React from 'react';
import clsx from 'clsx';

export function HeadingLink({ className, id, ...props }: React.ComponentPropsWithoutRef<'a'>) {
  return <a className={clsx('HeadingLink', className)} href={`#${id}`} {...props} />;
}
