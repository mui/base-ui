'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { FieldRoot } from '../root/FieldRoot';
import { useFieldRootContext } from '../root/FieldRootContext';
import { useFieldError } from './useFieldError';
import { fieldValidityMapping } from '../utils/constants';
import { useFormContext } from '../../form/FormContext';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * An error message displayed if the field control fails validation.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
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
    customStyleHookMapping: fieldValidityMapping,
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
     * Determines whether to show the error message according to the field’s
     * [ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState).
     */
    match?: keyof ValidityState;
    /**
     * Whether the error message should be shown regardless of the field’s validity.
     */
    forceShow?: boolean;
  }
}

export { FieldError };
