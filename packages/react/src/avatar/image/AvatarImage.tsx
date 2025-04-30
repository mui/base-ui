'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
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
export const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImage.Props>(
  function AvatarImage(props: AvatarImage.Props, forwardedRef) {
    const {
      className,
      render,
      onLoadingStatusChange: onLoadingStatusChangeProp,
      referrerPolicy,
      crossOrigin,
      ...otherProps
    } = props;

    const context = useAvatarRootContext();
    const imageLoadingStatus = useImageLoadingStatus(props.src, {
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

    const { renderElement } = useComponentRenderer({
      render: render ?? 'img',
      state,
      className,
      ref: forwardedRef,
      extraProps: otherProps,
      customStyleHookMapping: avatarStyleHookMapping,
    });

    return imageLoadingStatus === 'loaded' ? renderElement() : null;
  },
);

export namespace AvatarImage {
  export interface Props extends BaseUIComponentProps<'img', AvatarRoot.State> {
    /**
     * Callback fired when the loading status changes.
     */
    onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
  }
}
