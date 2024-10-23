'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../utils/types';
import { Field } from '../Field';

/**
 *
 * Demos:
 *
 * - [Text Input](https://base-ui.netlify.app/components/react-text-input/)
 *
 * API:
 *
 * - [TextInput API](https://base-ui.netlify.app/components/react-text-input/#api-reference-TextInput)
 */
const TextInput = React.forwardRef(function TextInput(
  props: TextInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  return <Field.Control ref={forwardedRef} {...props} />;
});

namespace TextInput {
  export interface Props extends BaseUIComponentProps<'input', OwnerState> {}

  export interface OwnerState {}
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
} as any;

export { TextInput };
