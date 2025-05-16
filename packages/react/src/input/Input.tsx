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
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, ...otherProps } = props;
  return <Field.Control ref={forwardedRef} render={render} className={className} {...otherProps} />;
});

export namespace Input {
  export interface Props extends BaseUIComponentProps<'input', State> {
    /**
     * Callback fired when the `value` changes. Use when controlled.
     */
    onValueChange?: Field.Control.Props['onValueChange'];
    defaultValue?: Field.Control.Props['defaultValue'];
  }

  export interface State {}
}
