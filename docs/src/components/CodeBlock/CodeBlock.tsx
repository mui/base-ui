'use client';
import * as React from 'react';
import copy from 'clipboard-copy';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { useGoogleAnalytics } from 'docs/src/blocks/GoogleAnalyticsProvider';
import * as ScrollArea from '../ScrollArea';
import { CopyIcon } from '../../icons/CopyIcon';
import { CheckIcon } from '../../icons/CheckIcon';
import { GhostButton } from '../GhostButton';
import './CodeBlock.css';

const CodeBlockContext = React.createContext({ codeId: '', titleId: '' });

export function Root(props: React.ComponentPropsWithoutRef<'div'>) {
  const titleId = React.useId();
  const codeId = React.useId();
  const context = React.useMemo(() => ({ codeId, titleId }), [codeId, titleId]);
  return (
    <CodeBlockContext.Provider value={context}>
      <div
        role="figure"
        aria-labelledby={titleId}
        {...props}
        className={clsx('CodeBlockRoot', props.className)}
      />
    </CodeBlockContext.Provider>
  );
}

interface CodeBlockPanelProps extends React.ComponentPropsWithoutRef<'div'> {
  /** When provided, renders as a separate sr-only label instead of wrapping children. */
  title?: string;
}

export function Panel({ className, title, children, ...other }: CodeBlockPanelProps) {
  const { codeId, titleId } = React.useContext(CodeBlockContext);
  const [copyTimeout, setCopyTimeout] = React.useState<number>(0);
  const ga = useGoogleAnalytics();
  const pathname = usePathname();

  return (
    <div className={clsx('CodeBlockPanel', className)} {...other}>
      {title != null ? (
        <React.Fragment>
          <span id={titleId} className="sr-only">
            {title}
          </span>
          {children}
        </React.Fragment>
      ) : (
        <div id={titleId} className="CodeBlockPanelTitle">
          {children}
        </div>
      )}
      <GhostButton
        aria-label="Copy code"
        onClick={async () => {
          const code = document.getElementById(codeId)?.textContent;

          if (code) {
            await copy(code);
            const titleText = document.getElementById(titleId)?.textContent ?? undefined;
            const codeBlockId = titleText ? `${pathname}#${titleText}` : pathname;
            ga?.trackEvent({
              category: 'code_block',
              action: 'copy',
              label: codeBlockId,
              params: { copy: codeBlockId, slug: titleText || '' },
            });
            /* eslint-disable no-restricted-syntax */
            const newTimeout = window.setTimeout(() => {
              window.clearTimeout(newTimeout);
              setCopyTimeout(0);
            }, 2000);
            window.clearTimeout(copyTimeout);
            setCopyTimeout(newTimeout);
            /* eslint-enable no-restricted-syntax */
          }
        }}
      >
        Copy
        <span className="CodeBlockCopyIcon">{copyTimeout ? <CheckIcon /> : <CopyIcon />}</span>
      </GhostButton>
    </div>
  );
}

export function PreInline(props: React.ComponentProps<'pre'>) {
  const { codeId } = React.useContext(CodeBlockContext);
  return (
    <ScrollArea.Root
      // Select code block contents on Ctrl/Cmd + A
      tabIndex={-1}
      className="CodeBlockPreContainer"
      onKeyDown={(event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          String.fromCharCode(event.keyCode) === 'A' &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          window.getSelection()?.selectAllChildren(event.currentTarget);
        }
      }}
    >
      <ScrollArea.Viewport
        style={{ overflow: undefined }}
        render={
          <pre {...props} id={codeId} className={clsx('CodeBlockPreInline', props.className)} />
        }
      />
      <ScrollArea.Scrollbar orientation="horizontal" />
    </ScrollArea.Root>
  );
}

export function Pre(props: React.ComponentProps<'pre'>) {
  return <PreInline {...props} className="CodeBlockPre" />;
}
