'use client';
import * as React from 'react';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { popupStateMapping } from '../popupStateMapping';
import { useRenderElement } from '../../../internals/useRenderElement';
import type { UseRenderElementComponentProps } from '../../../internals/useRenderElement';
import { getDisabledMountTransitionStyles } from '../../../internals/getDisabledMountTransitionStyles';
import type { TransitionStatus } from '../../../internals/useTransitionStatus';
import { resolveStyle } from '../../resolveStyle';

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
  const [initialPositioningComplete, setInitialPositioningComplete] = React.useState(false);
  const initialPositioningAnimationFrame = useAnimationFrame();

  useIsoLayoutEffect(() => {
    if (!isPositioned) {
      setInitialPositioningComplete(false);
      return undefined;
    }

    initialPositioningAnimationFrame.request(() => {
      initialPositioningAnimationFrame.request(() => {
        setInitialPositioningComplete(true);
      });
    });

    return initialPositioningAnimationFrame.cancel;
  }, [initialPositioningAnimationFrame, isPositioned]);

  const style: React.CSSProperties = { ...styles };
  const disabledTransitionStyles = getDisabledMountTransitionStyles(
    initialPositioningComplete ? transitionStatus : 'starting',
  );

  if (inert) {
    style.pointerEvents = 'none';
  }

  return useRenderElement(
    'div',
    {
      ...componentProps,
      style: (renderState) => ({
        ...resolveStyle(componentProps.style, renderState),
        ...disabledTransitionStyles.style,
      }),
    },
    {
      state,
      ref: refs,
      props: [{ role: 'presentation', hidden, style }, props],
      stateAttributesMapping: popupStateMapping,
    },
  );
}
