'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import { useToggleRootContext } from '../root/ToggleRootContext';

const stateAttributesMapping: StateAttributesMapping<ToggleIndicatorState> = {
  ...transitionStatusMapping,
};

/**
 * Indicates whether the toggle is pressed.
 * Renders a `<span>` element that is hidden from assistive technology, so label the toggle on
 * `Toggle.Root` with text children or `aria-label`.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 */
export const ToggleIndicator = React.forwardRef(function ToggleIndicator(
  componentProps: ToggleIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { match, render, className, style, ...elementProps } = componentProps;

  const { pressed, disabled } = useToggleRootContext();

  // Without `match`, the indicator always renders and reflects the state through `data-pressed`.
  const rendered = match === undefined || (match === 'on') === pressed;

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(rendered);

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);

  useOpenChangeComplete({
    batch: true,
    enabled: !rendered,
    open: rendered,
    ref: indicatorRef,
    onComplete() {
      if (!rendered) {
        setMounted(false);
      }
    },
  });

  const state: ToggleIndicator.State = { pressed, disabled, transitionStatus };

  // Disabled while unmounted so a render element is never resolved, or suspended on, for an
  // indicator that isn't shown.
  return useRenderElement('span', componentProps, {
    enabled: mounted,
    ref: [forwardedRef, indicatorRef],
    state,
    stateAttributesMapping,
    props: [{ 'aria-hidden': true }, elementProps],
  });
});

export interface ToggleIndicatorState {
  /**
   * Whether the toggle is currently pressed.
   */
  pressed: boolean;
  /**
   * Whether the toggle should ignore user interaction.
   */
  disabled: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface ToggleIndicatorProps extends BaseUIComponentProps<'span', ToggleIndicatorState> {
  /**
   * The state the indicator renders in.
   * Use `'on'` for the icon shown while the toggle is pressed, and `'off'` for the icon shown
   * while it is not.
   * When omitted, the indicator always renders.
   */
  match?: 'on' | 'off' | undefined;
}

export namespace ToggleIndicator {
  export type State = ToggleIndicatorState;
  export type Props = ToggleIndicatorProps;
}
