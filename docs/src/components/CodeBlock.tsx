'use client';
import * as React from 'react';
import copy from 'clipboard-copy';
import clsx from 'clsx';
import * as ScrollArea from './ScrollArea';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { GhostButton } from './GhostButton';

const CodeBlockContext = React.createContext({ codeId: '', titleId: '' });

export function Root({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const titleId = React.useId();
  const codeId = React.useId();
  const context = React.useMemo(() => ({ codeId, titleId }), [codeId, titleId]);
  return (
    <CodeBlockContext.Provider value={context}>
      <div
        role="figure"
        aria-labelledby={titleId}
        className={clsx('CodeBlockRoot', className)}
        {...props}
      />
    </CodeBlockContext.Provider>
  );
}

export function Panel({ className, children, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const { codeId, titleId } = React.useContext(CodeBlockContext);
  const [copyTimeout, setCopyTimeout] = React.useState<number>(0);

  return (
    <div className={clsx('CodeBlockPanel', className)} {...props}>
      <div id={titleId} className="CodeBlockPanelTitle">
        {children}
      </div>
      <GhostButton
        aria-label="Copy code"
        onClick={async () => {
          const code = document.getElementById(codeId)?.textContent;

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
      </GhostButton>
    </div>
  );
}

export function Pre({ className, ...props }: React.ComponentProps<'pre'>) {
  const { codeId } = React.useContext(CodeBlockContext);
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <ScrollArea.Root
      // Select code block contents on Ctrl/Cmd + A
      tabIndex={-1}
      className="CodeBlockPreContainer"
      onKeyDown={(event) => {
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
    >
      <ScrollArea.Viewport
        render={<pre {...props} id={codeId} className={clsx('CodeBlockPre', className)} />}
      />
      <ScrollArea.Scrollbar orientation="horizontal" />
    </ScrollArea.Root>
  );
}
