import * as React from 'react';
import PropTypes from 'prop-types';
import { useForkRef } from '../utils/useForkRef';
import { useNumberFieldContext } from './NumberFieldContext';
import type { NumberFieldInputProps } from './NumberField.types';
import { resolveClassName } from '../utils/resolveClassName';

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

  const mergedInputRef = useForkRef(forwardedRef, inputRef);

  const inputProps = getInputProps({
    ref: mergedInputRef,
    className: resolveClassName(className, ownerState),
    value: inputValue,
    // If the server's locale does not match the client's locale, the formatting may not match,
    // causing a hydration mismatch.
    suppressHydrationWarning: true,
    ...otherProps,
  });

  return render(inputProps, ownerState);
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.func,
} as any;

export { NumberFieldInput };
