'use client';
import * as React from 'react';
import { activeElement } from '@floating-ui/react/utils';
import { areArraysEqual } from '../../utils/areArraysEqual';
import { clamp } from '../../utils/clamp';
import { ownerDocument } from '../../utils/owner';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { useRenderElement } from '../../utils/useRenderElement';
import { valueToPercent } from '../../utils/valueToPercent';
import { warn } from '../../utils/warn';

import { CompositeList, type CompositeMetadata } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';

import type { FieldRoot } from '../../field/root/FieldRoot';
import { useField } from '../../field/useField';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFieldRootContext } from '../../field/root/FieldRootContext';

import { asc } from '../utils/asc';
import { focusThumb } from '../utils/focusThumb';
import { getSliderValue } from '../utils/getSliderValue';
import { replaceArrayItemAtIndex } from '../utils/replaceArrayItemAtIndex';
import { roundValueToStep } from '../utils/roundValueToStep';
import { validateMinimumDistance } from '../utils/validateMinimumDistance';

import type { ThumbMetadata } from '../thumb/SliderThumb';

import { sliderStyleHookMapping } from './styleHooks';
import { SliderRootContext } from './SliderRootContext';

function areValuesEqual(
  newValue: number | readonly number[],
  oldValue: number | readonly number[],
) {
  if (typeof newValue === 'number' && typeof oldValue === 'number') {
    return newValue === oldValue;
  }
  if (Array.isArray(newValue) && Array.isArray(oldValue)) {
    return areArraysEqual(newValue, oldValue);
  }
  return false;
}

function getClosestThumbIndex(values: readonly number[], currentValue: number, max: number) {
  let closestIndex;
  let minDistance;
  for (let i = 0; i < values.length; i += 1) {
    const distance = Math.abs(currentValue - values[i]);
    if (
      minDistance === undefined ||
      // when the value is at max, the lowest index thumb has to be dragged
      // first or it will block higher index thumbs from moving
      // otherwise consider higher index thumbs to be closest when their values are identical
      (values[i] === max ? distance < minDistance : distance <= minDistance)
    ) {
      closestIndex = i;
      minDistance = distance;
    }
  }

  return closestIndex;
}

function getControlOffset(styles: CSSStyleDeclaration | null, orientation: Orientation) {
  if (!styles) {
    return {
      start: 0,
      end: 0,
    };
  }

  const start = orientation === 'horizontal' ? 'InlineStart' : 'Top';
  const end = orientation === 'horizontal' ? 'InlineEnd' : 'Bottom';

  return {
    start: parseFloat(styles[`border${start}Width`]) + parseFloat(styles[`padding${start}`]),
    end: parseFloat(styles[`border${end}Width`]) + parseFloat(styles[`padding${end}`]),
  };
}

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
  componentProps: SliderRoot.Props<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    'aria-labelledby': ariaLabelledbyProp,
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
    value: valueProp,
    ...elementProps
  } = componentProps;

  const onValueChange = useEventCallback(
    onValueChangeProp as (value: number | number[], event: Event, activeThumbIndex: number) => void,
  );
  const onValueCommitted = useEventCallback(
    onValueCommittedProp as (value: number | readonly number[], event: Event) => void,
  );

  const id = useBaseUiId(idProp);
  const direction = useDirection();
  const {
    labelId,
    state: fieldState,
    disabled: fieldDisabled,
    name: fieldName,
    setControlId,
    setTouched,
    setDirty,
    validityData,
    validationMode,
  } = useFieldRootContext();

  const {
    getValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

  const ariaLabelledby = ariaLabelledbyProp ?? labelId;
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp ?? '';

  // The internal value is potentially unsorted, e.g. to support frozen arrays
  // https://github.com/mui/material-ui/pull/28472
  const [valueUnwrapped, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? min,
    name: 'Slider',
  });

  const sliderRef = React.useRef<HTMLElement>(null);
  const controlRef: React.RefObject<HTMLElement | null> = React.useRef(null);
  const thumbRefs = React.useRef<(HTMLElement | null)[]>([]);
  const closestThumbIndexRef = React.useRef<number | null>(null);
  const controlStylesRef = React.useRef<CSSStyleDeclaration | null>(null);
  const lastChangedValueRef = React.useRef<number | readonly number[] | null>(null);

  // We can't use the :active browser pseudo-classes.
  // - The active state isn't triggered when clicking on the rail.
  // - The active state isn't transferred when inversing a range slider.
  const [active, setActive] = React.useState(-1);
  const [dragging, setDragging] = React.useState(false);
  const [thumbMap, setThumbMap] = React.useState(
    () => new Map<Node, CompositeMetadata<ThumbMetadata> | null>(),
  );

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  useField({
    id,
    commitValidation,
    value: valueUnwrapped,
    controlRef,
  });

  const registerSliderControl = React.useCallback(
    (element: HTMLElement | null) => {
      if (element) {
        controlRef.current = element;
        if (controlStylesRef.current == null) {
          controlStylesRef.current = getComputedStyle(element);
        }
        inputValidationRef.current = element.querySelector<HTMLInputElement>('input[type="range"]');
      }
    },
    [inputValidationRef],
  );

  const range = Array.isArray(valueUnwrapped);

  const values = React.useMemo(() => {
    if (!range) {
      return [clamp(valueUnwrapped as number, min, max)];
    }
    return valueUnwrapped.slice().sort(asc);
  }, [max, min, range, valueUnwrapped]);

  const setValue = useEventCallback(
    (newValue: number | number[], thumbIndex: number, event: Event) => {
      if (Number.isNaN(newValue) || areValuesEqual(newValue, valueUnwrapped)) {
        return;
      }

      setValueUnwrapped(newValue as Value);
      // Redefine target to allow name and value to be read.
      // This allows seamless integration with the most popular form libraries.
      // https://github.com/mui/material-ui/issues/13485#issuecomment-676048492
      // Clone the event to not override `target` of the original event.
      // @ts-ignore The nativeEvent is function, not object
      const clonedEvent = new event.constructor(event.type, event);

      Object.defineProperty(clonedEvent, 'target', {
        writable: true,
        value: { value: newValue, name },
      });

      lastChangedValueRef.current = newValue;
      onValueChange(newValue, clonedEvent, thumbIndex);
    },
  );

  // for pointer drag only
  const commitValue = useEventCallback((value: number | readonly number[], event: Event) => {
    onValueCommitted(value, event);
  });

  // for keypresses only
  const handleInputChange = useEventCallback(
    (valueInput: number, index: number, event: React.KeyboardEvent | React.ChangeEvent) => {
      const newValue = getSliderValue(valueInput, index, min, max, range, values);

      if (range) {
        focusThumb(index, sliderRef);
      }

      if (validateMinimumDistance(newValue, step, minStepsBetweenValues)) {
        setValue(newValue, index, event.nativeEvent);
        setDirty(newValue !== validityData.initialValue);
        setTouched(true);
        onValueCommitted(lastChangedValueRef.current ?? newValue, event.nativeEvent);

        if (validationMode === 'onChange') {
          commitValidation(lastChangedValueRef.current ?? newValue);
        }
      }
    },
  );

  const getFingerState = useEventCallback(
    (
      fingerPosition: FingerPosition | null,
      /**
       * When `true`, closestThumbIndexRef is updated.
       * It's `true` when called by touchstart or pointerdown.
       */
      shouldCaptureThumbIndex: boolean = false,
      /**
       * The difference between the value at the finger origin and the value at
       * the center of the thumb scaled down to fit the range [0, 1]
       */
      thumbOffset: number = 0,
    ): FingerState | null => {
      if (fingerPosition == null) {
        return null;
      }

      const control = controlRef.current;

      if (!control) {
        return null;
      }

      const isRtl = direction === 'rtl';
      const isVertical = orientation === 'vertical';

      const { width, height, bottom, left, right } = control.getBoundingClientRect();

      const controlOffset = getControlOffset(controlStylesRef.current, orientation);

      // the value at the finger origin scaled down to fit the range [0, 1]
      let valueRescaled = isVertical
        ? (bottom - controlOffset.end - fingerPosition.y) /
            (height - controlOffset.start - controlOffset.end) +
          thumbOffset
        : (isRtl
            ? right - controlOffset.start - fingerPosition.x
            : fingerPosition.x - left - controlOffset.start) /
            (width - controlOffset.start - controlOffset.end) +
          thumbOffset * (isRtl ? -1 : 1);

      valueRescaled = clamp(valueRescaled, 0, 1);

      let newValue = (max - min) * valueRescaled + min;
      newValue = roundValueToStep(newValue, step, min);
      newValue = clamp(newValue, min, max);

      if (!range) {
        return {
          value: newValue,
          valueRescaled,
          thumbIndex: 0,
        };
      }

      if (shouldCaptureThumbIndex) {
        closestThumbIndexRef.current = getClosestThumbIndex(values, newValue, max) ?? 0;
      }

      const closestThumbIndex = closestThumbIndexRef.current ?? 0;
      const minValueDifference = minStepsBetweenValues * step;

      // Bound the new value to the thumb's neighbours.
      newValue = clamp(
        newValue,
        values[closestThumbIndex - 1] + minValueDifference || -Infinity,
        values[closestThumbIndex + 1] - minValueDifference || Infinity,
      );

      return {
        value: replaceArrayItemAtIndex(values, closestThumbIndex, newValue),
        valueRescaled,
        thumbIndex: closestThumbIndex,
      };
    },
  );

  useEnhancedEffect(() => {
    if (valueProp === undefined || dragging) {
      return;
    }

    if (min >= max) {
      warn('Slider `max` must be greater than `min`');
    }
  }, [dragging, min, max, valueProp]);

  useEnhancedEffect(() => {
    const activeEl = activeElement(ownerDocument(sliderRef.current));
    if (disabled && sliderRef.current?.contains(activeEl)) {
      // This is necessary because Firefox and Safari will keep focus
      // on a disabled element:
      // https://codesandbox.io/p/sandbox/mui-pr-22247-forked-h151h?file=/src/App.js
      // @ts-ignore
      activeEl.blur();
    }
  }, [disabled]);

  if (disabled && active !== -1) {
    setActive(-1);
  }

  const state: SliderRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      activeThumbIndex: active,
      disabled,
      dragging,
      orientation,
      max,
      min,
      minStepsBetweenValues,
      step,
      values,
    }),
    [
      fieldState,
      active,
      disabled,
      dragging,
      max,
      min,
      minStepsBetweenValues,
      orientation,
      step,
      values,
    ],
  );

  const contextValue = React.useMemo(
    () => ({
      active,
      commitValue,
      disabled,
      dragging,
      format,
      getFingerState,
      handleInputChange,
      labelId: ariaLabelledby,
      largeStep,
      lastChangedValueRef,
      max,
      min,
      minStepsBetweenValues,
      name,
      orientation,
      range,
      registerSliderControl,
      setActive,
      setDragging,
      setThumbMap,
      setValue,
      state,
      step,
      tabIndex: externalTabIndex ?? null,
      thumbMap,
      thumbRefs,
      values,
    }),
    [
      active,
      ariaLabelledby,
      commitValue,
      disabled,
      dragging,
      externalTabIndex,
      format,
      getFingerState,
      handleInputChange,
      largeStep,
      lastChangedValueRef,
      max,
      min,
      minStepsBetweenValues,
      name,
      orientation,
      range,
      registerSliderControl,
      setActive,
      setDragging,
      setThumbMap,
      setValue,
      state,
      step,
      thumbMap,
      thumbRefs,
      values,
    ],
  );

  const renderElement = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, sliderRef],
    props: [
      {
        'aria-labelledby': ariaLabelledby,
        id,
        role: 'group',
      },
      getValidationProps(elementProps),
      elementProps,
    ],
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return (
    <SliderRootContext.Provider value={contextValue}>
      <CompositeList elementsRef={thumbRefs} onMapChange={setThumbMap}>
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

export interface FingerState {
  value: number | number[];
  valueRescaled: number;
  thumbIndex: number;
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
    extends BaseUIComponentProps<'div', State> {
    /**
     * The uncontrolled value of the slider when it’s initially rendered.
     *
     * To render a controlled slider, use the `value` prop instead.
     */
    defaultValue?: Value;
    /**
     * Whether the slider should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Options to format the input value.
     */
    format?: Intl.NumberFormatOptions;
    /**
     * The maximum allowed value of the slider.
     * Should not be equal to min.
     * @default 100
     */
    max?: number;
    /**
     * The minimum allowed value of the slider.
     * Should not be equal to max.
     * @default 0
     */
    min?: number;
    /**
     * The minimum steps between values in a range slider.
     * @default 0
     */
    minStepsBetweenValues?: number;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * The component orientation.
     * @default 'horizontal'
     */
    orientation?: Orientation;
    /**
     * The granularity with which the slider can step through values. (A "discrete" slider.)
     * The `min` prop serves as the origin for the valid values.
     * We recommend (max - min) to be evenly divisible by the step.
     * @default 1
     */
    step?: number;
    /**
     * The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down.
     * @default 10
     */
    largeStep?: number;
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
