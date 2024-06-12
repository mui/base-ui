'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { getStyleHookProps } from '../../utils/getStyleHookProps';
import { resolveClassName } from '../../utils/resolveClassName';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { useSliderRoot } from './useSliderRoot';
import { SliderProvider } from './SliderProvider';
import { SliderRootProps, SliderRootOwnerState } from './SliderRoot.types';

function defaultRender(props: React.ComponentPropsWithRef<'span'>) {
  return <span {...props} />;
}

const SliderRoot = React.forwardRef(function SliderRoot(
  props: SliderRootProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    'aria-labelledby': ariaLabelledby,
    className,
    defaultValue,
    disabled = false,
    isRtl = false,
    largeStep,
    render: renderProp,
    minDifferenceBetweenValues,
    onValueChange,
    onValueCommitted,
    orientation = 'horizontal',
    value,
    ...otherProps
  } = props;

  const render = renderProp ?? defaultRender;

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const { getRootProps, ...slider } = useSliderRoot({
    'aria-labelledby': ariaLabelledby,
    defaultValue,
    disabled,
    isRtl,
    largeStep,
    minDifferenceBetweenValues,
    onValueChange,
    onValueCommitted,
    orientation,
    rootRef: mergedRef,
    value,
    ...otherProps,
  });

  const ownerState: SliderRootOwnerState = React.useMemo(
    () => ({
      activeThumbIndex: slider.active,
      disabled,
      dragging: slider.dragging,
      isRtl,
      orientation,
      max: slider.max,
      min: slider.min,
      minDifferenceBetweenValues: slider.minDifferenceBetweenValues,
      step: slider.step,
      values: slider.values,
    }),
    [
      disabled,
      isRtl,
      orientation,
      slider.active,
      slider.dragging,
      slider.max,
      slider.min,
      slider.minDifferenceBetweenValues,
      slider.step,
      slider.values,
    ],
  );

  const styleHooks = React.useMemo(
    () => getStyleHookProps({ disabled, dragging: slider.dragging, orientation }),
    [disabled, slider.dragging, orientation],
  );

  const rootProps = getRootProps({
    ...styleHooks,
    ...otherProps,
    className: resolveClassName(className, ownerState),
  });

  const contextValue = React.useMemo(
    () => ({
      ...slider,
      ownerState,
    }),
    [slider, ownerState],
  );

  return (
    <SliderProvider value={contextValue}>
      {evaluateRenderProp(render, rootProps, ownerState)}
    </SliderProvider>
  );
});

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
   * /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * TODO: try to implement this in Material and remove from Base
   * If `true`, the active thumb doesn't swap when moving pointer over a thumb while dragging another thumb.
   * @default false
   */
  disableSwap: PropTypes.bool,
  /**
   * If `true` the Slider will be rendered right-to-left (with the lowest value on the right-hand side).
   * @default false
   */
  isRtl: PropTypes.bool,
  /**
   * The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down.
   * @default 10
   */
  largeStep: PropTypes.number,
  /**
   * Marks indicate predetermined values to which the user can move the slider.
   * If `true` the marks are spaced according the value of the `step` prop.
   * If an array, it should contain objects with `value` and an optional `label` keys.
   * @default false
   * @deprecated The Mark and MarkLabel components will be deprecated
   */
  marks: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.node,
        value: PropTypes.number.isRequired,
      }),
    ),
    PropTypes.bool,
  ]),
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
   * The minimum difference between values in a range slider.
   * @default 0
   */
  minDifferenceBetweenValues: PropTypes.number,
  /**
   * Name attribute of the hidden `input` element.
   */
  name: PropTypes.string,
  /**
   * Callback function that is fired when the slider's value changed.
   *
   * @param {number | number[]} value The new value.
   * @param {number} activeThumb Index of the currently moved thumb.
   * @param {Event} event The event source of the callback.
   * You can pull out the new value by accessing `event.target.value` (any).
   * **Warning**: This is a generic event not a change event.
   */
  onValueChange: PropTypes.func,
  /**
   * Callback function that is fired when the `pointerup` is triggered.
   *
   * @param {number | number[]} value The new value.
   * @param {React.SyntheticEvent | Event} event The event source of the callback. **Warning**: This is a generic event not a change event.
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
   * A transformation function, to change the scale of the slider.
   * @param {any} x
   * @returns {any}
   * @default function Identity(x) {
   *   return x;
   * }
   */
  scale: PropTypes.func,
  /**
   * The granularity with which the slider can step through values. (A "discrete" slider.)
   * The `min` prop serves as the origin for the valid values.
   * We recommend (max - min) to be evenly divisible by the step.
   * @default 1
   */
  step: PropTypes.number,
  /**
   * Tab index attribute of the Thumb component's `input` element.
   */
  tabIndex: PropTypes.number,
  /**
   * The value of the slider.
   * For ranged sliders, provide an array with two values.
   */
  value: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.number]),
} as any;

export { SliderRoot as Slider };
