import * as React from 'react';
import clsx from 'clsx';
import { MarkdownLink } from './MarkdownLink';

export function Subtitle({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <div
      className={clsx(
        'Subtitle flex items-baseline justify-between flex-col md:flex-row',
        className,
      )}
    >
      <p {...props} />
      <MarkdownLink />
    </div>
  );
}
