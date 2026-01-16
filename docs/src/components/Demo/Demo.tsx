'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Collapsible } from '@base-ui/react/collapsible';
import type { ContentProps } from '@mui/internal-docs-infra/CodeHighlighter/types';
import { useDemo } from '@mui/internal-docs-infra/useDemo';
import { CopyIcon } from 'docs/src/icons/CopyIcon';
import clsx from 'clsx';
import { CheckIcon } from 'docs/src/icons/CheckIcon';
import { ExternalLinkIcon } from 'docs/src/icons/ExternalLinkIcon';
import { exportCodeSandbox, exportOpts } from 'docs/src/utils/demoExportOptions';
import { isSafari, isEdge } from '@base-ui/utils/detectBrowser';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { DemoVariantSelector } from './DemoVariantSelector';
import { DemoFileSelector } from './DemoFileSelector';
import { DemoCodeBlock } from './DemoCodeBlock';
import { GhostButton } from '../GhostButton';
import { DemoPlayground } from './DemoPlayground';

export type DemoProps = ContentProps<{
  defaultOpen?: boolean;
  compact?: boolean;
  className?: string;
  showExtraPlaygroundLink?: boolean;
}>;

export function Demo({
  defaultOpen = false,
  compact = false,
  showExtraPlaygroundLink = false,
  className,
  ...demoProps
}: DemoProps) {
  const collapsibleTriggerRef = React.useRef<HTMLButtonElement>(null);
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

  const onOpenChange = useStableCallback((nextOpen) => {
    if (!nextOpen && collapsibleTriggerRef.current != null) {
      const triggerEl = collapsibleTriggerRef.current;
      const rectTopBeforeClose = triggerEl.getBoundingClientRect().top;

      ReactDOM.flushSync(() => demo.setExpanded(nextOpen));

      const rectTopAfterClose = triggerEl.getBoundingClientRect().top;
      const delta = rectTopAfterClose - rectTopBeforeClose;
      // don't scroll if the trigger is still in the viewport after closing
      if (rectTopAfterClose < 0) {
        window.scrollBy({
          top: delta,
          behavior: 'instant',
        });
      }
      return;
    }

    demo.setExpanded(nextOpen);
  });

  const demo = useDemo(demoProps, {
    copy: { onCopied },
    defaultOpen,
    export: exportOpts,
    exportCodeSandbox,
  });

  const [fallbackToCodeSandbox, setFallbackToCodeSandbox] = React.useState(false);
  React.useEffect(() => {
    if (isSafari || isEdge) {
      setFallbackToCodeSandbox(true);
    }
  }, []);

  const externalPlaygroundLink = fallbackToCodeSandbox ? (
    <GhostButton aria-label="Open in CodeSandbox" type="button" onClick={demo.openCodeSandbox}>
      CodeSandbox
      <ExternalLinkIcon />
    </GhostButton>
  ) : (
    <GhostButton aria-label="Open in StackBlitz" type="button" onClick={demo.openStackBlitz}>
      StackBlitz
      <ExternalLinkIcon />
    </GhostButton>
  );

  return (
    <div className={clsx('DemoRoot', className)}>
      {demo.allFilesSlugs.map(({ slug }) => (
        <span key={slug} id={slug} className="scroll-mt-4" />
      ))}
      <DemoPlayground component={demo.component} variant={demo.selectedVariant}>
        {showExtraPlaygroundLink && (
          <span className="absolute top-3 right-4.5">{externalPlaygroundLink}</span>
        )}
      </DemoPlayground>
      <Collapsible.Root open={demo.expanded} onOpenChange={onOpenChange}>
        <div role="figure" aria-label="Component demo code">
          {(compact ? demo.expanded : true) && (
            <div className="DemoToolbar">
              <DemoFileSelector
                files={demo.files}
                selectedFileName={demo.selectedFileName}
                selectFileName={demo.selectFileName}
                onTabChange={demo.expand}
              />

              <div className="DemoToolbarActions">
                <DemoVariantSelector
                  className="contents"
                  onVariantChange={demo.expand}
                  variants={demo.variants}
                  selectedVariant={demo.selectedVariant}
                  selectVariant={demo.selectVariant as any}
                  availableTransforms={demo.availableTransforms}
                  selectedTransform={demo.selectedTransform}
                  selectTransform={demo.selectTransform}
                />
                {externalPlaygroundLink}
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
            selectedFileName={demo.selectedFileName}
            selectedFileLines={demo.selectedFileLines}
            collapsibleOpen={demo.expanded}
            collapsibleTriggerRef={collapsibleTriggerRef}
            compact={compact}
          />
        </div>
      </Collapsible.Root>
    </div>
  );
}
