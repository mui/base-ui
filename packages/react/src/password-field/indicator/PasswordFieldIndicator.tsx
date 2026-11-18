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

const stateAttributesMapping: StateAttributesMapping<PasswordFieldIndicatorState> = {
  ...transitionStatusMapping,
};

/**
 * Indicates whether the password is revealed or hidden.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Password Field](https://base-ui.com/react/components/password-field)
 */
export const PasswordFieldIndicator = React.forwardRef(function PasswordFieldIndicator(
  componentProps: PasswordFieldIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    match = 'visible',
    keepMounted = false,
    render,
    className,
    style,
    ...elementProps
  } = componentProps;

  const { visible, disabled } = usePasswordFieldRootContext();

  const rendered = match === 'visible' ? visible : !visible;

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

  const state: PasswordFieldIndicator.State = { visible, disabled, transitionStatus };

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

export interface PasswordFieldIndicatorState {
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

export interface PasswordFieldIndicatorProps extends BaseUIComponentProps<
  'span',
  PasswordFieldIndicatorState
> {
  /**
   * The visibility the indicator renders for.
   * Use `'visible'` for the icon shown while the password is revealed, and `'hidden'` for the
   * icon shown while it is masked.
   * @default 'visible'
   */
  match?: 'visible' | 'hidden' | undefined;
  /**
   * Whether to keep the element in the DOM while it doesn't apply.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace PasswordFieldIndicator {
  export type State = PasswordFieldIndicatorState;
  export type Props = PasswordFieldIndicatorProps;
}
