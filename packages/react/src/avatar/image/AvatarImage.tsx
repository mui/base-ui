'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { BaseUIComponentProps } from '../../utils/types';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useRenderElement } from '../../utils/useRenderElement';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRoot } from '../root/AvatarRoot';
import { avatarStateAttributesMapping } from '../root/stateAttributesMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useImageLoadingStatus, ImageLoadingStatus } from './useImageLoadingStatus';

const stateAttributesMapping: StateAttributesMapping<AvatarImage.State> = {
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
    referrerPolicy,
    crossOrigin,
    ...elementProps
  } = componentProps;

  const context = useAvatarRootContext();
  const imageLoadingStatus = useImageLoadingStatus(componentProps.src, {
    referrerPolicy,
    crossOrigin,
  });

  const isVisible = imageLoadingStatus === 'loaded';
  const { mounted, transitionStatus, setMounted } = useTransitionStatus(isVisible);

  const imageRef = React.useRef<HTMLImageElement | null>(null);

  const handleLoadingStatusChange = useStableCallback((status: ImageLoadingStatus) => {
    onLoadingStatusChangeProp?.(status);
    context.setImageLoadingStatus(status);
  });

  useIsoLayoutEffect(() => {
    if (imageLoadingStatus !== 'idle') {
      handleLoadingStatusChange(imageLoadingStatus);
    }
  }, [imageLoadingStatus, handleLoadingStatusChange]);

  const state: AvatarImage.State = {
    imageLoadingStatus,
    transitionStatus,
  };

  useOpenChangeComplete({
    open: isVisible,
    ref: imageRef,
    onComplete() {
      if (!isVisible) {
        setMounted(false);
      }
    },
  });

  const element = useRenderElement('img', componentProps, {
    state,
    ref: [forwardedRef, imageRef],
    props: elementProps,
    stateAttributesMapping,
    enabled: mounted,
  });

  if (!mounted) {
    return null;
  }

  return element;
});

export interface AvatarImageState extends AvatarRoot.State {
  transitionStatus: TransitionStatus;
}

export interface AvatarImageProps extends BaseUIComponentProps<'img', AvatarImage.State> {
  /**
   * Callback fired when the loading status changes.
   */
  onLoadingStatusChange?: ((status: ImageLoadingStatus) => void) | undefined;
}

export namespace AvatarImage {
  export type State = AvatarImageState;
  export type Props = AvatarImageProps;
}
