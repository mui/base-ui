import * as React from 'react';
import PropTypes from 'prop-types';
import type { NumberFieldIncrementProps } from './NumberField.types';
import { useNumberFieldContext } from './NumberFieldContext';
import { resolveClassName } from '../utils/resolveClassName';

function defaultRender(props: React.ComponentPropsWithRef<'button'>) {
  return <button type="button" {...props} />;
}

/**
 *
 * Demos:
 *
 * - [NumberField](https://mui.com/base-ui/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldIncrement API](https://mui.com/base-ui/react-number-field/components-api/#number-field-increment)
 */
const NumberFieldIncrement = React.forwardRef(function NumberFieldIncrement(
  props: NumberFieldIncrementProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render: renderProp, className, ...otherProps } = props;
  const render = renderProp ?? defaultRender;

  const { getIncrementButtonProps, ownerState } = useNumberFieldContext('Increment');

  const buttonProps = getIncrementButtonProps({
    ref: forwardedRef,
    className: resolveClassName(className, ownerState),
    ...otherProps,
  });

  return render(buttonProps, ownerState);
});

NumberFieldIncrement.propTypes /* remove-proptypes */ = {
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

export { NumberFieldIncrement };
