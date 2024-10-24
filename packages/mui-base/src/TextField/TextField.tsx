'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../utils/types';
import { Field } from '../Field';

/**
 *
 * Demos:
 *
 * - [Text Field](https://base-ui.netlify.app/components/react-text-field/)
 *
 * API:
 *
 * - [TextField API](https://base-ui.netlify.app/components/react-text-field/#api-reference-TextField)
 */
const TextField = React.forwardRef(function TextField(
  props: TextField.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  return <Field.Control ref={forwardedRef} {...props} />;
});

TextField.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
} as any;

namespace TextField {
  export interface Props extends BaseUIComponentProps<'input', OwnerState> {}

  export interface OwnerState {}
}

export { TextField };
