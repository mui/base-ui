'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import type { OTPFieldRootState } from '../root/OTPFieldRoot';
import { useOTPFieldRootContext } from '../root/OTPFieldRootContext';
import { rootStateAttributesMapping } from '../utils/stateAttributesMapping';

/**
 * Groups OTP inputs together for layout.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI OTP Field](https://base-ui.com/react/components/otp-field)
 */
export const OTPFieldGroup = React.forwardRef(function OTPFieldGroup(
  componentProps: OTPFieldGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;
  const { state } = useOTPFieldRootContext();

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: [elementProps],
    stateAttributesMapping: rootStateAttributesMapping,
  });

  return element;
});

export interface OTPFieldGroupState extends OTPFieldRootState {}

export interface OTPFieldGroupProps extends BaseUIComponentProps<'div', OTPFieldGroupState> {}

export namespace OTPFieldGroup {
  export type State = OTPFieldGroupState;
  export type Props = OTPFieldGroupProps;
}
