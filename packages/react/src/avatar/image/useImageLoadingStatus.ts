'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { NOOP } from '../../internals/noop';

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Tracks loading status without a separate preload [`Image()`] probe — the intrinsic `<img>` in `Avatar.Image` owns the
 * real load (`@load`, `@error`), while conceal/reveal hides decode flashes until the bitmap is settled.
 */
export function useImageLoadingStatus(src: string | undefined): ImageLoadingStatus {
  const [loadingStatus, setLoadingStatus] = React.useState<ImageLoadingStatus>(() =>
    src ? 'loaded' : 'idle',
  );

  useIsoLayoutEffect(() => {
    if (!src) {
      setLoadingStatus('error');
      return NOOP;
    }
    setLoadingStatus('loaded');
    return NOOP;
  }, [src]);

  return loadingStatus;
}
