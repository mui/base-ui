'use client';
import * as React from 'react';
import type { NativeButtonComponentProps } from '../../internals/types';
import { useNumberFieldStepperButton } from '../root/useNumberFieldStepperButton';
import type { NumberFieldRootState } from '../root/NumberFieldRoot';

/**
 * A stepper button that decreases the field value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldDecrement = React.forwardRef(function NumberFieldDecrement(
  componentProps: NumberFieldDecrement.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  return useNumberFieldStepperButton(componentProps, forwardedRef, false);
}) as unknown as NumberFieldDecrementComponent;

export interface NumberFieldDecrementState extends NumberFieldRootState {}

export type NumberFieldDecrementProps<
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
> = NativeButtonComponentProps<TNativeButton, TElement, NumberFieldDecrement.State>;

export namespace NumberFieldDecrement {
  export type State = NumberFieldDecrementState;
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = NumberFieldDecrementProps<TNativeButton, TElement>;
}

type NumberFieldDecrementComponent = {
  <TElement extends React.ElementType = 'button'>(
    props: NumberFieldDecrement.Props<true, TElement> & {
      ref?: React.Ref<HTMLButtonElement> | undefined;
    },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: NumberFieldDecrement.Props<false, TElement> & { nativeButton: false } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
  <TElement extends React.ElementType = 'button'>(
    props: NumberFieldDecrement.Props<boolean, TElement> & { nativeButton: boolean } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
};
