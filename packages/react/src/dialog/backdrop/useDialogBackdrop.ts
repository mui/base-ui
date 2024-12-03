'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnimatedElement } from '../../utils/useAnimatedElement';
import { useForkRef } from '../../utils/useForkRef';
import { type TransitionStatus } from '../../utils/useTransitionStatus';

export function useDialogBackdrop(
  params: useDialogBackdrop.Parameters,
): useDialogBackdrop.ReturnValue {
  const { open, ref } = params;

  const backdropRef = React.useRef<HTMLElement | null>(null);
  const handleRef = useForkRef(ref, backdropRef);

  const { mounted, transitionStatus } = useAnimatedElement({
    open,
    ref: backdropRef,
    enabled: true,
  });

  const getRootProps = React.useCallback(
    (externalProps: React.ComponentPropsWithRef<any>) =>
      mergeReactProps<'div'>(externalProps, {
        role: 'presentation',
        ref: handleRef,
        hidden: !mounted,
      }),
    [handleRef, mounted],
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
