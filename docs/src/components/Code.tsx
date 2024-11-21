import clsx from 'clsx';
import * as React from 'react';

interface CodeProps extends React.ComponentProps<'code'> {
  inline?: boolean;
}

export function Code({ className, inline = false, ...props }: CodeProps) {
  return <code data-inline={inline || undefined} className={clsx('Code', className)} {...props} />;
}
