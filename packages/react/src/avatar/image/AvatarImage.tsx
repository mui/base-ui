'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { makeEventPreventable } from '../../merge-props';
import type { BaseUIEvent } from '../../types';
import { BaseUIComponentProps } from '../../internals/types';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useRenderElement } from '../../internals/useRenderElement';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRootState } from '../root/AvatarRoot';
import { avatarStateAttributesMapping } from '../root/stateAttributesMapping';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import { type TransitionStatus, useTransitionStatus } from '../../internals/useTransitionStatus';
import { useImageLoadingStatus, ImageLoadingStatus } from './useImageLoadingStatus';

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
    style,
    onLoad: onLoadProp,
    onError: onErrorProp,
    ...elementProps
  } = componentProps;

  void className;
  void render;

  const context = useAvatarRootContext();
  const hookLoadingStatus = useImageLoadingStatus(componentProps.src);

  const [intrinsicDecodeFailed, setIntrinsicDecodeFailed] = React.useState(false);

  const [intrinsicSettled, setIntrinsicSettled] = React.useState(() => !componentProps.src);

  useIsoLayoutEffect(() => {
    setIntrinsicDecodeFailed(false);
    setIntrinsicSettled(!componentProps.src);
  }, [componentProps.src]);

  const imageLoadingStatus: ImageLoadingStatus = intrinsicDecodeFailed ? 'error' : hookLoadingStatus;

  context.transientImageLoadingStatusRef.current = imageLoadingStatus;

  const handleIntrinsicLoad = useStableCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const baseUiEvent = makeEventPreventable(
      event as BaseUIEvent<React.SyntheticEvent<HTMLImageElement>>,
    );
    onLoadProp?.(baseUiEvent);
    setIntrinsicSettled(true);
  });

  const handleIntrinsicError = useStableCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const baseUiEvent = makeEventPreventable(
      event as BaseUIEvent<React.SyntheticEvent<HTMLImageElement>>,
    );
    onErrorProp?.(baseUiEvent);
    setIntrinsicSettled(true);
    setIntrinsicDecodeFailed(true);
  });

  const isVisible = imageLoadingStatus === 'loaded';
  const { mounted, transitionStatus, setMounted } = useTransitionStatus(isVisible);

  const imageRef = React.useRef<HTMLImageElement | null>(null);

  /**
   * Disk/memory-cached imgs often expose `complete` + `naturalWidth` before `load` bubbles; unveil before paint.
   * On rejection, `decode()` must NOT settle — a failing/decode-rejected bitmap must wait for `@error`
   * before unveiling so the browser’s broken-image glyph never paints visibly for one frame.
   */
  useIsoLayoutEffect(() => {
    if (!mounted || intrinsicSettled || intrinsicDecodeFailed) {
      return;
    }
    const img = imageRef.current;
    if (!(img?.complete && img.naturalWidth > 0)) {
      return;
    }
    const finalize = () => {
      setIntrinsicSettled(true);
    };
    if (typeof img.decode === 'function') {
      void img.decode().then(finalize);
      return;
    }
    finalize();
  }, [mounted, intrinsicSettled, intrinsicDecodeFailed, componentProps.src]);

  const concealIntrinsically =
    !!componentProps.src &&
    (!intrinsicSettled || Boolean(intrinsicDecodeFailed && mounted));

  let mergedStyle: React.CSSProperties | undefined;
  if (componentProps.src) {
    const lockBase: React.CSSProperties = { transition: 'none' };
    if (concealIntrinsically) {
      mergedStyle =
        style && typeof style === 'object' && !Array.isArray(style)
          ? {
              ...lockBase,
              ...(style as React.CSSProperties),
              opacity: 0,
              visibility: 'hidden',
            }
          : { ...lockBase, opacity: 0, visibility: 'hidden' };
    } else {
      mergedStyle =
        style && typeof style === 'object' && !Array.isArray(style)
          ? {
              ...lockBase,
              ...(style as React.CSSProperties),
            }
          : lockBase;
    }
  } else {
    mergedStyle = style as React.CSSProperties | undefined;
  }

  const handleLoadingStatusChange = useStableCallback((status: ImageLoadingStatus) => {
    onLoadingStatusChangeProp?.(status);
    context.setImageLoadingStatus(status);
  });

  useIsoLayoutEffect(() => {
    if (imageLoadingStatus !== 'idle') {
      handleLoadingStatusChange(imageLoadingStatus);
    }
  }, [imageLoadingStatus, handleLoadingStatusChange]);

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
    props: {
      ...elementProps,
      style: mergedStyle,
      onLoad: handleIntrinsicLoad,
      onError: handleIntrinsicError,
    },
    stateAttributesMapping,
    enabled: mounted,
  });

  if (!mounted) {
    return null;
  }

  return element;
});

export interface AvatarImageState extends AvatarRootState {
  /**
   * The transition status of the component (`[data-starting-style]` / `[data-ending-style]`).
   */
  transitionStatus: TransitionStatus;
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
