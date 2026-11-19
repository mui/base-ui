'use client';
import * as React from 'react';
import { useRenderElement } from '../internals/useRenderElement';
import type { BaseUIComponentProps } from '../internals/types';
import { useOpenChangeComplete } from '../internals/useOpenChangeComplete';
import { useTransitionStatus } from '../internals/useTransitionStatus';
import type { TransitionStatus } from '../internals/useTransitionStatus';
import type { StateAttributesMapping } from '../internals/getStateAttributesProps';
import { transitionStatusMapping } from '../internals/stateAttributesMapping';
import { useToggleContext } from './ToggleContext';

const stateAttributesMapping: StateAttributesMapping<ToggleIndicatorState> = {
  ...transitionStatusMapping,
};

/**
 * Indicates whether the toggle is pressed.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 */
export const ToggleIndicator = React.forwardRef(function ToggleIndicator(
  componentProps: ToggleIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    match = 'pressed',
    keepMounted = false,
    render,
    className,
    style,
    ...elementProps
  } = componentProps;

  const { pressed, disabled } = useToggleContext();

  const rendered = match === 'pressed' ? pressed : !pressed;

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

  const element = useRenderElement('span', componentProps, {
    ref: [forwardedRef, indicatorRef],
    state,
    stateAttributesMapping,
    props: [{ 'aria-hidden': true }, elementProps],
  });

  if (!keepMounted && !mounted) {
    return null;
  }

  return element;
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
   * Use `'pressed'` for the icon shown while the toggle is pressed, and `'unpressed'` for the
   * icon shown while it is not.
   * @default 'pressed'
   */
  match?: 'pressed' | 'unpressed' | undefined;
  /**
   * Whether to keep the element in the DOM while it doesn't apply.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace ToggleIndicator {
  export type State = ToggleIndicatorState;
  export type Props = ToggleIndicatorProps;
}
