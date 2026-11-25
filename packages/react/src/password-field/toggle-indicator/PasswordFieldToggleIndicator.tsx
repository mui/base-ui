'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import { usePasswordFieldRootContext } from '../root/PasswordFieldRootContext';

const stateAttributesMapping: StateAttributesMapping<PasswordFieldToggleIndicatorState> = {
  ...transitionStatusMapping,
};

/**
 * Indicates whether the password is revealed or hidden.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Password Field](https://base-ui.com/react/components/password-field)
 */
export const PasswordFieldToggleIndicator = React.forwardRef(function PasswordFieldToggleIndicator(
  componentProps: PasswordFieldToggleIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { match, render, className, style, ...elementProps } = componentProps;

  const { visible, disabled } = usePasswordFieldRootContext();

  // Without `match`, the indicator always renders and reflects the state through `data-visible`.
  const rendered = match === undefined || (match === 'on') === visible;

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

  const state: PasswordFieldToggleIndicator.State = { visible, disabled, transitionStatus };

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

export interface PasswordFieldToggleIndicatorState {
  /**
   * Whether the password is currently revealed as plain text.
   */
  visible: boolean;
  /**
   * Whether the field should ignore user interaction.
   */
  disabled: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface PasswordFieldToggleIndicatorProps extends BaseUIComponentProps<
  'span',
  PasswordFieldToggleIndicatorState
> {
  /**
   * The password state the indicator renders in.
   * Use `'on'` for the icon shown while the password is visible (the toggle is pressed), and
   * `'off'` for the icon shown while it is masked.
   * When omitted, the indicator always renders.
   */
  match?: 'on' | 'off' | undefined;
}

export namespace PasswordFieldToggleIndicator {
  export type State = PasswordFieldToggleIndicatorState;
  export type Props = PasswordFieldToggleIndicatorProps;
}
