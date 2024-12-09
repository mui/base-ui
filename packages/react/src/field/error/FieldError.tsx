'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useFieldError } from './useFieldError';
import { STYLE_HOOK_MAPPING } from '../utils/constants';
import { useFormContext } from '../../form/FormContext';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Displays error messages for the field's control.
 *
 * Demos:
 *
 * - [Field](https://base-ui.com/components/react-field/)
 *
 * API:
 *
 * - [FieldError API](https://base-ui.com/components/react-field/#api-reference-FieldError)
 */
const FieldError = React.forwardRef(function FieldError(
  props: FieldError.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, id, className, match, forceShow, ...otherProps } = props;

  const { validityData, state, name } = useFieldRootContext(false);

  const { errors } = useFormContext();

  const formError = name ? errors[name] : null;

  let rendered = false;
  if (formError || forceShow) {
    rendered = true;
  } else if (match) {
    rendered = Boolean(validityData.state[match]);
  } else if (forceShow == null) {
    rendered = validityData.state.valid === false;
  }

  const { getErrorProps } = useFieldError({ id, rendered, formError });

  const { renderElement } = useComponentRenderer({
    propGetter: getErrorProps,
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
  });

  if (!rendered) {
    return null;
  }

  return renderElement();
});

namespace FieldError {
  export type State = FieldRoot.State;

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Determines whether the error message should be shown when it matches a given property of the
     * field's `ValidityState`.
     */
    match?: keyof ValidityState;
    /**
     * Determines whether the error message should be shown regardless of the field's client validity.
     */
    forceShow?: boolean;
  }
}

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
   * Determines whether the error message should be shown when it matches a given property of the
   * field's `ValidityState`.
   */
  match: PropTypes.oneOf([
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
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { FieldError };
