'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Collapsible } from '@base-ui/react/collapsible';
import * as Menu from 'docs/src/components/Menu';
import { usePathname } from 'next/navigation';
import type { ContentProps } from '@mui/internal-docs-infra/CodeHighlighter/types';
import { useDemo } from '@mui/internal-docs-infra/useDemo';
import { CopyIcon } from 'docs/src/icons/CopyIcon';
import copy from 'clipboard-copy';
import clsx from 'clsx';
import kebabCase from 'es-toolkit/compat/kebabCase';
import { CheckIcon } from 'docs/src/icons/CheckIcon';
import { ExternalLinkIcon } from 'docs/src/icons/ExternalLinkIcon';
import { GitHubIcon } from 'docs/src/icons/GitHubIcon';
import { MoreVertIcon } from 'docs/src/icons/MoreVertIcon';
import { exportCodeSandbox, exportOpts } from 'docs/src/utils/demoExportOptions';
import { getGitHubDemoUrl } from 'docs/src/utils/getGitHubDemoUrl';
import { isSafari, isEdge } from '@base-ui/utils/detectBrowser';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
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
  const [codeCopied, setCodeCopied] = React.useState(false);
  const [sourceLinkCopied, setSourceLinkCopied] = React.useState(false);
  const codeCopyResetTimeout = useTimeout();
  const sourceLinkCopyResetTimeout = useTimeout();
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

  const onCodeCopied = useStableCallback(() => {
    ga?.trackEvent({
      category: 'demo',
      action: 'copy',
      label: demoId,
      params: { copy: demoId, slug: demoSlug || '' },
    });

    setCodeCopied(true);
    codeCopyResetTimeout.start(2000, () => setCodeCopied(false));
  });

  const demo = useDemo(demoProps, {
    copy: { onCopied: onCodeCopied },
    defaultOpen,
    export: exportOpts,
    exportCodeSandbox,
  });

  const githubUrl = getGitHubDemoUrl(demoProps.url, demo.selectedVariant);

  const issueUrl = `https://github.com/mui/base-ui/issues/new/choose?title=${encodeURIComponent(`[${pathname.split('/').filter(Boolean).pop()}] `)}`;

  const onViewSource = useStableCallback(() => {
    ga?.trackEvent({
      category: 'demo',
      action: 'open_github',
      label: demoId,
      params: { github: demoId, slug: demoSlug || '' },
    });
  });

  const onOpenIssue = useStableCallback(() => {
    ga?.trackEvent({
      category: 'demo',
      action: 'open_issue',
      label: demoId,
      params: { issue: demoId, slug: demoSlug || '' },
    });
  });

  const onCopySourceLink = useStableCallback(async () => {
    if (!githubUrl) {
      return;
    }
    await copy(githubUrl);
    setSourceLinkCopied(true);

    ga?.trackEvent({
      category: 'demo',
      action: 'copy_source_link',
      label: demoId,
      params: { copy_source_link: demoId, slug: demoSlug || '' },
    });

    sourceLinkCopyResetTimeout.start(2000, () => setSourceLinkCopied(false));
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
        <span key={slug} id={slug} className="scroll-mt-4" />
      ))}
      <div onPointerDown={onPlaygroundInteraction} onKeyDownCapture={onPlaygroundInteraction}>
        <DemoPlayground component={demo.component} variant={demo.selectedVariant}>
          {showExtraPlaygroundLink && (
            <span className="absolute top-3 right-4.5">{externalPlaygroundLink}</span>
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
                  <span className="flex size-3.5 items-center justify-center">
                    {codeCopied ? (
                      <CheckIcon aria-hidden="true" />
                    ) : (
                      <CopyIcon aria-hidden="true" />
                    )}
                    <span className="sr-only" aria-live="polite">
                      {codeCopied && 'Code copied!'}
                    </span>
                  </span>
                </GhostButton>
                {githubUrl && (
                  <Menu.Root>
                    <Menu.Trigger data-layout="icon" aria-label="More actions">
                      <MoreVertIcon aria-hidden="true" />
                    </Menu.Trigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.LinkItem
                            href={githubUrl}
                            target="_blank"
                            rel="noopener"
                            onClick={onViewSource}
                          >
                            <GitHubIcon aria-hidden="true" className="size-3.5" />
                            View source on GitHub
                          </Menu.LinkItem>
                          <Menu.Item closeOnClick={false} onClick={onCopySourceLink}>
                            <span className="flex size-3.5 items-center justify-center">
                              {sourceLinkCopied ? (
                                <CheckIcon aria-hidden="true" />
                              ) : (
                                <CopyIcon aria-hidden="true" />
                              )}
                            </span>
                            Copy link to source
                            <span className="sr-only" aria-live="polite">
                              {sourceLinkCopied && 'Link copied!'}
                            </span>
                          </Menu.Item>
                          <Menu.Separator />
                          <Menu.LinkItem
                            href={issueUrl}
                            target="_blank"
                            rel="noopener"
                            onClick={onOpenIssue}
                          >
                            <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
                            Report an issue
                          </Menu.LinkItem>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                )}
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
