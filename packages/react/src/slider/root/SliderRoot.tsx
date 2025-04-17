'use client';
import * as React from 'react';
import { NOOP } from '../../utils/noop';
import { clamp } from '../../utils/clamp';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { valueToPercent } from '../../utils/valueToPercent';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { CompositeList } from '../../composite/list/CompositeList';
import { sliderStyleHookMapping } from './styleHooks';
import { useSliderRoot } from './useSliderRoot';
import { SliderRootContext } from './SliderRootContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';

export function valueArrayToPercentages(values: number[], min: number, max: number) {
  const output = [];
  for (let i = 0; i < values.length; i += 1) {
    output.push(clamp(valueToPercent(values[i], min, max), 0, 100));
  }
  return output;
}

/**
 * Groups all parts of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
const SliderRoot = React.forwardRef(function SliderRoot<Value extends number | readonly number[]>(
  props: SliderRoot.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    defaultValue,
    disabled: disabledProp = false,
    id: idProp,
    format,
    largeStep = 10,
    render,
    max = 100,
    min = 0,
    minStepsBetweenValues = 0,
    name: nameProp,
    onValueChange: onValueChangeProp,
    onValueCommitted: onValueCommittedProp,
    orientation = 'horizontal',
    step = 1,
    tabIndex: externalTabIndex,
    value,
    ...otherProps
  } = props;

  const id = useBaseUiId(idProp);

  const {
    labelId,
    state: fieldState,
    disabled: fieldDisabled,
    name: fieldName,
  } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp ?? '';

  const { getRootProps, ...slider } = useSliderRoot({
    'aria-labelledby': props['aria-labelledby'] ?? labelId,
    defaultValue,
    disabled,
    id: id ?? '',
    largeStep,
    max,
    min,
    minStepsBetweenValues,
    name,
    onValueChange: (onValueChangeProp as useSliderRoot.Parameters['onValueChange']) ?? NOOP,
    onValueCommitted:
      (onValueCommittedProp as useSliderRoot.Parameters['onValueCommitted']) ?? NOOP,
    orientation,
    rootRef: forwardedRef,
    step,
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
      tabIndex: externalTabIndex ?? null,
    }),
    [slider, format, state, externalTabIndex],
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
      <CompositeList elementsRef={slider.thumbRefs} onMapChange={slider.setThumbMap}>
        {renderElement()}
      </CompositeList>
    </SliderRootContext.Provider>
  );
}) as {
  <Value extends number | readonly number[]>(
    props: SliderRoot.Props<Value> & {
      ref?: React.RefObject<HTMLDivElement>;
    },
  ): React.JSX.Element;
};

export interface FingerPosition {
  x: number;
  y: number;
}

namespace SliderRoot {
  export interface State extends FieldRoot.State {
    /**
     * The index of the active thumb.
     */
    activeThumbIndex: number;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the thumb is currently being dragged.
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
    orientation: Orientation;
    /**
     * The step increment of the slider when incrementing or decrementing. It will snap
     * to multiples of this value. Decimal values are supported.
     * @default 1
     */
    step: number;
    /**
     * The raw number value of the slider.
     */
    values: readonly number[];
  }

  export interface Props<Value extends number | readonly number[] = number | readonly number[]>
    extends Partial<
        Pick<
          useSliderRoot.Parameters,
          | 'disabled'
          | 'max'
          | 'min'
          | 'minStepsBetweenValues'
          | 'name'
          | 'orientation'
          | 'largeStep'
          | 'step'
        >
      >,
      Omit<BaseUIComponentProps<'div', State>, 'onChange' | 'values'> {
    /**
     * The uncontrolled value of the slider when it’s initially rendered.
     *
     * To render a controlled slider, use the `value` prop instead.
     */
    defaultValue?: Value;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Options to format the input value.
     */
    format?: Intl.NumberFormatOptions;
    /**
     * Optional tab index attribute for the thumb components.
     */
    tabIndex?: number;
    /**
     * The value of the slider.
     * For ranged sliders, provide an array with two values.
     */
    value?: Value;
    /**
     * Callback function that is fired when the slider's value changed.
     *
     * @param {number | number[]} value The new value.
     * @param {Event} event The corresponding event that initiated the change.
     * You can pull out the new value by accessing `event.target.value` (any).
     * @param {number} activeThumbIndex Index of the currently moved thumb.
     */
    onValueChange?: (
      value: Value extends number ? number : Value,
      event: Event,
      activeThumbIndex: number,
    ) => void;
    /**
     * Callback function that is fired when the `pointerup` is triggered.
     *
     * @param {number | number[]} value The new value.
     * @param {Event} event The corresponding event that initiated the change.
     * **Warning**: This is a generic event not a change event.
     */
    onValueCommitted?: (value: Value extends number ? number : Value, event: Event) => void;
  }
}
export { SliderRoot };
