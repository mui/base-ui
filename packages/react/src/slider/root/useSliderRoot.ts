'use client';
import * as React from 'react';
import { activeElement } from '@floating-ui/react/utils';
import { areArraysEqual } from '../../utils/areArraysEqual';
import { clamp } from '../../utils/clamp';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerDocument } from '../../utils/owner';
import { useControlled } from '../../utils/useControlled';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { useForkRef } from '../../utils/useForkRef';
import { valueToPercent } from '../../utils/valueToPercent';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import type { TextDirection } from '../../direction-provider/DirectionContext';
import { useField } from '../../field/useField';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { asc } from '../utils/asc';
import { getSliderValue } from '../utils/getSliderValue';
import { percentToValue } from '../utils/percentToValue';
import { roundValueToStep } from '../utils/roundValueToStep';
import { setValueIndex } from '../utils/setValueIndex';
import { ThumbMetadata } from '../thumb/useSliderThumb';

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

function findClosest(values: number[], currentValue: number) {
  const { index: closestIndex } =
    values.reduce<{ distance: number; index: number } | null>(
      (acc, value: number, index: number) => {
        const distance = Math.abs(currentValue - value);

        if (acc === null || distance < acc.distance || distance === acc.distance) {
          return {
            distance,
            index,
          };
        }

        return acc;
      },
      null,
    ) ?? {};
  return closestIndex;
}

export function focusThumb(
  thumbIndex: number,
  sliderRef: React.RefObject<HTMLElement | null>,
  setActive?: useSliderRoot.ReturnValue['setActive'],
) {
  if (!sliderRef.current) {
    return;
  }

  const doc = ownerDocument(sliderRef.current);

  if (
    !sliderRef.current.contains(doc.activeElement) ||
    Number(doc?.activeElement?.getAttribute('data-index')) !== thumbIndex
  ) {
    (
      sliderRef.current.querySelector(
        `[type="range"][data-index="${thumbIndex}"]`,
      ) as HTMLInputElement
    ).focus();
  }

  if (setActive) {
    setActive(thumbIndex);
  }
}

export function validateMinimumDistance(
  values: number | readonly number[],
  step: number,
  minStepsBetweenValues: number,
) {
  if (!Array.isArray(values)) {
    return true;
  }

  const distances = values.reduce((acc: number[], val, index, vals) => {
    if (index === vals.length - 1) {
      return acc;
    }

    acc.push(Math.abs(val - vals[index + 1]));

    return acc;
  }, []);

  return Math.min(...distances) >= step * minStepsBetweenValues;
}

export function trackFinger(
  event: TouchEvent | PointerEvent | React.PointerEvent,
  touchIdRef: React.RefObject<any>,
): FingerPosition | null {
  // The event is TouchEvent
  if (touchIdRef.current !== undefined && (event as TouchEvent).changedTouches) {
    const touchEvent = event as TouchEvent;
    for (let i = 0; i < touchEvent.changedTouches.length; i += 1) {
      const touch = touchEvent.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        return {
          x: touch.clientX,
          y: touch.clientY,
        };
      }
    }

    return null;
  }

  // The event is PointerEvent
  return {
    x: (event as PointerEvent).clientX,
    y: (event as PointerEvent).clientY,
  };
}

/**
 */
export function useSliderRoot(parameters: useSliderRoot.Parameters): useSliderRoot.ReturnValue {
  const {
    'aria-labelledby': ariaLabelledby,
    defaultValue,
    direction = 'ltr',
    disabled = false,
    id,
    largeStep = 10,
    max = 100,
    min = 0,
    minStepsBetweenValues = 0,
    name,
    onValueChange,
    onValueCommitted,
    orientation = 'horizontal',
    rootRef,
    step = 1,
    value: valueProp,
  } = parameters;

  const { setControlId, setTouched, setDirty, validityData } = useFieldRootContext();

  const {
    getValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

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

  // We can't use the :active browser pseudo-classes.
  // - The active state isn't triggered when clicking on the rail.
  // - The active state isn't transferred when inversing a range slider.
  const [active, setActive] = React.useState(-1);

  const [dragging, setDragging] = React.useState(false);

  const registerSliderControl = React.useCallback(
    (element: HTMLElement | null) => {
      if (element) {
        controlRef.current = element;
        inputValidationRef.current = element.querySelector<HTMLInputElement>('input[type="range"]');
      }
    },
    [inputValidationRef],
  );

  const setValue = useEventCallback(
    (newValue: number | readonly number[], thumbIndex: number, event: Event) => {
      if (areValuesEqual(newValue, valueUnwrapped)) {
        return;
      }

      setValueUnwrapped(newValue);

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

      onValueChange(newValue, clonedEvent, thumbIndex);
    },
  );

  const range = Array.isArray(valueUnwrapped);

  const values = React.useMemo(() => {
    return (range ? valueUnwrapped.slice().sort(asc) : [valueUnwrapped]).map((val) =>
      val == null ? min : clamp(val, min, max),
    );
  }, [max, min, range, valueUnwrapped]);

  const handleRootRef = useForkRef(rootRef, sliderRef);

  const handleInputChange = useEventCallback(
    (valueInput: number, index: number, event: React.KeyboardEvent | React.ChangeEvent) => {
      const newValue = getSliderValue({
        valueInput,
        min,
        max,
        index,
        range,
        values,
      });

      if (range) {
        focusThumb(index, sliderRef);
      }

      if (validateMinimumDistance(newValue, step, minStepsBetweenValues)) {
        setValue(newValue, index, event.nativeEvent);
        setDirty(newValue !== validityData.initialValue);
        setTouched(true);
        commitValidation(newValue);
        onValueCommitted(newValue, event.nativeEvent);
      }
    },
  );

  const closestThumbIndexRef = React.useRef<number | null>(null);

  const getFingerState = useEventCallback(
    (
      fingerPosition: FingerPosition | null,

      /**
       * When `true`, closestThumbIndexRef is updated.
       * It's `true` when called by touchstart or pointerdown.
       */
      shouldCaptureThumbIndex: boolean = false,
      offset: number = 0,
    ) => {
      if (fingerPosition == null) {
        return null;
      }

      const { current: sliderControl } = controlRef;

      if (!sliderControl) {
        return null;
      }

      const isRtl = direction === 'rtl';
      const isVertical = orientation === 'vertical';

      const { width, height, bottom, left } = sliderControl.getBoundingClientRect();
      let percent;

      if (isVertical) {
        percent = (bottom - fingerPosition.y) / height + offset;
      } else {
        percent = (fingerPosition.x - left) / width + offset * (isRtl ? -1 : 1);
      }

      percent = Math.min(percent, 1);

      if (isRtl && !isVertical) {
        percent = 1 - percent;
      }

      let newValue;
      newValue = percentToValue(percent, min, max);
      if (step) {
        newValue = roundValueToStep(newValue, step, min);
      }

      newValue = clamp(newValue, min, max);

      if (!range) {
        return { value: newValue, percentageValue: percent, closestThumbIndex: 0 };
      }

      if (shouldCaptureThumbIndex) {
        closestThumbIndexRef.current = findClosest(values, newValue) ?? 0;
      }

      const closestThumbIndex = closestThumbIndexRef.current ?? 0;

      // Bound the new value to the thumb's neighbours.
      newValue = clamp(
        newValue,
        values[closestThumbIndex - 1] + minStepsBetweenValues || -Infinity,
        values[closestThumbIndex + 1] - minStepsBetweenValues || Infinity,
      );

      newValue = setValueIndex({
        values,
        newValue,
        index: closestThumbIndex,
      });

      return { value: newValue, percentageValue: percent, closestThumbIndex };
    },
  );

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

  const getRootProps: useSliderRoot.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(getValidationProps(externalProps), {
        'aria-labelledby': ariaLabelledby,
        id,
        ref: handleRootRef,
        role: 'group',
      }),
    [ariaLabelledby, getValidationProps, handleRootRef, id],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      'aria-labelledby': ariaLabelledby,
      active,
      direction,
      disabled,
      dragging,
      getFingerState,
      handleInputChange,
      largeStep,
      max,
      min,
      minStepsBetweenValues,
      name,
      onValueCommitted,
      orientation,
      percentageValues: values.map((v) => valueToPercent(v, min, max)),
      range,
      registerSliderControl,
      setActive,
      setDragging,
      setThumbMap,
      setValue,
      step,
      thumbMap,
      thumbRefs,
      values,
    }),
    [
      getRootProps,
      active,
      ariaLabelledby,
      direction,
      disabled,
      dragging,
      getFingerState,
      handleInputChange,
      largeStep,
      max,
      min,
      minStepsBetweenValues,
      name,
      onValueCommitted,
      orientation,
      range,
      registerSliderControl,
      setActive,
      setDragging,
      setThumbMap,
      setValue,
      step,
      thumbMap,
      thumbRefs,
      values,
    ],
  );
}

export type FingerPosition = {
  x: number;
  y: number;
};

export namespace useSliderRoot {
  export type Orientation = 'horizontal' | 'vertical';

  export interface Parameters {
    /**
     * The id of the slider element.
     */
    id: string;
    /**
     * The id of the element containing a label for the slider.
     */
    'aria-labelledby': string;
    /**
     * The default value. Use when the component is not controlled.
     */
    defaultValue?: number | ReadonlyArray<number>;
    /**
     * Sets the direction. For right-to-left languages, the lowest value is on the right-hand side.
     * @default 'ltr'
     */
    direction: TextDirection;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled: boolean;
    /**
     * The maximum allowed value of the slider.
     * Should not be equal to min.
     * @default 100
     */
    max: number;
    /**
     * The minimum allowed value of the slider.
     * Should not be equal to max.
     * @default 0
     */
    min: number;
    /**
     * The minimum steps between values in a range slider.
     * @default 0
     */
    minStepsBetweenValues: number;
    /**
     * Identifies the field when a form is submitted.
     */
    name: string;
    /**
     * Callback function that is fired when the slider's value changed.
     *
     * @param {number | number[]} value The new value.
     * @param {Event} event The corresponding event that initiated the change.
     * You can pull out the new value by accessing `event.target.value` (any).
     * @param {number} activeThumbIndex Index of the currently moved thumb.
     */
    onValueChange: (
      value: number | readonly number[],
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
    onValueCommitted: (value: number | number[], event: Event) => void;
    /**
     * The component orientation.
     * @default 'horizontal'
     */
    orientation: Orientation;
    /**
     * The ref attached to the root of the Slider.
     */
    rootRef: React.Ref<HTMLElement>;
    /**
     * The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down.
     * @default 10
     */
    largeStep: number;
    /**
     * The granularity with which the slider can step through values. (A "discrete" slider.)
     * The `min` prop serves as the origin for the valid values.
     * We recommend (max - min) to be evenly divisible by the step.
     * @default 1
     */
    step: number;
    /**
     * The value of the slider.
     * For ranged sliders, provide an array with two values.
     */
    value?: number | ReadonlyArray<number>;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'div'>,
    ) => React.ComponentPropsWithRef<'div'>;
    /**
     * The index of the active thumb.
     */
    active: number;
    'aria-labelledby'?: string;
    handleInputChange: (
      valueInput: number,
      index: number,
      event: React.KeyboardEvent | React.ChangeEvent,
    ) => void;
    dragging: boolean;
    direction: TextDirection;
    disabled: boolean;
    getFingerState: (
      fingerPosition: FingerPosition | null,
      move?: boolean,
      offset?: number,
    ) => {
      value: number | number[];
      percentageValue: number;
      closestThumbIndex: number;
    } | null;
    /**
     * Callback to invoke change handlers after internal value state is updated.
     */
    setValue: (newValue: number | readonly number[], activeThumb: number, event: Event) => void;
    /**
     * The large step value of the slider when incrementing or decrementing while the shift key is held,
     * or when using Page-Up or Page-Down keys. Snaps to multiples of this value.
     * @default 10
     */
    largeStep: number;
    /**
     * The maximum allowed value of the slider.
     */
    max: number;
    /**
     * The minimum allowed value of the slider.
     */
    min: number;
    /**
     * The minimum steps between values in a range slider.
     */
    minStepsBetweenValues: number;
    name: string;
    onValueCommitted: (value: number | number[], event: Event) => void;
    /**
     * The component orientation.
     * @default 'horizontal'
     */
    orientation: Orientation;
    registerSliderControl: (element: HTMLElement | null) => void;
    /**
     * The value(s) of the slider as percentages
     */
    percentageValues: readonly number[];
    setActive: (activeIndex: number) => void;
    setDragging: (isDragging: boolean) => void;
    setThumbMap: (map: Map<Node, CompositeMetadata<ThumbMetadata> | null>) => void;
    /**
     * The step increment of the slider when incrementing or decrementing. It will snap
     * to multiples of this value. Decimal values are supported.
     * @default 1
     */
    step: number;
    thumbMap: Map<Node, CompositeMetadata<ThumbMetadata> | null>;
    thumbRefs: React.MutableRefObject<(HTMLElement | null)[]>;
    /**
     * The value(s) of the slider
     */
    values: readonly number[];
  }
}
