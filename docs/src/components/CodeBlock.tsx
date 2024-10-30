'use client';
import * as React from 'react';
import copy from 'clipboard-copy';
import clsx from 'clsx';
import { CopyIcon } from '../icons/Copy';
import { CheckIcon } from '../icons/Check';
import { ToolbarButton } from './ToolbarButton';

export function Root({ className, ...props }: React.ComponentProps<'figure'>) {
  return <figure className={clsx('CodeBlockRoot', className)} {...props} />;
}

export function Panel({ className, children, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [copyTimeout, setCopyTimeout] = React.useState<number>(0);

  return (
    <div className={clsx('CodeBlockPanel', className)} {...props}>
      <figcaption className="CodeBlockPanelTitle">{children}</figcaption>
      <ToolbarButton
        aria-label="Copy code"
        onClick={async (event) => {
          const code = event.currentTarget.closest('figure')?.querySelector('pre')?.textContent;

          if (code) {
            await copy(code);
            const newTimeout = window.setTimeout(() => {
              window.clearTimeout(newTimeout);
              setCopyTimeout(0);
            }, 2000);
            window.clearTimeout(copyTimeout);
            setCopyTimeout(newTimeout);
          }
        }}
      >
        Copy
        <span className="flex size-[14px] items-center justify-center">
          {copyTimeout ? <CheckIcon /> : <CopyIcon />}
        </span>
      </ToolbarButton>
    </div>
  );
}

export function Pre({ className, ...props }: React.ComponentProps<'pre'>) {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <pre
      className={clsx('CodeBlockPre', className)}
      {...props}
      tabIndex={-1}
      onKeyDown={(event) => {
        // Select code block contents on Ctrl/Cmd + A
        if (
          event.key === 'a' &&
          (event.metaKey || event.ctrlKey) &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          window.getSelection()?.selectAllChildren(event.currentTarget);
        }
      }}
    />
  );
}
