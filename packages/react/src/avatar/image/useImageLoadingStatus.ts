'use client';
import * as React from 'react';

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

export function useImageLoadingStatus(
  src?: string,
  referrerPolicy?: React.HTMLAttributeReferrerPolicy,
): ImageLoadingStatus {
  const [loadingStatus, setLoadingStatus] = React.useState<ImageLoadingStatus>('idle');

  React.useLayoutEffect(() => {
    if (!src) {
      setLoadingStatus('error');
      return () => {};
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
    image.src = src;
    if (referrerPolicy) {
      image.referrerPolicy = referrerPolicy;
    }

    return () => {
      isMounted = false;
    };
  }, [src, referrerPolicy]);

  return loadingStatus;
}
