'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { CompositeList } from '../../composite/list/CompositeList';
import { sliderStyleHookMapping } from './styleHooks';
import { useSliderRoot } from './useSliderRoot';
import { SliderRootContext } from './SliderRootContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';

/**
 *
 * Demos:
 *
 * - [Slider](https://base-ui.com/components/react-slider/)
 *
 * API:
 *
 * - [SliderRoot API](https://base-ui.com/components/react-slider/#api-reference-SliderRoot)
 */
const SliderRoot = React.forwardRef(function SliderRoot(
  props: SliderRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    'aria-labelledby': ariaLabelledby,
    className,
    defaultValue,
    dir: dirAttribute,
    disabled: disabledProp = false,
    largeStep,
    render,
    minStepsBetweenValues,
    onValueChange,
    onValueCommitted,
    orientation = 'horizontal',
    value,
    ...otherProps
  } = props;

  const { labelId, state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
  const disabled = fieldDisabled || disabledProp;

  const { getRootProps, ...slider } = useSliderRoot({
    'aria-labelledby': ariaLabelledby ?? labelId,
    defaultValue,
    disabled,
    dir: dirAttribute,
    largeStep,
    minStepsBetweenValues,
    onValueChange,
    onValueCommitted,
    orientation,
    rootRef: forwardedRef,
    value,
    ...otherProps,
  });

  const state: SliderRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      activeThumbIndex: slider.active,
      dir: slider.dir,
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
      slider.dir,
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
      state,
    }),
    [slider, state],
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
     * If `true`, the component is disabled.
     */
    disabled: boolean;
    /**
     * If `true`, a thumb is being dragged by a pointer.
     */
    dragging: boolean;
    dir: string | undefined;
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
    extends Omit<useSliderRoot.Parameters, 'rootRef'>,
      Omit<BaseUIComponentProps<'span', State>, 'defaultValue' | 'onChange' | 'values'> {
    /**
     * The default value of the slider. Use when the component is not controlled.
     */
    defaultValue?: number | ReadonlyArray<number>;
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
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
   * The id of the element containing a label for the slider.
   */
  'aria-labelledby': PropTypes.string,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The default value of the slider. Use when the component is not controlled.
   */
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.number]),
  /**
   * Sets the direction. For right-to-left languages, the lowest value is on the right-hand side.
   * @default 'ltr'
   */
  direction: PropTypes.oneOf(['ltr', 'rtl']),
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down.
   * @default 10
   */
  largeStep: PropTypes.number,
  /**
   * The minimum steps between values in a range slider.
   * @default 0
   */
  minStepsBetweenValues: PropTypes.number,
  /**
   * Callback function that is fired when the slider's value changed.
   *
   * @param {number | number[]} value The new value.
   * @param {Event} event The event source of the callback.
   * You can pull out the new value by accessing `event.target.value` (any).
   * @param {number} activeThumbIndex Index of the currently moved thumb.
   */
  onValueChange: PropTypes.func,
  /**
   * Callback function that is fired when the `pointerup` is triggered.
   *
   * @param {number | number[]} value The new value.
   * @param {Event} event The event source of the callback.
   * **Warning**: This is a generic event not a change event.
   */
  onValueCommitted: PropTypes.func,
  /**
   * The component orientation.
   * @default 'horizontal'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The value of the slider.
   * For ranged sliders, provide an array with two values.
   */
  value: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.number]),
} as any;
