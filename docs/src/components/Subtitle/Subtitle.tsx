import * as React from 'react';
import clsx from 'clsx';

export function Subtitle({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={clsx('Subtitle', className)} {...props} />;
}
