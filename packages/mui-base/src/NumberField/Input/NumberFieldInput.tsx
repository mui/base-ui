import * as React from 'react';
import PropTypes from 'prop-types';
import type { NumberFieldInputProps } from './NumberFieldInput.types';
import { useNumberFieldContext } from '../Root/NumberFieldContext';
import { resolveClassName } from '../../utils/resolveClassName';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';

function defaultRender(props: React.ComponentPropsWithRef<'input'>) {
  return <input {...props} />;
}

/**
 * The input element for the number field.
 *
 * Demos:
 *
 * - [NumberField](https://mui.com/base-ui/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldInput API](https://mui.com/base-ui/react-number-field/components-api/#number-field-input)
 */
const NumberFieldInput = React.forwardRef(function NumberFieldInput(
  props: NumberFieldInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;
  const render = renderProp ?? defaultRender;

  const { getInputProps, inputRef, inputValue, ownerState } = useNumberFieldContext('Input');

  const mergedInputRef = useRenderPropForkRef(render, forwardedRef, inputRef);

  const inputProps = getInputProps({
    ref: mergedInputRef,
    className: resolveClassName(className, ownerState),
    value: inputValue,
    // If the server's locale does not match the client's locale, the formatting may not match,
    // causing a hydration mismatch.
    suppressHydrationWarning: true,
    ...otherProps,
  });

  return evaluateRenderProp(render, inputProps, ownerState);
});

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
   * Class names applied to the element or a function that returns them based on the component's
   * `ownerState`.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A React element or function that returns one to customize the element rendered by the
   * component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { NumberFieldInput };
