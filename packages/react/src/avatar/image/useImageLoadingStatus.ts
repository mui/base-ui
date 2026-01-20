'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { NOOP } from '../../utils/noop';

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface UseImageLoadingStatusOptions {
  referrerPolicy?: React.HTMLAttributeReferrerPolicy | undefined;
  crossOrigin?: React.ImgHTMLAttributes<HTMLImageElement>['crossOrigin'] | undefined;
}

export function useImageLoadingStatus(
  src: string | undefined,
  { referrerPolicy, crossOrigin }: UseImageLoadingStatusOptions,
): ImageLoadingStatus {
  const [loadingStatus, setLoadingStatus] = React.useState<ImageLoadingStatus>('idle');

  useIsoLayoutEffect(() => {
    if (!src) {
      setLoadingStatus('error');
      return NOOP;
    }

    let isMounted = true;
    const image = new window.Image();

    const updateStatus = (status: ImageLoadingStatus) => () => {
      if (!isMounted) {
        return;
      }

      setLoadingStatus(status);
    };

    setLoadingStatus('loading');
    image.onload = updateStatus('loaded');
    image.onerror = updateStatus('error');
    if (referrerPolicy) {
      image.referrerPolicy = referrerPolicy;
    }
    image.crossOrigin = crossOrigin ?? null;
    image.src = src;

    return () => {
      isMounted = false;
    };
  }, [src, crossOrigin, referrerPolicy]);

  return loadingStatus;
}
