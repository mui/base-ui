'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { AvatarRootContext } from './AvatarRootContext';
import { avatarStyleHookMapping } from './styleHooks';

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

  const [imageLoadingStatus, setImageLoadingStatus] = React.useState<ImageLoadingStatus>('idle');

  const state: AvatarRoot.State = React.useMemo(
    () => ({
      imageLoadingStatus,
    }),
    [imageLoadingStatus],
  );

  const contextValue = React.useMemo(
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
    customStyleHookMapping: avatarStyleHookMapping,
  });

  return <AvatarRootContext.Provider value={contextValue}>{element}</AvatarRootContext.Provider>;
});

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

export namespace AvatarRoot {
  export interface Props extends BaseUIComponentProps<'span', State> {}

  export interface State {
    imageLoadingStatus: ImageLoadingStatus;
  }
}
