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
   * Takes the subtree out of the accessibility tree, sequential focus navigation, and hit testing.
   * Only use this when the component has an explicit focus handoff for the close boundary.
   */
  inert?: boolean | undefined;
  /**
   * Blocks hit testing without changing accessibility or focus behavior.
   */
  pointerEventsNone?: boolean | undefined;
}

/**
 * Renders the shared outer Positioner element used by popup components.
 * Applies the common role, hidden state, transition styles, state attributes, and interactivity.
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
    pointerEventsNone = false,
  }: UsePositionerOptions,
) {
  const style: React.CSSProperties = { ...styles };

  // Native `inert` blocks hit testing on its own. The explicit style also covers environments
  // without native support and callers that only need to disable hit testing.
  if (inert || pointerEventsNone) {
    style.pointerEvents = 'none';
  }

  return useRenderElement('div', componentProps, {
    state,
    ref: refs,
    props: [
      { role: 'presentation', hidden, style, inert: inertValue(inert) },
      getDisabledMountTransitionStyles(transitionStatus),
      props,
    ],
    stateAttributesMapping: popupStateMapping,
  });
}
