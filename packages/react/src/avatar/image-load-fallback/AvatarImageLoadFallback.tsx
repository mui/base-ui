'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../internals/types';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useRenderElement } from '../../internals/useRenderElement';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRootState } from '../root/AvatarRoot';

const VISIBLE_HOOK = { 'data-visible': '' };
const HIDDEN_HOOK = { 'data-hidden': '' };
const HAS_SRC_HOOK = { 'data-has-src': '' };
const NO_SRC_HOOK = { 'data-no-src': '' };

const IMAGE_LOAD_FALLBACK_BASE_STYLE = {
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  inset: 0,
  pointerEvents: 'none',
  position: 'absolute',
} as const;

function toCssUrlValue(url: string): string {
  return `url("${url.replace(/["\\\n\r\f]/g, '\\$&')}")`;
}

const stateAttributesMapping: StateAttributesMapping<AvatarImageLoadFallbackState> = {
  visible(value): Record<string, string> | null {
    return value ? VISIBLE_HOOK : HIDDEN_HOOK;
  },
  hasSrc(value): Record<string, string> | null {
    return value ? HAS_SRC_HOOK : NO_SRC_HOOK;
  },
};

/**
 * A customizable image fallback surface that is shown while `Avatar.Image` loads.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export const AvatarImageLoadFallback = React.forwardRef(function AvatarImageLoadFallback(
  componentProps: AvatarImageLoadFallback.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, style, src, loading, ...elementProps } = componentProps;
  void className;
  void render;
  void style;

  const { imageLoadingStatus } = useAvatarRootContext();
  const hasSrc = Boolean(src);
  const visible =
    hasSrc &&
    loading !== 'lazy' &&
    (imageLoadingStatus === 'idle' || imageLoadingStatus === 'loading');

  const state: AvatarImageLoadFallbackState = {
    imageLoadingStatus,
    hasSrc,
    visible,
  };

  return useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: {
      ...elementProps,
      'aria-hidden': true,
      style: {
        ...IMAGE_LOAD_FALLBACK_BASE_STYLE,
        backgroundImage: src ? toCssUrlValue(src) : undefined,
        display: visible ? 'block' : 'none',
      },
    },
    stateAttributesMapping,
  });
});

export interface AvatarImageLoadFallbackState extends AvatarRootState {
  /**
   * Whether the fallback currently has an image source.
   */
  hasSrc: boolean;
  /**
   * Whether the fallback should be visible.
   */
  visible: boolean;
}

export interface AvatarImageLoadFallbackProps
  extends BaseUIComponentProps<'span', AvatarImageLoadFallbackState> {
  /**
   * The image URL to mirror as the fallback background.
   */
  src?: string | undefined;
  /**
   * Matches the `loading` semantics of `Avatar.Image`.
   * When set to `'lazy'`, the fallback is kept hidden.
   */
  loading?: React.ImgHTMLAttributes<HTMLImageElement>['loading'] | undefined;
}

export namespace AvatarImageLoadFallback {
  export type State = AvatarImageLoadFallbackState;
  export type Props = AvatarImageLoadFallbackProps;
}
