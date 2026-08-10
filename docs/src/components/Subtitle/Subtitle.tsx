import * as React from 'react';
import clsx from 'clsx';
import { MarkdownLink } from './MarkdownLink';
import { ViewSourceLink } from './ViewSourceLink';
import './Subtitle.css';

export function Subtitle({
  className,
  skipLinks = false,
  sourcePath,
  ...props
}: React.ComponentProps<'p'> & { skipLinks?: boolean; sourcePath?: string }) {
  return (
    <div className={clsx('Subtitle', className)}>
      <p {...props} />
      {!skipLinks && (
        <div className="SubtitleLinks">
          <MarkdownLink />
          <ViewSourceLink sourcePath={sourcePath} />
        </div>
      )}
    </div>
  );
}
