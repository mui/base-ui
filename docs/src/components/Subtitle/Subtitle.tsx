import * as React from 'react';
import clsx from 'clsx';
import { MarkdownLink } from './MarkdownLink';

export function Subtitle({
  className,
  skipMarkdownLink = false,
  ...props
}: React.ComponentProps<'p'> & { skipMarkdownLink?: boolean }) {
  return (
    <div
      className={clsx(
        'Subtitle flex items-baseline justify-between flex-col md:flex-row',
        className,
      )}
    >
      <p {...props} />
      {!skipMarkdownLink && <MarkdownLink />}
    </div>
  );
}
