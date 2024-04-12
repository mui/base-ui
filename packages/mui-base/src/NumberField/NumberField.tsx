import * as React from 'react';
import PropTypes from 'prop-types';
import { NumberFieldContext } from './NumberFieldContext';
import type { NumberFieldOwnerState, NumberFieldProps } from './NumberField.types';
import { resolveClassName } from '../utils/resolveClassName';
import { useNumberField } from '../useNumberField/useNumberField';

function defaultRender(props: React.ComponentPropsWithRef<'div'>) {
  return <div {...props} />;
}

/**
 * The foundation for building custom-styled number fields.
 *
 * Demos:
 *
 * - [NumberField](https://mui.com/base-ui/react-number-field/)
 *
 * API:
 *
 * - [NumberField API](https://mui.com/base-ui/react-number-field/components-api/#number-field)
 */
const NumberField = React.forwardRef(function NumberField(
  props: NumberFieldProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    id,
    min,
    max,
    smallStep,
    step,
    largeStep,
    required = false,
    disabled = false,
    invalid = false,
    readOnly = false,
    name,
    value,
    onChange,
    allowWheelScrub,
    render: renderProp,
    className,
    ...otherProps
  } = props;
  const render = renderProp ?? defaultRender;

  const numberField = useNumberField(props);

  const ownerState: NumberFieldOwnerState = React.useMemo(
    () => ({
      disabled,
      invalid,
      readOnly,
      required,
      value: numberField.value,
      inputValue: numberField.inputValue,
      scrubbing: numberField.isScrubbing,
    }),
    [
      disabled,
      invalid,
      readOnly,
      required,
      numberField.value,
      numberField.inputValue,
      numberField.isScrubbing,
    ],
  );

  const contextValue = React.useMemo(
    () => ({
      ...numberField,
      ownerState,
    }),
    [numberField, ownerState],
  );

  const rootProps = {
    ref: forwardedRef,
    className: resolveClassName(className, ownerState),
    ...otherProps,
  };

  return (
    <NumberFieldContext.Provider value={contextValue}>
      {render(rootProps, ownerState)}
    </NumberFieldContext.Provider>
  );
});

NumberField.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Whether to allow the user to scrub the input value with the mouse wheel while focused and
   * hovering over the input.
   * @default false
   */
  allowWheelScrub: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * If `true`, the input element is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * If `true`, the input element is invalid.
   * @default false
   */
  invalid: PropTypes.bool,
  /**
   * The large step value of the input element when incrementing while the shift key is held. Snaps
   * to multiples of this value.
   * @default 10
   */
  largeStep: PropTypes.number,
  /**
   * The maximum value of the input element.
   */
  max: PropTypes.number,
  /**
   * The minimum value of the input element.
   */
  min: PropTypes.number,
  /**
   * The name of the input element.
   */
  name: PropTypes.string,
  /**
   * @param value the raw number value of the input element.
   */
  onChange: PropTypes.func,
  /**
   * If `true`, the input element is read only.
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.func,
  /**
   * If `true`, the input element is required.
   * @default false
   */
  required: PropTypes.bool,
  /**
   * The small step value of the input element when incrementing while the meta key is held. Snaps
   * to multiples of this value.
   * @default 0.1
   */
  smallStep: PropTypes.number,
  /**
   * The step value of the input element when incrementing, decrementing, or scrubbing. It will snap
   * to multiples of this value. When unspecified, decimal values are allowed, but the stepper
   * buttons will increment or decrement by `1`.
   */
  step: PropTypes.number,
  /**
   * The raw number value of the input element.
   */
  value: PropTypes.number,
} as any;

export { NumberField };
