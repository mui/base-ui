'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../utils/types';
import { Field } from '../Field';

/**
 *
 * Demos:
 *
 * - [Text Area](https://base-ui.netlify.app/components/react-text-area/)
 *
 * API:
 *
 * - [TextArea API](https://base-ui.netlify.app/components/react-text-area/#api-reference-TextArea)
 */
const TextArea = React.forwardRef(function TextArea(
  props: TextArea.Props,
  forwardedRef: React.ForwardedRef<HTMLTextAreaElement>,
) {
  return <Field.Control ref={forwardedRef} render={<textarea />} {...props} />;
});

TextArea.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
} as any;

namespace TextArea {
  export interface Props extends BaseUIComponentProps<'textarea', OwnerState> {}

  export interface OwnerState {}
}

export { TextArea };
