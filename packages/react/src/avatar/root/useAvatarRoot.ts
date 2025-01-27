'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';

export function useAvatarRoot(): useAvatarRoot.ReturnValue {
  const [imageLoadingStatus, setImageLoadingStatus] = React.useState<
    'idle' | 'loading' | 'loaded' | 'error'
  >('idle');

  const getRootProps = React.useCallback((externalProps = {}) => {
    return mergeReactProps(externalProps, {});
  }, []);

  return React.useMemo(
    () => ({
      getRootProps,
      imageLoadingStatus,
      onImageLoadingStatusChange: setImageLoadingStatus,
    }),
    [getRootProps, imageLoadingStatus],
  );
}

export namespace useAvatarRoot {
  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'span'>,
    ) => React.ComponentPropsWithRef<'span'>;
    imageLoadingStatus: 'idle' | 'loading' | 'loaded' | 'error';
    onImageLoadingStatusChange: (status: 'idle' | 'loading' | 'loaded' | 'error') => void;
  }
}
