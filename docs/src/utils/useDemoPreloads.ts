'use client';
import * as React from 'react';
import type { DeferredSources } from '@mui/internal-docs-infra/lite/runtime';
import { useIdleCallback } from '@base-ui/utils/useIdleCallback';

const importSandboxesModule = () => import('./demoSandboxes');
let sandboxesModule: ReturnType<typeof importSandboxesModule> | undefined;

export function loadSandboxesModule() {
  sandboxesModule ??= importSandboxesModule();
  return sandboxesModule;
}

interface UseDemoPreloadsParameters {
  deferredUrl?: string;
  preloadSources: boolean;
  loadDeferredSources: () => Promise<DeferredSources | null>;
}

export function useDemoPreloads({
  deferredUrl,
  preloadSources,
  loadDeferredSources,
}: UseDemoPreloadsParameters) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const sandboxesIdleCallback = useIdleCallback();

  React.useEffect(() => {
    if (!deferredUrl) {
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
  }, [deferredUrl, loadDeferredSources, preloadSources]);

  React.useEffect(() => {
    sandboxesIdleCallback.start(() => {
      void loadSandboxesModule();
    });
  }, [sandboxesIdleCallback]);

  return rootRef;
}
