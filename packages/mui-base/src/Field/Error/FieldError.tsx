'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldErrorOwnerState, FieldErrorProps } from './FieldError.types';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { useFieldError } from './useFieldError';
import { STYLE_HOOK_MAPPING } from '../utils/constants';

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
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, id, className, show: showProp, forceShow = false, ...otherProps } = props;

  const { validityData, disabled = false } = useFieldRootContext();

  const rendered = showProp ? validityData.state[showProp] : forceShow || !validityData.state.valid;

  const { getErrorProps } = useFieldError({ id, rendered });

  const ownerState: FieldErrorOwnerState = React.useMemo(
    () => ({
      disabled,
      valid: validityData.state.valid,
    }),
    [disabled, validityData.state.valid],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getErrorProps,
    render: render ?? 'span',
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
   * @ignore
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
   * @ignore
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
