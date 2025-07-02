'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useEventCallback } from '../../utils/useEventCallback';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRoot } from '../root/AvatarRoot';
import { avatarStyleHookMapping } from '../root/styleHooks';
import { useImageLoadingStatus, ImageLoadingStatus } from './useImageLoadingStatus';

/**
 * The image to be displayed in the avatar.
 * Renders an `<img>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export const AvatarImage = React.forwardRef(function AvatarImage(
  componentProps: AvatarImage.Props,
  forwardedRef: React.ForwardedRef<HTMLImageElement>,
) {
  const {
    className,
    render,
    onLoadingStatusChange: onLoadingStatusChangeProp,
    referrerPolicy,
    crossOrigin,
    ...elementProps
  } = componentProps;

  const context = useAvatarRootContext();
  const imageLoadingStatus = useImageLoadingStatus(componentProps.src, {
    referrerPolicy,
    crossOrigin,
  });

  const handleLoadingStatusChange = useEventCallback((status: ImageLoadingStatus) => {
    onLoadingStatusChangeProp?.(status);
    context.setImageLoadingStatus(status);
  });

  useModernLayoutEffect(() => {
    if (imageLoadingStatus !== 'idle') {
      handleLoadingStatusChange(imageLoadingStatus);
    }
  }, [imageLoadingStatus, handleLoadingStatusChange]);

  const state: AvatarRoot.State = React.useMemo(
    () => ({
      imageLoadingStatus,
    }),
    [imageLoadingStatus],
  );

  const element = useRenderElement('img', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    customStyleHookMapping: avatarStyleHookMapping,
    enabled: imageLoadingStatus === 'loaded',
  });

  return element;
});

export namespace AvatarImage {
  export interface Props extends BaseUIComponentProps<'img', AvatarRoot.State> {
    /**
     * Callback fired when the loading status changes.
     */
    onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
  }
}
