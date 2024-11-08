'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps.js';
import { useAnimatedElement } from '../../utils/useAnimatedElement.js';
import { useForkRef } from '../../utils/useForkRef.js';
import { type TransitionStatus } from '../../utils/useTransitionStatus.js';

export function useDialogBackdrop(
  params: useDialogBackdrop.Parameters,
): useDialogBackdrop.ReturnValue {
  const { animated, open, ref } = params;

  const backdropRef = React.useRef<HTMLElement | null>(null);
  const handleRef = useForkRef(ref, backdropRef);

  const { mounted, transitionStatus } = useAnimatedElement({
    open,
    ref: backdropRef,
    enabled: animated,
  });

  const getRootProps = React.useCallback(
    (externalProps: React.ComponentPropsWithRef<any>) =>
      mergeReactProps(externalProps, {
        role: 'presentation',
        ref: handleRef,
      }),
    [handleRef],
  );

  return {
    getRootProps,
    mounted,
    transitionStatus,
  };
}

export namespace useDialogBackdrop {
  export interface Parameters {
    /**
     * If `true`, the dialog supports CSS-based animations and transitions.
     * It is kept in the DOM until the animation completes.
     */
    animated: boolean;
    /**
     * Determines if the dialog is open.
     */
    open: boolean;
    /**
     * The ref to the background element.
     */
    ref: React.Ref<HTMLElement>;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root element props.
     */
    getRootProps: (externalProps?: Record<string, any>) => Record<string, any>;
    /**
     * Determines if the dialog should be mounted even if closed (as the exit animation is still in progress).
     */
    mounted: boolean;
    /**
     * The current transition status of the dialog.
     */
    transitionStatus: TransitionStatus;
  }
}
