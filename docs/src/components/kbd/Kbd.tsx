import * as React from 'react';
import clsx from 'clsx';

export function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return <kbd className={clsx('Kbd', className)} {...props} />;
}
