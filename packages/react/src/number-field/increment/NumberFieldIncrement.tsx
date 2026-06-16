'use client';
import * as React from 'react';
import type { NativeButtonComponentProps } from '../../internals/types';
import { useNumberFieldStepperButton } from '../root/useNumberFieldStepperButton';
import type { NumberFieldRootState } from '../root/NumberFieldRoot';

/**
 * A stepper button that increases the field value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldIncrement = React.forwardRef(function NumberFieldIncrement(
  componentProps: NumberFieldIncrement.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  return useNumberFieldStepperButton(componentProps, forwardedRef, true);
}) as unknown as NumberFieldIncrementComponent;

export interface NumberFieldIncrementState extends NumberFieldRootState {}

export type NumberFieldIncrementProps<TNativeButton extends boolean = true> =
  NativeButtonComponentProps<TNativeButton, NumberFieldIncrement.State>;

export namespace NumberFieldIncrement {
  export type State = NumberFieldIncrementState;
  export type Props<TNativeButton extends boolean = true> =
    NumberFieldIncrementProps<TNativeButton>;
}

type NumberFieldIncrementComponent = {
  (
    props: NumberFieldIncrement.Props<true> & {
      ref?: React.Ref<HTMLButtonElement> | undefined;
    },
  ): React.ReactElement | null;
  (
    props: NumberFieldIncrement.Props<false> & { nativeButton: false } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
  (
    props: NumberFieldIncrement.Props<boolean> & { nativeButton: boolean } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
};
