'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { BaseUIComponentProps } from '../../internals/types';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useRenderElement } from '../../internals/useRenderElement';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRootState, ImageLoadingStatus } from '../root/AvatarRoot';
import { AvatarFallbackDataAttributes } from './AvatarFallbackDataAttributes';

const LOADING_HOOK = { [AvatarFallbackDataAttributes.loading]: '' };
const LOADED_HOOK = { [AvatarFallbackDataAttributes.loaded]: '' };
const ERROR_HOOK = { [AvatarFallbackDataAttributes.error]: '' };

/**
 * Emit one boolean data attribute per discrete fallback state. The fallback is always mounted
 * — `[data-loading]` / `[data-loaded]` / `[data-error]` describe its current visual role
 * relative to `Avatar.Image`. While the initial `delay` is pending we expose `[data-loaded]`
 * because the fallback should be _hidden_ during that window even if the image is still loading
 * underneath; consumers therefore only need a single CSS rule keyed off `[data-loaded]` (or its
 * inverse) to handle both real loads and the delay grace period.
 */
const fallbackStateAttributesMapping: StateAttributesMapping<AvatarFallbackState> = {
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
};

/**
 * Rendered when the image fails to load or when no image is provided.
 * Renders a `<span>` element.
 *
 * The `<span>` stays mounted across the entire avatar lifecycle — consumers hide it via CSS
 * targeting `[data-loaded]` (image is on screen / delay pending) and show it via `[data-loading]`
 * or `[data-error]`. Keeping it mounted lets consumers run CSS transitions both directions
 * without relying on mount/unmount hooks, and avoids tearing down (and re-creating) custom
 * children on every src swap.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export const AvatarFallback = React.forwardRef(function AvatarFallback(
  componentProps: AvatarFallback.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, delay, style, ...elementProps } = componentProps;

  const { imageLoadingStatus, transientImageLoadingStatusRef } = useAvatarRootContext();
  const [delayPassed, setDelayPassed] = React.useState(delay === undefined);
  const timeout = useTimeout();

  React.useEffect(() => {
    if (delay !== undefined) {
      timeout.start(delay, () => setDelayPassed(true));
    }
    return timeout.clear;
  }, [timeout, delay]);

  /**
   * Prefer the transient ref set by `Avatar.Image` during the current render over the lifted
   * status in context: the lifted state can be one commit behind during fast `src` swaps, and
   * Fallback consulting it would briefly flash visible on top of the previously-decoded bitmap
   * the browser is still painting on the `<img>`. The Root resets the ref to `undefined` at the
   * top of every render, so a missing entry means no Image has reported a status yet this cycle.
   */
  const resolvedImageLoadingStatus =
    transientImageLoadingStatusRef.current !== undefined
      ? transientImageLoadingStatusRef.current
      : imageLoadingStatus;

  /**
   * While the initial `delay` is pending, surface `'loaded'` so the fallback's data attribute
   * resolves to `[data-loaded]` and consumer CSS keeps it hidden — even if the underlying image
   * is still in `'loading'`. This matches the previous mount-gating behaviour (`enabled:
   * status !== 'loaded' && delayPassed`) without forcing consumers to combine multiple data
   * attributes to handle the delay window.
   */
  const displayedStatus: ImageLoadingStatus = delayPassed ? resolvedImageLoadingStatus : 'loaded';

  const state: AvatarFallbackState = {
    imageLoadingStatus: displayedStatus,
  };

  return useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: fallbackStateAttributesMapping,
  });
});

export interface AvatarFallbackState extends AvatarRootState {}

export interface AvatarFallbackProps extends BaseUIComponentProps<'span', AvatarFallbackState> {
  /**
   * How long to wait before showing the fallback. Specified in milliseconds.
   */
  delay?: number | undefined;
}

export namespace AvatarFallback {
  export type State = AvatarFallbackState;
  export type Props = AvatarFallbackProps;
}
