'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { NumberFieldRootContext } from './NumberFieldRootContext';
import { UseNumberFieldRoot, useNumberFieldRoot } from './useNumberFieldRoot';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRoot } from '../../Field/Root/FieldRoot';

/**
 * The foundation for building custom-styled number fields.
 *
 * Demos:
 *
 * - [Number Field](https://base-ui.netlify.app/components/react-number-field/)
 *
 * API:
 *
 * - [NumberFieldRoot API](https://base-ui.netlify.app/components/react-number-field/#api-reference-NumberFieldRoot)
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

  const { ownerState: fieldOwnerState, disabled: fieldDisabled } = useFieldRootContext();
  const disabled = fieldDisabled || disabledProp;

  const ownerState: NumberFieldRoot.OwnerState = React.useMemo(
    () => ({
      ...fieldOwnerState,
      disabled,
      invalid,
      readOnly,
      required,
      value: numberField.value,
      inputValue: numberField.inputValue,
      scrubbing: numberField.isScrubbing,
    }),
    [
      fieldOwnerState,
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

  const { renderElement } = useComponentRenderer({
    ref: forwardedRef,
    render: render ?? 'div',
    ownerState,
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
      Omit<BaseUIComponentProps<'div', OwnerState>, 'onChange' | 'defaultValue'> {}

  export interface OwnerState extends FieldRoot.OwnerState {
    /**
     * The raw number value of the input element.
     */
    value: number | null;
    /**
     * The string value of the input element.
     */
    inputValue: string;
    /**
     * If `true`, the input element is required.
     */
    required: boolean;
    /**
     * If `true`, the input element is disabled.
     */
    disabled: boolean;
    /**
     * If `true`, the input element is invalid.
     */
    invalid: boolean;
    /**
     * If `true`, the input element is read only.
     */
    readOnly: boolean;
    /**
     * If `true`, the value is being scrubbed.
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
   * If `true`, the input element is focused on mount.
   * @default false
   */
  autoFocus: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The default value of the input element. Use when the component is not controlled.
   */
  defaultValue: PropTypes.number,
  /**
   * If `true`, the input element is disabled.
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
   * Callback fired when the number value changes.
   * @param {number | null} value The new value.
   * @param {Event} event The event that triggered the change.
   */
  onValueChange: PropTypes.func,
  /**
   * If `true`, the input element is read only.
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
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

export { NumberFieldRoot };
