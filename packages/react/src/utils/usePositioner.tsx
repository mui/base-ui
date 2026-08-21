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
   * Set whenever the popup is logically closed but still mounted — during an exit animation, and
   * for a `keepMounted` popup that has never been opened — so it can't be reached by assistive
   * tech or the Tab key. Only safe where something hands focus back on close; see the callers that
   * deliberately opt out.
   */
  inert?: boolean | undefined;
}

/**
 * Renders the shared outer Positioner element used by popup components.
 * Applies the common role, hidden state, transition styles, state attributes, and interactivity.
 */
export function usePositioner<State extends Record<string, any>>(
  componentProps: UseRenderElementComponentProps<State>,
  state: State,
  { styles, transitionStatus, props, refs, hidden, inert = false }: UsePositionerOptions,
) {
  const style: React.CSSProperties = { ...styles };

  // `inert` blocks hit testing on its own; the explicit style keeps that true where `inert` isn't
  // implemented (jsdom).
  if (inert) {
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
