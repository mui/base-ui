'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../utils/types';
import { Field } from '../field';

/**
 *
 * Demos:
 *
 * - [Text Input](https://base-ui.com/components/react-text-input/)
 *
 * API:
 *
 * - [TextInput API](https://base-ui.com/components/react-text-input/#api-reference-TextInput)
 */
const TextInput = React.forwardRef(function TextInput(
  props: TextInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, ...otherProps } = props;
  return <Field.Control ref={forwardedRef} render={render} className={className} {...otherProps} />;
});

namespace TextInput {
  export interface Props extends BaseUIComponentProps<'input', State> {}

  export interface State {}
}

TextInput.propTypes /* remove-proptypes */ = {
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

export { TextInput };
