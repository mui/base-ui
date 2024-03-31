import * as React from 'react';
import PropTypes from 'prop-types';
import type { NumberFieldDecrementProps } from './NumberField.types';
import { useNumberFieldContext } from './NumberFieldContext';
import { resolveClassName } from '../utils/resolveClassName';

function defaultRender(props: React.ComponentPropsWithRef<'button'>) {
  return <button type="button" {...props} />;
}

/**
 * The decrement stepper button.
 *
 * Demos:
 *
 * - [NumberField](https://mui.com/base-ui/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldDecrement API](https://mui.com/base-ui/react-number-field/components-api/#number-field-decrement)
 */
const NumberFieldDecrement = React.forwardRef(function NumberFieldDecrement(
  props: NumberFieldDecrementProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;
  const render = renderProp ?? defaultRender;

  const { getDecrementButtonProps, ownerState } = useNumberFieldContext('Decrement');

  const buttonProps = getDecrementButtonProps({
    ref: forwardedRef,
    className: resolveClassName(className, ownerState),
    ...otherProps,
  });

  return render(buttonProps, ownerState);
});

NumberFieldDecrement.propTypes /* remove-proptypes */ = {
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

export { NumberFieldDecrement };
