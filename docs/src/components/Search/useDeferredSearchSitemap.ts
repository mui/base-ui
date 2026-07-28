'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { loadSearchSitemap } from './searchSitemap';

// `sitemapImport` must reset its rejected import cache, otherwise the retry
// loop below would keep receiving the same rejected promise.
export function useDeferredSearchSitemap(active: boolean, sitemapImport = loadSearchSitemap) {
  const activeRef = React.useRef(active);
  const sitemapImportRef = React.useRef(sitemapImport);
  const pendingResolversRef = React.useRef<Set<() => void>>(new Set());

  activeRef.current = active;
  sitemapImportRef.current = sitemapImport;

  React.useEffect(() => {
    if (!active) {
      return undefined;
    }

    const pendingResolvers = pendingResolversRef.current;

    pendingResolvers.forEach((resolve) => resolve());
    pendingResolvers.clear();

    return undefined;
  }, [active]);

  const waitForActivation = useStableCallback(
    () =>
      new Promise<void>((resolve) => {
        pendingResolversRef.current.add(resolve);
      }),
  );

  return useStableCallback(async () => {
    if (!activeRef.current) {
      await waitForActivation();
    }

    for (;;) {
      try {
        // eslint-disable-next-line no-await-in-loop
        return await sitemapImportRef.current();
      } catch {
        // The import failed (e.g. a network error) and its cache was reset.
        // Retry on the next activation instead of leaving search
        // permanently broken, since the caller only invokes this loader once.
        // eslint-disable-next-line no-await-in-loop
        await waitForActivation();
      }
    }
  });
}
