'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Collapsible } from '@base-ui/react/collapsible';
import { usePathname } from 'next/navigation';
import type { ContentProps } from '@mui/internal-docs-infra/CodeHighlighter/types';
import { useDemo } from '@mui/internal-docs-infra/useDemo';
import { CopyIcon } from 'docs/src/icons/CopyIcon';
import clsx from 'clsx';
import kebabCase from 'es-toolkit/compat/kebabCase';
import { CheckIcon } from 'docs/src/icons/CheckIcon';
import { ExternalLinkIcon } from 'docs/src/icons/ExternalLinkIcon';
import { exportCodeSandbox, exportOpts } from 'docs/src/utils/demoExportOptions';
import { isSafari, isEdge } from '@base-ui/utils/detectBrowser';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useGoogleAnalytics } from 'docs/src/blocks/GoogleAnalyticsProvider';
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
  const ga = useGoogleAnalytics();
  const pathname = usePathname();
  const demoSlug = React.useMemo(
    () => demoProps.slug || (demoProps.name ? kebabCase(demoProps.name) : undefined),
    [demoProps.slug, demoProps.name],
  );
  const demoId = demoSlug ? `${pathname}#${demoSlug}` : pathname;
  const hasLoggedInteraction = React.useRef(false);

  const onPlaygroundInteraction = React.useCallback(() => {
    if (!hasLoggedInteraction.current) {
      hasLoggedInteraction.current = true;
      ga?.trackEvent({
        category: 'demo',
        action: 'interaction',
        label: demoId,
        params: { interaction: demoId, slug: demoSlug || '' },
      });
    }
  }, [ga, demoId, demoSlug]);

  const onCopied = React.useCallback(() => {
    ga?.trackEvent({
      category: 'demo',
      action: 'copy',
      label: demoId,
      params: { copy: demoId, slug: demoSlug || '' },
    });

    /* eslint-disable no-restricted-syntax */
    const newTimeout = window.setTimeout(() => {
      window.clearTimeout(newTimeout);
      setCopyTimeout(0);
    }, 2000);
    window.clearTimeout(copyTimeout);
    setCopyTimeout(newTimeout);
    /* eslint-enable no-restricted-syntax */
  }, [copyTimeout, ga, demoId, demoSlug]);

  const demo = useDemo(demoProps, {
    copy: { onCopied },
    defaultOpen,
    export: exportOpts,
    exportCodeSandbox,
  });

  const onOpenChange = useStableCallback((nextOpen: boolean) => {
    const action = nextOpen ? 'expand' : 'collapse';
    ga?.trackEvent({
      category: 'demo',
      action,
      label: demoId,
      params: { [action]: demoId, slug: demoSlug || '' },
    });

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

  const onSelectFile = useStableCallback((fileName: string) => {
    ga?.trackEvent({
      category: 'demo',
      action: 'file_select',
      label: demoId,
      params: { file_select: fileName, slug: demoSlug || '' },
    });
    demo.selectFileName(fileName);
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
        <span key={slug} id={slug} className="bui-scroll-mt-4" />
      ))}
      <div onPointerDown={onPlaygroundInteraction} onKeyDownCapture={onPlaygroundInteraction}>
        <DemoPlayground component={demo.component} variant={demo.selectedVariant}>
          {showExtraPlaygroundLink && (
            <span className="DemoPlaygroundExternalLink">{externalPlaygroundLink}</span>
          )}
        </DemoPlayground>
      </div>
      <Collapsible.Root open={demo.expanded} onOpenChange={onOpenChange}>
        <div role="figure" aria-label="Component demo code">
          {(compact ? demo.expanded : true) && (
            <div className="DemoToolbar">
              <DemoFileSelector
                files={demo.files}
                selectedFileName={demo.selectedFileName}
                selectFileName={onSelectFile}
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
                  <span className="DemoCopyIconWrap">
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
