'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRoot } from '../root/AvatarRoot';
import { avatarStateAttributesMapping } from '../root/stateAttributesMapping';

/**
 * Rendered when the image fails to load or when no image is provided.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export const AvatarFallback = React.forwardRef(function AvatarFallback(
  componentProps: AvatarFallback.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, delay, ...elementProps } = componentProps;

  const { imageLoadingStatus } = useAvatarRootContext();
  const [delayPassed, setDelayPassed] = React.useState(delay === undefined);
  const timeout = useTimeout();

  React.useEffect(() => {
    if (delay !== undefined) {
      timeout.start(delay, () => setDelayPassed(true));
    }
    return timeout.clear;
  }, [timeout, delay]);

  const state: AvatarFallbackState = {
    imageLoadingStatus,
  };

  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: avatarStateAttributesMapping,
    enabled: imageLoadingStatus !== 'loaded' && delayPassed,
  });

  return element;
});

export interface AvatarFallbackState extends AvatarRoot.State {}

export interface AvatarFallbackProps extends BaseUIComponentProps<'span', AvatarFallback.State> {
  /**
   * How long to wait before showing the fallback. Specified in milliseconds.
   */
  delay?: number | undefined;
}

export namespace AvatarFallback {
  export type State = AvatarFallbackState;
  export type Props = AvatarFallbackProps;
}
