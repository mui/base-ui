'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useNumberFieldContext } from '../Root/NumberFieldContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { NumberFieldRoot } from '../Root/NumberFieldRoot';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * The input element for the number field.
 *
 * Demos:
 *
 * - [Number Field](https://base-ui.netlify.app/components/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldInput API](https://base-ui.netlify.app/components/react-number-field/#api-reference-NumberFieldInput)
 */
const NumberFieldInput = React.forwardRef(function NumberFieldInput(
  props: NumberFieldInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, ...otherProps } = props;

  const { getInputProps, inputRef, ownerState } = useNumberFieldContext('Input');

  const mergedInputRef = useForkRef(forwardedRef, inputRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getInputProps,
    ref: mergedInputRef,
    render: render ?? 'input',
    className,
    ownerState,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace NumberFieldInput {
  export interface OwnerState extends NumberFieldRoot.OwnerState {}
  export interface Props extends BaseUIComponentProps<'input', OwnerState> {}
}

NumberFieldInput.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NumberFieldInput };
