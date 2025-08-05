'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import type { ContentProps } from '@mui/internal-docs-infra/CodeHighlighter';
import { useDemo } from '@mui/internal-docs-infra/useDemo';
import { CopyIcon } from 'docs/src/icons/CopyIcon';
import clsx from 'clsx';
import { CheckIcon } from 'docs/src/icons/CheckIcon';
import { DemoVariantSelector } from './DemoVariantSelector';
import { DemoFileSelector } from './DemoFileSelector';
import { DemoCodeBlock } from './DemoCodeBlock';
import { CodeSandboxLink } from './CodeSandboxLink';
import { GhostButton } from '../GhostButton';
import { DemoPlayground } from './DemoPlayground';

export type DemoProps = ContentProps<{
  defaultOpen?: boolean;
  compact?: boolean;
  className?: string;
}>;

export function Demo({ defaultOpen = false, compact = false, className, ...props }: DemoProps) {
  const [copyTimeout, setCopyTimeout] = React.useState<number>(0);
  const onCopied = React.useCallback(() => {
    /* eslint-disable no-restricted-syntax */
    const newTimeout = window.setTimeout(() => {
      window.clearTimeout(newTimeout);
      setCopyTimeout(0);
    }, 2000);
    window.clearTimeout(copyTimeout);
    setCopyTimeout(newTimeout);
    /* eslint-enable no-restricted-syntax */
  }, [copyTimeout]);

  const demo = useDemo(props, { copy: { onCopied }, defaultOpen });

  return (
    <div className={clsx('DemoRoot', className)}>
      <DemoPlayground component={demo.component} name={demo.name} />
      <Collapsible.Root open={demo.expanded} onOpenChange={demo.setExpanded}>
        <div role="figure" aria-label="Component demo code">
          {(compact ? demo.expanded : true) && (
            <div className="DemoToolbar">
              <DemoFileSelector
                files={demo.files}
                selectedFileName={demo.selectedFileName}
                selectFileName={demo.selectFileName}
                onTabChange={demo.expand}
              />

              <div className="ml-auto flex items-center gap-4">
                <DemoVariantSelector
                  className="contents"
                  onVariantChange={demo.expand}
                  variants={demo.variants}
                  selectedVariant={demo.selectedVariant}
                  selectVariant={demo.selectVariant}
                  availableTransforms={demo.availableTransforms}
                  selectedTransform={demo.selectedTransform}
                  selectTransform={demo.selectTransform}
                />
                <CodeSandboxLink
                  title="Base UI example"
                  description="Base UI example"
                  openCodeSandbox={demo.openCodeSandbox}
                />
                <GhostButton aria-label="Copy code" onClick={demo.copy}>
                  Copy
                  <span className="flex size-3.5 items-center justify-center">
                    {copyTimeout ? <CheckIcon /> : <CopyIcon />}
                  </span>
                </GhostButton>
              </div>
            </div>
          )}

          <DemoCodeBlock
            selectedFile={demo.selectedFile}
            collapsibleOpen={demo.expanded}
            compact={compact}
          />
        </div>
      </Collapsible.Root>
    </div>
  );
}
