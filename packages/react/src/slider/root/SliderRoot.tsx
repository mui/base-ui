'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { CompositeList } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { sliderStyleHookMapping } from './styleHooks';
import { useSliderRoot } from './useSliderRoot';
import { SliderRootContext } from './SliderRootContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';

/**
 * Groups all parts of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
const SliderRoot = React.forwardRef(function SliderRoot(
  props: SliderRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    'aria-labelledby': ariaLabelledby,
    className,
    defaultValue,
    disabled: disabledProp = false,
    id,
    format,
    largeStep,
    render,
    max,
    min,
    minStepsBetweenValues,
    name,
    onValueChange,
    onValueCommitted,
    orientation = 'horizontal',
    step,
    tabIndex,
    value,
    ...otherProps
  } = props;

  const direction = useDirection();

  const { labelId, state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
  const disabled = fieldDisabled || disabledProp;

  const { getRootProps, ...slider } = useSliderRoot({
    'aria-labelledby': ariaLabelledby ?? labelId,
    defaultValue,
    direction,
    disabled,
    id,
    largeStep,
    max,
    min,
    minStepsBetweenValues,
    name,
    onValueChange,
    onValueCommitted,
    orientation,
    rootRef: forwardedRef,
    step,
    tabIndex,
    value,
  });

  const state: SliderRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      activeThumbIndex: slider.active,
      disabled,
      dragging: slider.dragging,
      orientation,
      max: slider.max,
      min: slider.min,
      minStepsBetweenValues: slider.minStepsBetweenValues,
      step: slider.step,
      values: slider.values,
    }),
    [
      fieldState,
      disabled,
      orientation,
      slider.active,
      slider.dragging,
      slider.max,
      slider.min,
      slider.minStepsBetweenValues,
      slider.step,
      slider.values,
    ],
  );

  const contextValue = React.useMemo(
    () => ({
      ...slider,
      format,
      state,
    }),
    [slider, format, state],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    state,
    className,
    extraProps: otherProps,
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return (
    <SliderRootContext.Provider value={contextValue}>
      <CompositeList elementsRef={slider.thumbRefs}>{renderElement()}</CompositeList>
    </SliderRootContext.Provider>
  );
});

export namespace SliderRoot {
  export interface State extends FieldRoot.State {
    /**
     * The index of the active thumb.
     */
    activeThumbIndex: number;
    /**
     * Whether the component should ignore user actions.
     */
    disabled: boolean;
    /**
     * If `true`, a thumb is being dragged by a pointer.
     */
    dragging: boolean;
    max: number;
    min: number;
    /**
     * The minimum steps between values in a range slider.
     * @default 0
     */
    minStepsBetweenValues: number;
    /**
     * The component orientation.
     */
    orientation: useSliderRoot.Orientation;
    /**
     * The step increment of the slider when incrementing or decrementing. It will snap
     * to multiples of this value. Decimal values are supported.
     * @default 1
     */
    step: number;
    /**
     * The raw number value of the slider.
     */
    values: ReadonlyArray<number>;
  }

  export interface Props
    extends Pick<
        useSliderRoot.Parameters,
        | 'disabled'
        | 'max'
        | 'min'
        | 'minStepsBetweenValues'
        | 'name'
        | 'onValueChange'
        | 'onValueCommitted'
        | 'orientation'
        | 'largeStep'
        | 'step'
        | 'value'
      >,
      Omit<BaseUIComponentProps<'div', State>, 'defaultValue' | 'onChange' | 'values'> {
    /**
     * The default value of the slider. Use when the component is not controlled.
     */
    defaultValue?: number | ReadonlyArray<number>;
    /**
     * Whether the component should ignore user actions.
     * @default false
     */
    disabled?: boolean;
    /**
     * Options to format the input value.
     */
    format?: Intl.NumberFormatOptions;
    /**
     * The value of the slider.
     * For ranged sliders, provide an array with two values.
     */
    value?: number | ReadonlyArray<number>;
  }
}

export { SliderRoot };

SliderRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Identifies the element (or elements) that labels the current element.
   * @see aria-describedby.
   */
  'aria-labelledby': PropTypes.string,
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
   * The default value of the slider. Use when the component is not controlled.
   */
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.number]),
  /**
   * Whether the component should ignore user actions.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Options to format the input value.
   */
  format: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
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
    ),
    PropTypes.shape({
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
  ]),
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down.
   * @default 10
   */
  largeStep: PropTypes.number,
  /**
   * The maximum allowed value of the slider.
   * Should not be equal to min.
   * @default 100
   */
  max: PropTypes.number,
  /**
   * The minimum allowed value of the slider.
   * Should not be equal to max.
   * @default 0
   */
  min: PropTypes.number,
  /**
   * The minimum steps between values in a range slider.
   * @default 0
   */
  minStepsBetweenValues: PropTypes.number,
  /**
   * Identifies the field when a form is submitted.
   */
  name: PropTypes.string,
  /**
   * Callback function that is fired when the slider's value changed.
   *
   * @param {number | number[]} value The new value.
   * @param {Event} event The corresponding event that initiated the change.
   * You can pull out the new value by accessing `event.target.value` (any).
   * @param {number} activeThumbIndex Index of the currently moved thumb.
   */
  onValueChange: PropTypes.func,
  /**
   * Callback function that is fired when the `pointerup` is triggered.
   *
   * @param {number | number[]} value The new value.
   * @param {Event} event The corresponding event that initiated the change.
   * **Warning**: This is a generic event not a change event.
   */
  onValueCommitted: PropTypes.func,
  /**
   * The component orientation.
   * @default 'horizontal'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The granularity with which the slider can step through values. (A "discrete" slider.)
   * The `min` prop serves as the origin for the valid values.
   * We recommend (max - min) to be evenly divisible by the step.
   * @default 1
   */
  step: PropTypes.number,
  /**
   * @ignore
   */
  tabIndex: PropTypes.number,
  /**
   * The value of the slider.
   * For ranged sliders, provide an array with two values.
   */
  value: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.number]),
} as any;
