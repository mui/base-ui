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
        <BaseDemo.Playground className="DemoPlayground" />
      </ErrorBoundary>

      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <div className="DemoToolbar">
          <DemoFileSelector />

          <div className="ml-auto flex items-center gap-4">
            <DemoVariantSelector className="contents" />
            <CodeSandboxLink
              title="Base UI example"
              description="Base UI example"
              className="DemoToolbarButton"
            />
            <BaseDemo.SourceCopy
              className="DemoToolbarButton"
              onCopied={() => {
                window.clearTimeout(copyTimeout);
                const newTimeout = window.setTimeout(() => {
                  window.clearTimeout(newTimeout);
                  setCopyTimeout(0);
                }, 2000);
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

        <Collapsible.Panel
          render={<BaseDemo.SourceBrowser />}
          className="DemoCodeBlock"
          onScrollCapture={(event) => {
            if (event.target instanceof HTMLElement) {
              event.currentTarget.setAttribute(
                'data-scroll-top',
                event.target.scrollTop.toString(),
              );
            }
          }}
        />

        <Collapsible.Trigger className="DemoCollapseButton">
          {open ? 'Hide' : 'Show'} code
        </Collapsible.Trigger>
      </Collapsible.Root>
    </BaseDemo.Root>
  );
}
