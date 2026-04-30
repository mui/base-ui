'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { makeEventPreventable } from '../../merge-props';
import type { BaseUIEvent } from '../../types';
import { BaseUIComponentProps } from '../../internals/types';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useRenderElement } from '../../internals/useRenderElement';
import { useIsHydrating } from '../../utils/useIsHydrating';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRootState, ImageLoadingStatus } from '../root/AvatarRoot';
import { AvatarImageDataAttributes } from './AvatarImageDataAttributes';

function toBaseUiImgEvent(event: React.SyntheticEvent<HTMLImageElement>) {
  return makeEventPreventable(event as BaseUIEvent<React.SyntheticEvent<HTMLImageElement>>);
}

function resolveInitialStatus(src: string | undefined, isHydrating: boolean): ImageLoadingStatus {
  if (!src) {
    return 'error';
  }

  // Server output (and hydration's first client render) must stay deterministic.
  if (typeof window === 'undefined' || isHydrating) {
    return 'loading';
  }

  // Fast-path SPA cache hits so they don't run through a loading commit.
  const probe = new window.Image();
  probe.src = src;
  return probe.complete && probe.naturalWidth > 0 ? 'loaded' : 'loading';
}

const LOADING_HOOK = { [AvatarImageDataAttributes.loading]: '' };
const LOADED_HOOK = { [AvatarImageDataAttributes.loaded]: '' };
const ERROR_HOOK = { [AvatarImageDataAttributes.error]: '' };
const HYDRATED_HOOK = { [AvatarImageDataAttributes.hydrated]: '' };

const stateAttributesMapping: StateAttributesMapping<AvatarImageState> = {
  imageLoadingStatus(value): Record<string, string> | null {
    if (value === 'loading') {
      return LOADING_HOOK;
    }
    if (value === 'loaded') {
      return LOADED_HOOK;
    }
    if (value === 'error') {
      return ERROR_HOOK;
    }
    return null;
  },
  hydrated(value): Record<string, string> | null {
    return value ? HYDRATED_HOOK : null;
  },
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
    style,
    alt: altProp,
    onLoadingStatusChange: onLoadingStatusChangeProp,
    hidden: hiddenProp,
    onLoad: onLoadProp,
    onError: onErrorProp,
    ...elementProps
  } = componentProps;
  void className;
  void render;
  void style;

  const {
    setImageLoadingStatus: setLiftedImageLoadingStatus,
  } = useAvatarRootContext();
  const isHydrating = useIsHydrating();
  const hydrated = !isHydrating;

  const [imageLoadingStatus, setImageLoadingStatus] = React.useState<ImageLoadingStatus>(() =>
    resolveInitialStatus(componentProps.src, isHydrating),
  );

  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const previousSrcRef = React.useRef(componentProps.src);
  const statusRef = React.useRef(imageLoadingStatus);
  const lastFiredStatusRef = React.useRef<ImageLoadingStatus | undefined>(undefined);
  statusRef.current = imageLoadingStatus;

  const handleIntrinsicLoad = useStableCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    onLoadProp?.(toBaseUiImgEvent(event));
    setImageLoadingStatus('loaded');
  });

  const handleIntrinsicError = useStableCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    onErrorProp?.(toBaseUiImgEvent(event));
    setImageLoadingStatus('error');
  });

  // Reset status on src changes.
  useIsoLayoutEffect(() => {
    const previousSrc = previousSrcRef.current;
    if (previousSrc === componentProps.src) {
      return;
    }

    previousSrcRef.current = componentProps.src;

    if (!componentProps.src) {
      setImageLoadingStatus('error');
      return;
    }

    // Keep status at loaded for src->src swaps while browsers paint stale bitmap.
    const isSrcSwap = Boolean(previousSrc) && Boolean(componentProps.src);
    if (isSrcSwap && statusRef.current === 'loaded') {
      return;
    }

    setImageLoadingStatus('loading');
  }, [componentProps.src]);

  // Resolve already-settled outcomes (cached success, pre-hydration error) after mount.
  useIsoLayoutEffect(() => {
    if (imageLoadingStatus !== 'loading') {
      return;
    }

    const img = imageRef.current;
    if (!img?.complete) {
      return;
    }

    setImageLoadingStatus(img.naturalWidth > 0 ? 'loaded' : 'error');
  }, [imageLoadingStatus, componentProps.src]);

  const handleLoadingStatusChange = useStableCallback((status: ImageLoadingStatus) => {
    onLoadingStatusChangeProp?.(status);
  });

  // Single synchronization pipeline: local status -> lifted status + callback.
  useIsoLayoutEffect(() => {
    setLiftedImageLoadingStatus(imageLoadingStatus);

    if (lastFiredStatusRef.current === imageLoadingStatus) {
      return;
    }

    lastFiredStatusRef.current = imageLoadingStatus;
    handleLoadingStatusChange(imageLoadingStatus);
  }, [imageLoadingStatus, handleLoadingStatusChange, setLiftedImageLoadingStatus]);

  const state: AvatarImageState = {
    imageLoadingStatus,
    hydrated,
  };

  const imageElement = useRenderElement('img', componentProps, {
    state,
    ref: [forwardedRef, imageRef],
    props: {
      ...elementProps,
      // To remove the browser styling (border) on an image with empty src, the alt can never be empty.
      alt: altProp ?? ' ',
      hidden: hiddenProp,
      onLoad: handleIntrinsicLoad,
      onError: handleIntrinsicError,
    },
    stateAttributesMapping,
  });

  return imageElement;
});

export interface AvatarImageState extends AvatarRootState {
  /**
   * Whether the component has hydrated on the client.
   */
  hydrated: boolean;
}

export interface AvatarImageProps extends BaseUIComponentProps<'img', AvatarImageState> {
  /**
   * Callback fired when the loading status changes.
   */
  onLoadingStatusChange?: ((status: ImageLoadingStatus) => void) | undefined;
}

export namespace AvatarImage {
  export type State = AvatarImageState;
  export type Props = AvatarImageProps;
}
