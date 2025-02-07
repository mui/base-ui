'use client';
import * as React from 'react';
import { NOOP } from '../../utils/noop';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface UseImageLoadingStatusOptions {
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  crossOrigin?: string | null;
}

export function useImageLoadingStatus(
  src?: string,
  options?: UseImageLoadingStatusOptions,
): ImageLoadingStatus {
  const [loadingStatus, setLoadingStatus] = React.useState<ImageLoadingStatus>('idle');

  useEnhancedEffect(() => {
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
    if (options?.referrerPolicy) {
      image.referrerPolicy = options.referrerPolicy;
    }
    if (options?.crossOrigin) {
      image.crossOrigin = options.crossOrigin;
    }
    image.src = src;

    return () => {
      isMounted = false;
    };
  }, [src, options]);

  return loadingStatus;
}
