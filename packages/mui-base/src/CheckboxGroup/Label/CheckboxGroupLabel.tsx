'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import * as Form from '../../Form';
import type { CheckboxGroupLabelProps } from './CheckboxGroupLabel.types';

/**
 * The label of a checkbox group.
 *
 * Demos:
 *
 * - [CheckboxGroupLabel](https://mui.com/base-ui/react-checkbox-group/)
 *
 * API:
 *
 * - [CheckboxGroupLabel API](https://mui.com/base-ui/react-checkbox/components-api/#checkbox-group-label)
 */
const CheckboxGroupLabel = React.forwardRef(function CheckboxGroupLabel(
  props: CheckboxGroupLabelProps,
  forwardedRef: React.ForwardedRef<HTMLLabelElement | HTMLSpanElement>,
) {
  return <Form.Label {...props} ref={forwardedRef} preventTextSelection={false} />;
});

CheckboxGroupLabel.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
} as any;

export { CheckboxGroupLabel };
