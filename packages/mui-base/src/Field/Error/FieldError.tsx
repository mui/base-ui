'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldErrorProps } from './FieldError.types';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { useFieldError } from './useFieldError';
import { STYLE_HOOK_MAPPING } from '../utils/constants';
import { useFormRootContext } from '../../Form/Root/FormRootContext';

/**
 * Displays error messages for the field's control.
 *
 * Demos:
 *
 * - [Field](https://mui.com/base-ui/react-field/)
 *
 * API:
 *
 * - [FieldError API](https://mui.com/base-ui/react-field/components-api/#field-error)
 */
const FieldError = React.forwardRef(function FieldError(
  props: FieldErrorProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, id, className, show, forceShow, ...otherProps } = props;

  const { validityData, ownerState, name } = useFieldRootContext(false);

  const { errors } = useFormRootContext();

  const formError = name ? errors[name] : null;

  let rendered = false;
  if (formError || forceShow) {
    rendered = true;
  } else if (show) {
    rendered = Boolean(validityData.state[show]);
  } else if (forceShow == null) {
    rendered = validityData.state.valid === false;
  }

  const { getErrorProps } = useFieldError({ id, rendered, formError });

  const { renderElement } = useComponentRenderer({
    propGetter: getErrorProps,
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
  });

  if (!rendered) {
    return null;
  }

  return renderElement();
});

FieldError.propTypes /* remove-proptypes */ = {
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
   * Determines whether the error message should be shown regardless of the field's client validity.
   */
  forceShow: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Determines whether the error message should be shown when it matches a given property of the
   * field's `ValidityState`.
   */
  show: PropTypes.oneOf([
    'badInput',
    'customError',
    'patternMismatch',
    'rangeOverflow',
    'rangeUnderflow',
    'stepMismatch',
    'tooLong',
    'tooShort',
    'typeMismatch',
    'valid',
    'valueMissing',
  ]),
} as any;

export { FieldError };
