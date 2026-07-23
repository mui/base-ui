'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Collapsible } from '@base-ui/react/collapsible';
import { ScrollArea } from '@base-ui/react/scroll-area';
import * as Menu from 'docs/src/components/Menu';
import { usePathname } from 'next/navigation';
import { useDemo, type ContentProps } from '@mui/internal-docs-infra/lite/runtime';
import { CopyIcon } from 'docs/src/icons/CopyIcon';
import copy from 'clipboard-copy';
import clsx from 'clsx';
import { CheckIcon } from 'docs/src/icons/CheckIcon';
import { ExternalLinkIcon } from 'docs/src/icons/ExternalLinkIcon';
import { GitHubIcon } from 'docs/src/icons/GitHubIcon';
import { MoreVertIcon } from 'docs/src/icons/MoreVertIcon';
import { getGitHubDemoUrl } from 'docs/src/utils/getGitHubDemoUrl';
import { useIdleCallback } from '@base-ui/utils/useIdleCallback';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { ownerWindow } from '@base-ui/utils/owner';
import { platform } from '@base-ui/utils/platform';
import { useGoogleAnalytics } from 'docs/src/blocks/GoogleAnalyticsProvider';
import { DemoVariantSelector } from './DemoVariantSelector';
import { DemoFileSelector } from './DemoFileSelector';
import { DemoCodeBlock } from './DemoCodeBlock';
import { GhostButton } from '../GhostButton';
import { DemoPlayground } from './DemoPlayground';
import './Demo.css';

const importSandboxesModule = () => import('docs/src/utils/demoSandboxes');
let sandboxesModule: ReturnType<typeof importSandboxesModule> | undefined;

function loadSandboxesModule() {
  sandboxesModule ??= importSandboxesModule();
  return sandboxesModule;
}

export type DemoProps = ContentProps<{
  className?: string;
  preloadSources?: boolean;
}>;

export function Demo({ className, preloadSources = false, ...demoProps }: DemoProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const collapsibleTriggerRef = React.useRef<HTMLSpanElement>(null);
  const [copyTimeout, setCopyTimeout] = React.useState<number>(0);
  const [sourceLinkCopied, setSourceLinkCopied] = React.useState(false);
  const sourceLinkCopyResetTimeout = useTimeout();
  const ga = useGoogleAnalytics();
  const pathname = usePathname();
  const demoSlug = demoProps.slug;
  const demoId = `${pathname}#${demoSlug}`;
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
  });
  const loadDeferredSources = demo.loadDeferredSources;
  const sandboxesIdleCallback = useIdleCallback();

  React.useEffect(() => {
    if (!demoProps.code.deferredUrl) {
      return undefined;
    }
    if (preloadSources) {
      void loadDeferredSources();
      return undefined;
    }
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        void loadDeferredSources();
      }
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [demoProps.code.deferredUrl, loadDeferredSources, preloadSources]);

  React.useEffect(() => {
    sandboxesIdleCallback.start(() => {
      void loadSandboxesModule();
    });
  }, [sandboxesIdleCallback]);

  const [fallbackToCodeSandbox, setFallbackToCodeSandbox] = React.useState(false);
  React.useEffect(() => {
    if (platform.engine.webkit) {
      setFallbackToCodeSandbox(true);
    }
  }, []);

  const githubUrl = getGitHubDemoUrl(demoProps.url, demo.selectedVariant);

  const onViewSource = useStableCallback(() => {
    ga?.trackEvent({
      category: 'demo',
      action: 'open_github',
      label: demoId,
      params: { github: demoId, slug: demoSlug || '' },
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
      const buttonVisualEl = collapsibleTriggerRef.current;
      const rectTopBeforeClose = buttonVisualEl.getBoundingClientRect().top;

      ReactDOM.flushSync(() => demo.setExpanded(nextOpen));

      const rectTopAfterClose = buttonVisualEl.getBoundingClientRect().top;
      const delta = rectTopAfterClose - rectTopBeforeClose;
      // Don't scroll if the collapse button is still in the viewport after closing.
      if (rectTopAfterClose < 0) {
        ownerWindow(buttonVisualEl).scrollBy({
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

  const onOpenStackBlitz = useStableCallback(async () => {
    const [{ openDemoStackBlitz }, deferredSources] = await Promise.all([
      loadSandboxesModule(),
      loadDeferredSources(),
    ]);
    openDemoStackBlitz(demoProps.code, demo.selectedVariant, demoProps.name, deferredSources);
  });

  const onOpenCodeSandbox = useStableCallback(async () => {
    const [{ openDemoCodeSandbox }, deferredSources] = await Promise.all([
      loadSandboxesModule(),
      loadDeferredSources(),
    ]);
    openDemoCodeSandbox(demoProps.code, demo.selectedVariant, demoProps.name, deferredSources);
  });

  const onSelectVariant = useStableCallback((variantName: string | null) => {
    ga?.trackEvent({
      category: 'demo',
      action: 'variant_select',
      label: demoId,
      params: { variant_select: variantName ?? 'default', slug: demoSlug || '' },
    });
    demo.selectVariant(variantName);
    demo.expand();
  });

  const externalPlaygroundLink = fallbackToCodeSandbox ? (
    <GhostButton aria-label="Open in CodeSandbox" type="button" onClick={onOpenCodeSandbox}>
      CodeSandbox
      <ExternalLinkIcon />
    </GhostButton>
  ) : (
    <GhostButton aria-label="Open in StackBlitz" type="button" onClick={onOpenStackBlitz}>
      StackBlitz
      <ExternalLinkIcon />
    </GhostButton>
  );

  const toolbarActions = (
    <React.Fragment>
      {demo.variants.length > 1 && (
        <DemoVariantSelector
          onVariantChange={onSelectVariant}
          variants={demo.variants}
          variant={demo.selectedVariant}
        />
      )}
      {externalPlaygroundLink}
      {githubUrl && (
        <Menu.Root>
          <Menu.Trigger
            render={
              <GhostButton layout="icon" aria-label="More actions">
                <MoreVertIcon aria-hidden="true" />
              </GhostButton>
            }
          />
          <Menu.Popup align="end" alignOffset={-5}>
            <Menu.LinkItem href={githubUrl} target="_blank" rel="noopener" onClick={onViewSource}>
              <GitHubIcon aria-hidden="true" />
              View source on GitHub
              <ExternalLinkIcon aria-hidden="true" />
            </Menu.LinkItem>

            <Menu.Item closeOnClick={false} onClick={onCopySourceLink}>
              {sourceLinkCopied ? (
                <CheckIcon aria-hidden="true" />
              ) : (
                <CopyIcon aria-hidden="true" />
              )}
              Copy link to source
              <span className="sr-only" aria-live="polite">
                {sourceLinkCopied && 'Link copied!'}
              </span>
            </Menu.Item>
          </Menu.Popup>
        </Menu.Root>
      )}
    </React.Fragment>
  );

  return (
    <div ref={rootRef} className={clsx('DemoRoot', className)}>
      {demo.allFilesSlugs.map(({ slug }) => (
        <span key={slug} id={slug} className="bui-scroll-mt-4" />
      ))}
      <div onPointerDown={onPlaygroundInteraction} onKeyDownCapture={onPlaygroundInteraction}>
        <DemoPlayground component={demo.component} variant={demo.selectedVariant} />
      </div>
      <Collapsible.Root
        className="DemoCollapsibleRoot"
        open={demo.expanded}
        onOpenChange={onOpenChange}
      >
        <div role="figure" aria-label="Component demo code">
          <div className="DemoToolbar">
            {/* One ScrollArea drives the edge-fade indicators at every viewport.
                Below --sm the actions sit inside it (they scroll with the tabs);
                at --sm+ the in-scroll copy is hidden and the sticky copy outside
                takes over. Both copies stay mounted so state survives a resize. */}
            <ScrollArea.Root className="DemoToolbarScrollAreaRoot">
              <ScrollArea.Viewport className="DemoToolbarViewport">
                <DemoFileSelector
                  files={demo.files}
                  selectedFileName={demo.selectedFileName}
                  selectFileName={onSelectFile}
                  onTabChange={demo.expand}
                />
                <div className="DemoToolbarActions DemoToolbarActionsMobile">{toolbarActions}</div>
              </ScrollArea.Viewport>
            </ScrollArea.Root>

            <div className="DemoToolbarActions DemoToolbarActionsDesktop">{toolbarActions}</div>
          </div>

          <DemoCodeBlock
            selectedFile={demo.selectedFile}
            selectedFileLines={demo.selectedFileLines}
            reserveHeight={demo.loading || demo.expanded}
            collapsibleOpen={demo.expanded}
            collapsibleTriggerRef={collapsibleTriggerRef}
            copyButton={
              <GhostButton
                layout="icon"
                aria-label="Copy code"
                onClick={demo.copy}
                className="DemoCodeBlockCopyButton"
              >
                {copyTimeout ? <CheckIcon /> : <CopyIcon />}
              </GhostButton>
            }
          />
        </div>
      </Collapsible.Root>
    </div>
  );
}
