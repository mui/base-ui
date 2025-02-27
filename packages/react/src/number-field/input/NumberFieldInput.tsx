'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import type { BaseUIComponentProps } from '../../utils/types';
import { fieldValidityMapping } from '../../field/utils/constants';

/**
 * The native input control in the number field.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldInput = React.forwardRef(function NumberFieldInput(
  props: NumberFieldInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, ...otherProps } = props;

  const { getInputProps, mergedRef, state } = useNumberFieldRootContext();

  const mergedInputRef = useForkRef(forwardedRef, mergedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getInputProps,
    ref: mergedInputRef,
    render: render ?? 'input',
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping: fieldValidityMapping,
  });

  return renderElement();
});

namespace NumberFieldInput {
  export interface State extends NumberFieldRoot.State {}
  export interface Props extends BaseUIComponentProps<'input', State> {}
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NumberFieldInput };
