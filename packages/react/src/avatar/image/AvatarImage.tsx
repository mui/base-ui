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
import type { AvatarRootState, ImageLoadingStatus } from '../root/AvatarRoot';
import { avatarStateAttributesMapping } from '../root/stateAttributesMapping';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import { type TransitionStatus, useTransitionStatus } from '../../internals/useTransitionStatus';

function toBaseUiImgEvent(event: React.SyntheticEvent<HTMLImageElement>) {
  return makeEventPreventable(event as BaseUIEvent<React.SyntheticEvent<HTMLImageElement>>);
}

function resolveImageLoadingStatus(
  src: string | undefined,
  intrinsicDecodeFailed: boolean,
  intrinsicSettled: boolean,
): ImageLoadingStatus {
  if (!src || intrinsicDecodeFailed) {
    return 'error';
  }
  if (!intrinsicSettled) {
    return 'loading';
  }
  return 'loaded';
}

const stateAttributesMapping: StateAttributesMapping<AvatarImageState> = {
  ...avatarStateAttributesMapping,
  ...transitionStatusMapping,
  intrinsicDecodePending() {
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
    style,
    hidden: hiddenProp,
    onLoad: onLoadProp,
    onError: onErrorProp,
    ...elementProps
  } = componentProps;

  void className;
  void render;
  void style;

  const context = useAvatarRootContext();

  const [intrinsicDecodeFailed, setIntrinsicDecodeFailed] = React.useState(false);

  const [intrinsicSettled, setIntrinsicSettled] = React.useState(() => !componentProps.src);

  useIsoLayoutEffect(() => {
    setIntrinsicDecodeFailed(false);
    setIntrinsicSettled(!componentProps.src);
  }, [componentProps.src]);

  /**
   * Mirrors intrinsic load/decode — not optimistic `loaded` on `src` alone — so `Avatar.Fallback`
   * can show during slow networks (`loading`) like the preload-based implementation did.
   */
  const imageLoadingStatus = resolveImageLoadingStatus(
    componentProps.src,
    intrinsicDecodeFailed,
    intrinsicSettled,
  );

  context.transientImageLoadingStatusRef.current = imageLoadingStatus;

  const handleIntrinsicLoad = useStableCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    onLoadProp?.(toBaseUiImgEvent(event));
    setIntrinsicSettled(true);
  });

  const handleIntrinsicError = useStableCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    onErrorProp?.(toBaseUiImgEvent(event));
    setIntrinsicSettled(true);
    setIntrinsicDecodeFailed(true);
  });

  /** Keep `<img>` mounted while `src` is present and we have not errored — independent of `'loaded'` vs `'loading'`. */
  const slotActive = Boolean(componentProps.src) && imageLoadingStatus !== 'error';
  const { mounted, transitionStatus, setMounted } = useTransitionStatus(slotActive);

  const imageRef = React.useRef<HTMLImageElement | null>(null);

  /**
   * Disk/memory-cached imgs often expose `complete` + `naturalWidth` before `load` bubbles; unveil before paint.
   * Must settle synchronously in this layout effect — `decode()` resolves in a microtask and runs **after**
   * the first paint, which keeps `<img hidden>` for one visible frame.
   */
  useIsoLayoutEffect(() => {
    if (!mounted || intrinsicSettled || intrinsicDecodeFailed) {
      return;
    }
    const img = imageRef.current;
    if (!(img?.complete && img.naturalWidth > 0)) {
      return;
    }
    setIntrinsicSettled(true);
  }, [mounted, intrinsicSettled, intrinsicDecodeFailed, componentProps.src]);

  /**
   * `<img hidden>` until status is `'loaded'`. Tying this to `mounted` previously let `hidden`
   * clear briefly on error while `useTransitionStatus` unwound — the native broken-image glyph
   * could flash for one frame before unmount.
   */
  const intrinsicDecodePending = imageLoadingStatus !== 'loaded';

  const handleLoadingStatusChange = useStableCallback((status: ImageLoadingStatus) => {
    onLoadingStatusChangeProp?.(status);
    context.setImageLoadingStatus(status);
  });

  useIsoLayoutEffect(() => {
    handleLoadingStatusChange(imageLoadingStatus);
  }, [imageLoadingStatus, handleLoadingStatusChange]);

  useOpenChangeComplete({
    open: slotActive,
    ref: imageRef,
    onComplete() {
      if (!slotActive) {
        setMounted(false);
      }
    },
  });

  const state: AvatarImageState = {
    imageLoadingStatus,
    transitionStatus,
    intrinsicDecodePending,
  };

  const element = useRenderElement('img', componentProps, {
    state,
    ref: [forwardedRef, imageRef],
    props: {
      ...elementProps,
      hidden: intrinsicDecodePending ? true : hiddenProp,
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
  /**
   * True until `imageLoadingStatus === 'loaded'` (successful bitmap); keeps `<img hidden>` on loading and error.
   */
  intrinsicDecodePending: boolean;
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
