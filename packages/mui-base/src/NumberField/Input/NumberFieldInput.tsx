'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useNumberFieldRootContext } from '../Root/NumberFieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { NumberFieldRoot } from '../Root/NumberFieldRoot';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * The input element for the number field.
 *
 * Demos:
 *
 * - [Number Field](https://base-ui.netlify.app/components/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldInput API](https://base-ui.netlify.app/components/react-number-field/#api-reference-NumberFieldInput)
 */
const NumberFieldInput = React.forwardRef(function NumberFieldInput(
  props: NumberFieldInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, ...otherProps } = props;

  const { getInputProps, inputRef, ownerState } = useNumberFieldRootContext();

  const mergedInputRef = useForkRef(forwardedRef, inputRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getInputProps,
    ref: mergedInputRef,
    render: render ?? 'input',
    className,
    ownerState,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace NumberFieldInput {
  export interface OwnerState extends NumberFieldRoot.OwnerState {}
  export type Props = BaseUIComponentProps<'input', OwnerState> & {};
}

NumberFieldInput.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NumberFieldInput };
