import * as React from 'react';
import clsx from 'clsx';
import { MarkdownLink } from './MarkdownLink';

export function Subtitle({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <div className={clsx('Subtitle flex items-baseline justify-between', className)}>
      <p {...props} />
      <MarkdownLink />
    </div>
  );
}
