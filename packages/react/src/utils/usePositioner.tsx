'use client';
import * as React from 'react';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { popupStateMapping } from './popupStateMapping';
import {
  useRenderElement,
  type UseRenderElementComponentProps,
} from '../internals/useRenderElement';
import { getDisabledMountTransitionStyles } from '../internals/getDisabledMountTransitionStyles';
import type { TransitionStatus } from '../internals/useTransitionStatus';

interface UsePositionerOptions {
  styles: React.CSSProperties;
  isPositioned: boolean;
  transitionStatus: TransitionStatus;
  props?: React.ComponentProps<'div'> | undefined;
  refs?: React.Ref<HTMLDivElement> | (React.Ref<HTMLDivElement> | undefined)[] | undefined;
  hidden?: boolean | undefined;
  inert?: boolean | undefined;
}

/**
 * Renders the shared outer Positioner element used by popup components.
 * Applies the common role, hidden state, transition styles, state attributes, and optional inert styling.
 */
export function usePositioner<State extends Record<string, any>>(
  componentProps: UseRenderElementComponentProps<State>,
  state: State,
  {
    styles,
    isPositioned,
    transitionStatus,
    props,
    refs,
    hidden,
    inert = false,
  }: UsePositionerOptions,
) {
  const initialPositioningCompleteRef = React.useRef(false);
  const initialTransitionPropertyRef = React.useRef<string | null>(null);
  const positionerElementRef = React.useRef<HTMLDivElement | null>(null);
  const initialPositioningAnimationFrame = useAnimationFrame();

  const setPositionerElement = React.useCallback((element: HTMLDivElement | null) => {
    positionerElementRef.current = element;

    if (!element || initialPositioningCompleteRef.current) {
      return;
    }

    if (initialTransitionPropertyRef.current === null) {
      initialTransitionPropertyRef.current = element.style.transitionProperty;
    }
    element.style.transitionProperty = 'none';
  }, []);

  // In React 17, the floating element can reach the positioning hook after the one-frame mount
  // transition guard has ended. Keep transitions disabled until the positioned styles have been
  // painted, then restore them without forcing synchronous layout.
  useIsoLayoutEffect(() => {
    if (!isPositioned || initialPositioningCompleteRef.current || !positionerElementRef.current) {
      return undefined;
    }

    initialPositioningAnimationFrame.request(() => {
      initialPositioningAnimationFrame.request(() => {
        const element = positionerElementRef.current;
        if (!element || initialPositioningCompleteRef.current) {
          return;
        }

        initialPositioningCompleteRef.current = true;
        element.style.transitionProperty = initialTransitionPropertyRef.current ?? '';
      });
    });

    return initialPositioningAnimationFrame.cancel;
  }, [initialPositioningAnimationFrame, isPositioned]);

  const style: React.CSSProperties = { ...styles };
  const positionerRefs = Array.isArray(refs)
    ? [...refs, setPositionerElement]
    : [refs, setPositionerElement];

  if (inert) {
    style.pointerEvents = 'none';
  }

  return useRenderElement('div', componentProps, {
    state,
    ref: positionerRefs,
    props: [
      { role: 'presentation', hidden, style },
      getDisabledMountTransitionStyles(transitionStatus),
      props,
    ],
    stateAttributesMapping: popupStateMapping,
  });
}
