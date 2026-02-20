import * as React from 'react';
import clsx from 'clsx';
import { MarkdownLink } from './MarkdownLink';

export function Subtitle({
  className,
  skipMarkdownLink = false,
  ...props
}: React.ComponentProps<'p'> & { skipMarkdownLink?: boolean }) {
  return (
    <div className={clsx('Subtitle', className)}>
      <p {...props} />
      {!skipMarkdownLink && <MarkdownLink />}
    </div>
  );
}
