'use client';
import * as React from 'react';
import { Collapsible } from '@base_ui/react/Collapsible';
import * as BaseDemo from 'docs/src/blocks/Demo';
import { CopyIcon } from 'docs/src/icons/Copy';
import clsx from 'clsx';
import { CheckIcon } from 'docs/src/icons/Check';
import { ErrorBoundary } from 'react-error-boundary';
import { DemoVariantSelector } from './DemoVariantSelector';
import { DemoFileSelector } from './DemoFileSelector';
import { CodeSandboxLink } from './CodeSandboxLink';
import { DemoErrorFallback } from './DemoErrorFallback';
import { ToolbarButton } from '../ToolbarButton';

export interface DemoProps extends React.ComponentProps<typeof BaseDemo.Root> {
  variants: BaseDemo.DemoVariant[];
  defaultOpen?: boolean;
}

export function Demo({ className, defaultOpen = false, title, ...props }: DemoProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [copyTimeout, setCopyTimeout] = React.useState<number>(0);

  return (
    <BaseDemo.Root className={clsx('DemoRoot', className)} {...props}>
      <ErrorBoundary FallbackComponent={DemoErrorFallback}>
        <BaseDemo.Playground aria-label="Component demo" className="DemoPlayground" />
      </ErrorBoundary>

      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <div role="figure" aria-label="Component demo code">
          <div className="DemoToolbar">
            <DemoFileSelector onTabChange={() => setOpen(true)} />

            <div className="ml-auto flex items-center gap-4">
              <DemoVariantSelector className="contents" />
              <CodeSandboxLink title="Base UI example" description="Base UI example" />
              <BaseDemo.SourceCopy
                aria-label="Copy code"
                render={<ToolbarButton />}
                onCopied={() => {
                  const newTimeout = window.setTimeout(() => {
                    window.clearTimeout(newTimeout);
                    setCopyTimeout(0);
                  }, 2000);
                  window.clearTimeout(copyTimeout);
                  setCopyTimeout(newTimeout);
                }}
              >
                Copy
                <span className="flex size-[14px] items-center justify-center">
                  {copyTimeout ? <CheckIcon /> : <CopyIcon />}
                </span>
              </BaseDemo.SourceCopy>
            </div>
          </div>

          {/*
           * The trigger has to appear before the panel in the DOM in order
           * for the screen reader cursor navigation to make sense.
           */}
          <div className="flex flex-col-reverse">
            <Collapsible.Trigger className="DemoCollapseButton">
              {open ? 'Hide' : 'Show'} code
            </Collapsible.Trigger>

            <Collapsible.Panel
              hidden={false}
              render={
                <BaseDemo.SourceBrowser
                  tabIndex={-1}
                  aria-hidden={!open}
                  // aria-label="Code snippet"
                  className="DemoCodeBlockContainer"
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
              }
            />
          </div>
        </div>
      </Collapsible.Root>
    </BaseDemo.Root>
  );
}
