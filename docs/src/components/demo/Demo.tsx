'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import * as BaseDemo from 'docs/src/blocks/Demo';
import { CopyIcon } from 'docs/src/components/icons/CopyIcon';
import clsx from 'clsx';
import { SmallCheckIcon } from 'docs/src/components/icons/CheckIcon';
import { DemoVariantSelector } from './DemoVariantSelector';
import { DemoFileSelector } from './DemoFileSelector';
import { DemoSourceBrowser } from './DemoSourceBrowser';
import { CodeSandboxLink } from './CodeSandboxLink';
import { GhostButton } from '../GhostButton';
import { DemoPlayground } from './DemoPlayground';

export interface DemoProps extends React.ComponentProps<typeof BaseDemo.Root> {
  variants: BaseDemo.DemoVariant[];
  defaultOpen?: boolean;
}

export function Demo({ className, defaultOpen = false, title, ...props }: DemoProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [copyTimeout, setCopyTimeout] = React.useState<number>(0);
  const expandCollapsible = React.useCallback(() => setOpen(true), []);

  return (
    <BaseDemo.Root className={clsx('DemoRoot', className)} {...props}>
      <DemoPlayground />
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <div role="figure" aria-label="Component demo code">
          <div className="DemoToolbar">
            <DemoFileSelector onTabChange={expandCollapsible} />

            <div className="ml-auto flex items-center gap-4">
              <DemoVariantSelector className="contents" onVariantChange={expandCollapsible} />
              <CodeSandboxLink title="Base UI example" description="Base UI example" />
              <BaseDemo.SourceCopy
                aria-label="Copy code"
                render={<GhostButton />}
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
                <span className="flex size-3.5 items-center justify-center">
                  {copyTimeout ? <SmallCheckIcon /> : <CopyIcon />}
                </span>
              </BaseDemo.SourceCopy>
            </div>
          </div>

          <DemoSourceBrowser collapsibleOpen={open} />
        </div>
      </Collapsible.Root>
    </BaseDemo.Root>
  );
}
