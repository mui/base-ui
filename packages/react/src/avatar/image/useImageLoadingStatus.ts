'use client';
import * as React from 'react';
import { NOOP } from '../../utils/noop';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface UseImageLoadingStatusOptions {
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  crossOrigin?: React.ImgHTMLAttributes<HTMLImageElement>['crossOrigin'];
}

export function useImageLoadingStatus(
  src: string | undefined,
  { referrerPolicy, crossOrigin }: UseImageLoadingStatusOptions,
): ImageLoadingStatus {
  const [loadingStatus, setLoadingStatus] = React.useState<ImageLoadingStatus>('idle');

  useModernLayoutEffect(() => {
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
