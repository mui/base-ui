'use client';
import { inertValue } from '@base-ui/utils/inertValue';
import { popupStateMapping } from './popupStateMapping';
import { useRenderElement } from '../internals/useRenderElement';
import type { UseRenderElementComponentProps } from '../internals/useRenderElement';
import { getDisabledMountTransitionStyles } from '../internals/getDisabledMountTransitionStyles';
import type { TransitionStatus } from '../internals/useTransitionStatus';

interface UsePositionerOptions {
  styles: React.CSSProperties;
  transitionStatus: TransitionStatus;
  props?: React.ComponentProps<'div'> | undefined;
  refs?: React.Ref<HTMLDivElement> | (React.Ref<HTMLDivElement> | undefined)[] | undefined;
  hidden?: boolean | undefined;
  /**
   * Whether the popup is logically closed (still mounted for its exit animation).
   * Applies HTML `inert` and disables pointer events.
   */
  closed?: boolean | undefined;
  /**
   * Disables pointer events only.
   */
  disablePointerEvents?: boolean | undefined;
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
    transitionStatus,
    props,
    refs,
    hidden,
    closed = false,
    disablePointerEvents = false,
  }: UsePositionerOptions,
) {
  const style: React.CSSProperties = { ...styles };

  if (closed || disablePointerEvents) {
    style.pointerEvents = 'none';
  }

  return useRenderElement('div', componentProps, {
    state,
    ref: refs,
    props: [
      { role: 'presentation', hidden, style, inert: inertValue(closed) },
      getDisabledMountTransitionStyles(transitionStatus),
      props,
    ],
    stateAttributesMapping: popupStateMapping,
  });
}
