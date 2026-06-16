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

export type NumberFieldIncrementProps<
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
> = NativeButtonComponentProps<TNativeButton, TElement, NumberFieldIncrement.State>;

export namespace NumberFieldIncrement {
  export type State = NumberFieldIncrementState;
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = NumberFieldIncrementProps<TNativeButton, TElement>;
}

type NumberFieldIncrementComponent = {
  <TElement extends React.ElementType = 'button'>(
    props: NumberFieldIncrement.Props<true, TElement> & {
      ref?: React.Ref<HTMLButtonElement> | undefined;
    },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: NumberFieldIncrement.Props<false, TElement> & { nativeButton: false } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: NumberFieldIncrement.Props<boolean, TElement> & { nativeButton: boolean } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
};
