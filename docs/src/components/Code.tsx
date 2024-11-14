import clsx from 'clsx';
import * as React from 'react';

export function Code({ className, ...props }: React.ComponentProps<'code'>) {
  return <code className={clsx('Code', className)} {...props} />;
}
