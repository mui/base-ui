import * as React from 'react';
import clsx from 'clsx';
import { Code } from './Code';

export interface TableCodeProps extends React.ComponentProps<'code'> {}

/** An inline code component for use in type tables */
export function TableCode({ className, ...props }: TableCodeProps) {
  return <Code {...props} data-table-code="" className={clsx('text-xs', className)} />;
}
