'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { AvatarRootContext } from './AvatarRootContext';
import { avatarStateAttributesMapping } from './stateAttributesMapping';
import { useMemo } from '@base-ui/utils/useMemo';
import { useState } from '@base-ui/utils/useState';

/**
 * Displays a user's profile picture, initials, or fallback icon.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export const AvatarRoot = React.forwardRef(function AvatarRoot(
  componentProps: AvatarRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const [imageLoadingStatus, setImageLoadingStatus] = useState<ImageLoadingStatus>('idle');

  const state: AvatarRoot.State = useMemo(
    () => ({
      imageLoadingStatus,
    }),
    [imageLoadingStatus],
  );

  const contextValue = useMemo(
    () => ({
      imageLoadingStatus,
      setImageLoadingStatus,
    }),
    [imageLoadingStatus, setImageLoadingStatus],
  );

  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: avatarStateAttributesMapping,
  });

  return <AvatarRootContext.Provider value={contextValue}>{element}</AvatarRootContext.Provider>;
});

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface AvatarRootState {
  imageLoadingStatus: ImageLoadingStatus;
}

export interface AvatarRootProps extends BaseUIComponentProps<'span', AvatarRoot.State> {}

export namespace AvatarRoot {
  export type State = AvatarRootState;
  export type Props = AvatarRootProps;
}
