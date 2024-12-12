'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { NumberFieldRootContext } from './NumberFieldRootContext';
import { UseNumberFieldRoot, useNumberFieldRoot } from './useNumberFieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRoot } from '../../field/root/FieldRoot';

/**
 * Groups all parts of the number field and manages its state.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldRoot = React.forwardRef(function NumberFieldRoot(
  props: NumberFieldRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    id,
    min,
    max,
    smallStep,
    step,
    largeStep,
    autoFocus,
    required = false,
    disabled: disabledProp = false,
    invalid = false,
    readOnly = false,
    name,
    defaultValue,
    value,
    onValueChange,
    allowWheelScrub,
    format,
    render,
    className,
    ...otherProps
  } = props;

  const numberField = useNumberFieldRoot(props);

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
  const disabled = fieldDisabled || disabledProp;

  const state: NumberFieldRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      disabled,
      invalid,
      readOnly,
      required,
      value: numberField.value,
      inputValue: numberField.inputValue,
      scrubbing: numberField.isScrubbing,
    }),
    [
      fieldState,
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
      state,
    }),
    [numberField, state],
  );

  const { renderElement } = useComponentRenderer({
    ref: forwardedRef,
    render: render ?? 'div',
    state,
    className,
    extraProps: otherProps,
  });

  return (
    <NumberFieldRootContext.Provider value={contextValue}>
      {renderElement()}
    </NumberFieldRootContext.Provider>
  );
});

export namespace NumberFieldRoot {
  export interface Props
    extends UseNumberFieldRoot.Parameters,
      Omit<BaseUIComponentProps<'div', State>, 'onChange' | 'defaultValue'> {}

  export interface State extends FieldRoot.State {
    /**
     * The raw numeric value of the field.
     */
    value: number | null;
    /**
     * The formatted string value presented in the input element.
     */
    inputValue: string;
    /**
     * Whether the user must enter a value before submitting a form.
     */
    required: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the field is currently invalid.
     */
    invalid: boolean;
    /**
     * Whether the user should be unable to change the field value.
     */
    readOnly: boolean;
    /**
     * Whether the user is currently scrubbing the field.
     */
    scrubbing: boolean;
  }
}

NumberFieldRoot.propTypes /* remove-proptypes */ = {
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
   * Whether to focus the element on page load.
   * @default false
   */
  autoFocus: PropTypes.bool,
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
   * The uncontrolled value of the field when it’s initially rendered.
   * To render a controlled number field, use the `value` prop instead.
   */
  defaultValue: PropTypes.number,
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Options to format the input value.
   */
  format: PropTypes.shape({
    compactDisplay: PropTypes.oneOf(['long', 'short']),
    currency: PropTypes.string,
    currencyDisplay: PropTypes.oneOf(['code', 'name', 'narrowSymbol', 'symbol']),
    currencySign: PropTypes.oneOf(['accounting', 'standard']),
    localeMatcher: PropTypes.oneOf(['best fit', 'lookup']),
    maximumFractionDigits: PropTypes.number,
    maximumSignificantDigits: PropTypes.number,
    minimumFractionDigits: PropTypes.number,
    minimumIntegerDigits: PropTypes.number,
    minimumSignificantDigits: PropTypes.number,
    notation: PropTypes.oneOf(['compact', 'engineering', 'scientific', 'standard']),
    numberingSystem: PropTypes.string,
    signDisplay: PropTypes.oneOf(['always', 'auto', 'exceptZero', 'never']),
    style: PropTypes.oneOf(['currency', 'decimal', 'percent', 'unit']),
    unit: PropTypes.string,
    unitDisplay: PropTypes.oneOf(['long', 'narrow', 'short']),
    useGrouping: PropTypes.bool,
  }),
  /**
   * The id of the input element.
   */
  id: PropTypes.string,
  /**
   * Whether the field is forcefully marked as invalid.
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
   * Identifies the field when a form is submitted.
   */
  name: PropTypes.string,
  /**
   * Callback fired when the number value changes.
   * @param {number | null} value The new value.
   * @param {Event} event The event that triggered the change.
   */
  onValueChange: PropTypes.func,
  /**
   * Whether the user should be unable to change the field value.
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Whether the user must enter a value before submitting a form.
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
   * The raw numeric value of the field.
   */
  value: PropTypes.number,
} as any;

export { NumberFieldRoot };
