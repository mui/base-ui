'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { BaseUIComponentProps } from '../../internals/types';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useRenderElement } from '../../internals/useRenderElement';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRootState, ImageLoadingStatus } from '../root/AvatarRoot';
import { avatarStateAttributesMapping } from '../root/stateAttributesMapping';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import { type TransitionStatus, useTransitionStatus } from '../../internals/useTransitionStatus';
import { useImageLoadingStatus } from './useImageLoadingStatus';

const stateAttributesMapping: StateAttributesMapping<AvatarImageState> = {
  ...avatarStateAttributesMapping,
  ...transitionStatusMapping,
};

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
    keepMounted = false,
    style,
    ...elementProps
  } = componentProps;

  const { setImageLoadingStatus: setRootImageLoadingStatus } = useAvatarRootContext();
  const [imageLoadingStatus, setImageLoadingStatus] = React.useState<ImageLoadingStatus>('idle');
  useImageLoadingStatus(elementProps.src, elementProps, !keepMounted, setImageLoadingStatus);

  const isVisible = imageLoadingStatus === 'loaded';
  const { mounted, transitionStatus, setMounted } = useTransitionStatus(isVisible);

  const imageRef = React.useRef<HTMLImageElement | null>(null);

  // With `keepMounted`, the status comes from the rendered element itself, whose `load` event may
  // have already fired (cached images, or loads completed before hydration).
  useIsoLayoutEffect(() => {
    if (!keepMounted) {
      return;
    }

    const image = imageRef.current;
    if (image?.complete) {
      setImageLoadingStatus(image.naturalWidth > 0 ? 'loaded' : 'error');
    } else {
      setImageLoadingStatus('loading');
    }
  }, [keepMounted, elementProps.src, elementProps.srcSet, render, setImageLoadingStatus]);

  const renderedStatusProps = keepMounted
    ? {
        onLoad() {
          setImageLoadingStatus('loaded');
        },
        onError() {
          setImageLoadingStatus('error');
        },
      }
    : undefined;

  const handleLoadingStatusChange = useStableCallback((status: ImageLoadingStatus) => {
    onLoadingStatusChangeProp?.(status);
    setRootImageLoadingStatus(status);
  });

  useIsoLayoutEffect(() => {
    if (imageLoadingStatus !== 'idle') {
      handleLoadingStatusChange(imageLoadingStatus);
    }
  }, [imageLoadingStatus, handleLoadingStatusChange]);

  useIsoLayoutEffect(() => {
    return () => setRootImageLoadingStatus('idle');
  }, [setRootImageLoadingStatus]);

  useOpenChangeComplete({
    open: isVisible,
    ref: imageRef,
    onComplete() {
      if (!isVisible) {
        setMounted(false);
      }
    },
  });

  const state: AvatarImageState = {
    imageLoadingStatus,
    transitionStatus,
  };

  const element = useRenderElement('img', componentProps, {
    state,
    ref: [forwardedRef, imageRef],
    props: [renderedStatusProps, elementProps],
    stateAttributesMapping,
    enabled: keepMounted || mounted,
  });

  if (!keepMounted && !mounted) {
    return null;
  }

  return element;
});

export interface AvatarImageState extends AvatarRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface AvatarImageProps extends BaseUIComponentProps<
  'img',
  AvatarImageState,
  React.ComponentPropsWithRef<'img'>
> {
  /**
   * Callback fired when the loading status changes.
   */
  onLoadingStatusChange?: ((status: ImageLoadingStatus) => void) | undefined;
  /**
   * Whether the image element remains mounted while loading or after failing to load.
   * When enabled, the image loads in place instead of being preloaded, which supports
   * `loading="lazy"` and optimized image components (for example `next/image`) via the
   * `render` prop.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace AvatarImage {
  export type State = AvatarImageState;
  export type Props = AvatarImageProps;
}
