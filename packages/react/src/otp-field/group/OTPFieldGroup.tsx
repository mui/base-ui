'use client';
import * as React from 'react';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import type { OTPFieldRootState } from '../root/OTPFieldRoot';
import { useOTPFieldRootContext } from '../root/OTPFieldRootContext';
import { rootStateAttributesMapping } from '../utils/stateAttributesMapping';

/**
 * Groups the OTP inputs together.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI OTP Field](https://base-ui.com/react/components/otp-field)
 */
export const OTPFieldGroup = React.forwardRef(function OTPFieldGroup(
  componentProps: OTPFieldGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { ariaDescribedBy, ariaLabelledBy, state } = useOTPFieldRootContext();
  const { getDescriptionProps } = useLabelableContext();
  const fieldDescriptionProps = getDescriptionProps({});
  const describedBy = mergeAriaIds(
    fieldDescriptionProps['aria-describedby'],
    ariaDescribedBy,
    elementProps['aria-describedby'],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: [
      {
        role: 'group',
        'aria-describedby': describedBy,
        'aria-labelledby': ariaLabelledBy,
      },
      elementProps,
    ],
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

function mergeAriaIds(...values: Array<string | undefined>) {
  const ids = values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []);
  return ids.length > 0 ? Array.from(new Set(ids)).join(' ') : undefined;
}
