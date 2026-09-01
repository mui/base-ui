'use client';
import { inertValue } from '@base-ui/utils/inertValue';
import { popupStateMapping } from './popupStateMapping';
import {
  useRenderElement,
  type UseRenderElementComponentProps,
} from '../internals/useRenderElement';
import { getDisabledMountTransitionStyles } from '../internals/getDisabledMountTransitionStyles';
import type { TransitionStatus } from '../internals/useTransitionStatus';

interface UsePositionerOptions {
  styles: React.CSSProperties;
  transitionStatus: TransitionStatus;
  props?: React.ComponentProps<'div'> | undefined;
  refs?: React.Ref<HTMLDivElement> | (React.Ref<HTMLDivElement> | undefined)[] | undefined;
  hidden?: boolean | undefined;
  /**
   * Suppresses pointer events on the positioner. Not the same thing as `closed`: callers pass this
   * for reasons unrelated to the open state (a cursor-tracking tooltip is pointer-inert while it
   * is open), so it must never be used to drive the `inert` attribute.
   */
  inert?: boolean | undefined;
  /**
   * Whether the popup is logically closed while still mounted for its exit animation. Applies the
   * HTML `inert` attribute, which takes the animating subtree out of sequential focus navigation
   * and the accessibility tree without affecting the animation itself.
   */
  closed?: boolean | undefined;
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
    inert = false,
    closed = false,
  }: UsePositionerOptions,
) {
  const style: React.CSSProperties = { ...styles };

  if (inert) {
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
