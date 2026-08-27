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

const LOADING_HOOK = { 'data-loading': '' };
const ERROR_HOOK = { 'data-error': '' };

const stateAttributesMapping: StateAttributesMapping<AvatarImageState> = {
  ...avatarStateAttributesMapping,
  ...transitionStatusMapping,
  imageLoadingStatus(value): Record<string, string> | null {
    if (value === 'loading') {
      return LOADING_HOOK;
    }
    if (value === 'error') {
      return ERROR_HOOK;
    }
    return null;
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
    onLoadingStatusChange: onLoadingStatusChangeProp,
    keepMounted = false,
    style,
    ...elementProps
  } = componentProps;

  const { setImageLoadingStatus: setRootImageLoadingStatus } = useAvatarRootContext();
  const [imageLoadingStatus, setImageLoadingStatus] = useImageLoadingStatus(
    elementProps.src,
    elementProps,
    !keepMounted,
  );

  const isVisible = imageLoadingStatus === 'loaded';
  const { mounted, transitionStatus, setMounted } = useTransitionStatus(isVisible);

  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const initialCommitRef = React.useRef(true);

  // With `keepMounted`, the status comes from the rendered element itself, whose `load` event may
  // have already fired (cached images, or loads completed before hydration).
  useIsoLayoutEffect(() => {
    if (!keepMounted) {
      return;
    }

    const isInitialCommit = initialCommitRef.current;
    initialCommitRef.current = false;

    const image = imageRef.current;
    if (!image) {
      // The `render` element didn't forward the ref. Its own `load`/`error` events remain the
      // only source of truth, so don't overwrite the status they already reported.
      return;
    }

    if (!image.complete) {
      setImageLoadingStatus('loading');
      return;
    }

    const status = image.naturalWidth > 0 ? 'loaded' : 'error';
    setImageLoadingStatus(status);

    // An image that's already complete on the first commit was painted before hydration, so
    // mount it without going through `'starting'` to avoid replaying the enter animation.
    if (status === 'loaded' && isInitialCommit) {
      setMounted(true);
    }
  }, [
    keepMounted,
    elementProps.src,
    elementProps.srcSet,
    elementProps.sizes,
    elementProps.crossOrigin,
    elementProps.referrerPolicy,
    render,
    setImageLoadingStatus,
    setMounted,
  ]);

  const renderedStatusProps = keepMounted
    ? {
        // Until the image is displayable, the fallback owns the accessible name; without this
        // both would be exposed to assistive technology at once (including in server HTML).
        'aria-hidden': imageLoadingStatus !== 'loaded' || undefined,
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
    enabled: !isVisible,
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
    // The element never unmounts with `keepMounted`, so an exit transition would play and then
    // reverse itself once the status is cleared. `data-loading`/`data-error` cover that state.
    transitionStatus: keepMounted && transitionStatus === 'ending' ? undefined : transitionStatus,
  };

  const shouldRender = keepMounted || mounted;

  const element = useRenderElement('img', componentProps, {
    state,
    ref: [forwardedRef, imageRef],
    props: renderedStatusProps ? [renderedStatusProps, elementProps] : elementProps,
    stateAttributesMapping,
    enabled: shouldRender,
  });

  if (!shouldRender) {
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
   * Whether the image element stays mounted and loads in place instead of being preloaded.
   * Supports `loading="lazy"` and optimized image components such as `next/image`.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace AvatarImage {
  export type State = AvatarImageState;
  export type Props = AvatarImageProps;
}
