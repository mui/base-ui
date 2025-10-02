import * as React from 'react';
import clsx from 'clsx';
import { MarkdownLink } from './MarkdownLink';

export function Subtitle({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <div
      className={clsx(
        'Subtitle flex flex-col items-baseline justify-between md:flex-row',
        className,
      )}
    >
      <p {...props} />
      <MarkdownLink />
    </div>
  );
}
