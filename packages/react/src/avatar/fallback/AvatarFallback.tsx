'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { BaseUIComponentProps } from '../../utils/types';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useRenderElement } from '../../utils/useRenderElement';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import type { AvatarRoot } from '../root/AvatarRoot';
import { avatarStateAttributesMapping } from '../root/stateAttributesMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';

const stateAttributesMapping: StateAttributesMapping<AvatarFallback.State> = {
  ...avatarStateAttributesMapping,
  ...transitionStatusMapping,
};

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

  const visible = imageLoadingStatus !== 'loaded' && delayPassed;
  const { mounted, transitionStatus, setMounted } = useTransitionStatus(visible);

  const fallbackRef = React.useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    if (delay !== undefined) {
      timeout.start(delay, () => setDelayPassed(true));
    }
    return timeout.clear;
  }, [timeout, delay]);

  const state: AvatarFallback.State = {
    imageLoadingStatus,
    transitionStatus,
  };

  useOpenChangeComplete({
    open: visible,
    ref: fallbackRef,
    onComplete() {
      if (!visible) {
        setMounted(false);
      }
    },
  });

  const element = useRenderElement('span', componentProps, {
    state,
    ref: [forwardedRef, fallbackRef],
    props: elementProps,
    stateAttributesMapping,
    enabled: mounted,
  });

  if (!mounted) {
    return null;
  }

  return element;
});

export interface AvatarFallbackState extends AvatarRoot.State {
  transitionStatus: TransitionStatus;
}

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
