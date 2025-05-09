import * as React from 'react';
import clsx from 'clsx';

export function SkipNav({ className, ...props }: React.ComponentProps<'a'>) {
  return <a className={clsx('SkipNav', className)} {...props} />;
}
