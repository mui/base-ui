'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { loadSearchSitemap } from './searchSitemap';

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

  return useStableCallback(async () => {
    if (!activeRef.current) {
      await new Promise<void>((resolve) => {
        pendingResolversRef.current.add(resolve);
      });
    }

    return sitemapImportRef.current();
  });
}
