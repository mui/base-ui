'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../utils/types';
import { Field } from '../field';

/**
 * A native input element that automatically works with [Field](https://base-ui.com/react/components/field).
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Input](https://base-ui.com/react/components/input)
 */
export const Input = React.forwardRef(function Input(
  props: Input.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  return <Field.Control ref={forwardedRef} {...props} />;
});

export interface InputProps extends BaseUIComponentProps<'input', Input.State> {
  /**
   * Callback fired when the `value` changes. Use when controlled.
   */
  onValueChange?: Field.Control.Props['onValueChange'] | undefined;
  /**
   * The default value of the input. Use when uncontrolled.
   */
  defaultValue?: Field.Control.Props['defaultValue'] | undefined;
  /**
   * The value of the input. Use when controlled.
   */
  value?: React.ComponentProps<'input'>['value'] | undefined;
}

export interface InputState extends Field.Control.State {}

export type InputChangeEventReason = Field.Control.ChangeEventReason;
export type InputChangeEventDetails = Field.Control.ChangeEventDetails;

export namespace Input {
  export type Props = InputProps;
  export type State = InputState;
  export type ChangeEventReason = InputChangeEventReason;
  export type ChangeEventDetails = InputChangeEventDetails;
}
