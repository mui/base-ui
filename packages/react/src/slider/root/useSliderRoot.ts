'use client';
import * as React from 'react';
import { activeElement } from '@floating-ui/react/utils';
import { areArraysEqual } from '../../utils/areArraysEqual';
import { clamp } from '../../utils/clamp';
import { mergeProps } from '../../utils/mergeProps';
import { ownerDocument } from '../../utils/owner';
import type { GenericHTMLProps } from '../../utils/types';
import { useControlled } from '../../utils/useControlled';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useForkRef } from '../../utils/useForkRef';
import { valueToPercent } from '../../utils/valueToPercent';
import { warn } from '../../utils/warn';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useField } from '../../field/useField';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { asc } from '../utils/asc';
import { getSliderValue } from '../utils/getSliderValue';
import { replaceArrayItemAtIndex } from '../utils/replaceArrayItemAtIndex';
import { roundValueToStep } from '../utils/roundValueToStep';
import { ThumbMetadata } from '../thumb/useSliderThumb';
import { useEventCallback } from '../../utils/useEventCallback';

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

function findClosest(values: readonly number[], currentValue: number) {
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

function valueArrayToPercentages(values: number[], min: number, max: number) {
  const output = [];
  for (let i = 0; i < values.length; i += 1) {
    output.push(valueToPercent(values[i], min, max));
  }
  return output;
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

/**
 */
export function useSliderRoot(parameters: useSliderRoot.Parameters): useSliderRoot.ReturnValue {
  const {
    'aria-labelledby': ariaLabelledby,
    defaultValue,
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

  const direction = useDirection();
  const { setControlId, setTouched, setDirty, validityData, validationMode } =
    useFieldRootContext();

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

  const lastChangedValueRef = React.useRef<number | readonly number[] | null>(null);

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

  const range = Array.isArray(valueUnwrapped);

  const values = React.useMemo(() => {
    if (!range) {
      return [clamp(valueUnwrapped as number, min, max)];
    }
    return valueUnwrapped.slice().sort(asc);
  }, [max, min, range, valueUnwrapped]);

  function initializePercentageValues() {
    return valueArrayToPercentages(values, min, max);
  }

  const [percentageValues, setPercentageValues] = React.useState<readonly number[]>(
    initializePercentageValues,
  );

  const setValue = useEventCallback(
    (
      newValue: number | number[],
      newPercentageValues: readonly number[],
      thumbIndex: number,
      event: Event,
    ) => {
      if (Number.isNaN(newValue) || areValuesEqual(newValue, valueUnwrapped)) {
        return;
      }

      setValueUnwrapped(newValue);
      setPercentageValues(newPercentageValues);
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
    if (Array.isArray(value)) {
      const newPercentageValues = valueArrayToPercentages(value, min, max);
      if (!areArraysEqual(newPercentageValues, percentageValues)) {
        setPercentageValues(newPercentageValues);
      }
    } else if (typeof value === 'number') {
      setPercentageValues([valueToPercent(value, min, max)]);
    }
    onValueCommitted(value, event);
  });

  const handleRootRef = useForkRef(rootRef, sliderRef);

  // for keypresses only
  const handleInputChange = useEventCallback(
    (valueInput: number, index: number, event: React.KeyboardEvent | React.ChangeEvent) => {
      const newValue = getSliderValue(valueInput, index, min, max, range, values);

      if (range) {
        focusThumb(index, sliderRef);
      }

      if (validateMinimumDistance(newValue, step, minStepsBetweenValues)) {
        if (Array.isArray(newValue)) {
          setValue(
            newValue,
            replaceArrayItemAtIndex(
              percentageValues,
              index,
              valueToPercent(newValue[index], min, max),
            ),
            index,
            event.nativeEvent,
          );
        } else {
          setValue(newValue, [valueToPercent(newValue, min, max)], index, event.nativeEvent);
        }
        setDirty(newValue !== validityData.initialValue);
        setTouched(true);
        onValueCommitted(lastChangedValueRef.current ?? newValue, event.nativeEvent);

        if (validationMode === 'onChange') {
          commitValidation(lastChangedValueRef.current ?? newValue);
        }
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
      /**
       * The difference between the value at the finger origin and the value at
       * the center of the thumb scaled down to fit the range [0, 1]
       */
      offset: number = 0,
    ): FingerState | null => {
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

      // the value at the finger origin scaled down to fit the range [0, 1]
      let valueRescaled = isVertical
        ? (bottom - fingerPosition.y) / height + offset
        : (fingerPosition.x - left) / width + offset * (isRtl ? -1 : 1);

      valueRescaled = clamp(valueRescaled, 0, 1);

      if (isRtl && !isVertical) {
        valueRescaled = 1 - valueRescaled;
      }

      let newValue = (max - min) * valueRescaled + min;
      newValue = roundValueToStep(newValue, step, min);
      newValue = clamp(newValue, min, max);

      if (!range) {
        return {
          value: newValue,
          valueRescaled,
          percentageValues: [valueRescaled * 100],
          thumbIndex: 0,
        };
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

      return {
        value: replaceArrayItemAtIndex(values, closestThumbIndex, newValue),
        valueRescaled,
        percentageValues: replaceArrayItemAtIndex(
          percentageValues,
          closestThumbIndex,
          valueRescaled * 100,
        ),
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

    if (typeof valueUnwrapped === 'number') {
      const newPercentageValue = valueToPercent(valueUnwrapped, min, max);
      if (newPercentageValue !== percentageValues[0] && !Number.isNaN(newPercentageValue)) {
        setPercentageValues([newPercentageValue]);
      }
    } else if (Array.isArray(valueUnwrapped)) {
      const newPercentageValues = valueArrayToPercentages(valueUnwrapped, min, max);
      if (!areArraysEqual(newPercentageValues, percentageValues)) {
        setPercentageValues(newPercentageValues);
      }
    }
  }, [dragging, min, max, percentageValues, setPercentageValues, valueProp, valueUnwrapped]);

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
      mergeProps(
        {
          'aria-labelledby': ariaLabelledby,
          id,
          ref: handleRootRef,
          role: 'group',
        },
        getValidationProps(externalProps),
      ),
    [ariaLabelledby, getValidationProps, handleRootRef, id],
  );

  return React.useMemo(
    () => ({
      'aria-labelledby': ariaLabelledby,
      active,
      commitValue,
      disabled,
      dragging,
      getFingerState,
      getRootProps,
      handleInputChange,
      largeStep,
      lastChangedValueRef,
      max,
      min,
      minStepsBetweenValues,
      name,
      onValueCommitted,
      orientation,
      percentageValues,
      range,
      registerSliderControl,
      setActive,
      setDragging,
      setPercentageValues,
      setThumbMap,
      setValue,
      step,
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
      getFingerState,
      getRootProps,
      handleInputChange,
      largeStep,
      lastChangedValueRef,
      max,
      min,
      minStepsBetweenValues,
      name,
      onValueCommitted,
      orientation,
      percentageValues,
      range,
      registerSliderControl,
      setActive,
      setDragging,
      setPercentageValues,
      setThumbMap,
      setValue,
      step,
      thumbMap,
      thumbRefs,
      values,
    ],
  );
}

export interface FingerPosition {
  x: number;
  y: number;
}

interface FingerState {
  value: number | number[];
  valueRescaled: number;
  percentageValues: number[];
  thumbIndex: number;
}

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
    defaultValue?: number | readonly number[];
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
     * @param {number | readonly number[]} value The new value.
     * @param {Event} event The corresponding event that initiated the change.
     * You can pull out the new value by accessing `event.target.value` (any).
     * @param {number} activeThumbIndex Index of the currently moved thumb.
     */
    onValueChange: (value: number | number[], event: Event, activeThumbIndex: number) => void;
    /**
     * Callback function that is fired when the `pointerup` is triggered.
     *
     * @param {number | number[]} value The new value.
     * @param {Event} event The corresponding event that initiated the change.
     * **Warning**: This is a generic event not a change event.
     */
    onValueCommitted: (value: number | readonly number[], event: Event) => void;
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
    value?: number | readonly number[];
  }

  export interface ReturnValue {
    /**
     * The index of the active thumb.
     */
    active: number;
    'aria-labelledby'?: string;
    /**
     * Function to be called when drag ends. Invokes onValueCommitted.
     */
    commitValue: (newValue: number | readonly number[], event: Event) => void;
    dragging: boolean;
    disabled: boolean;
    getFingerState: (
      fingerPosition: FingerPosition | null,
      shouldCaptureThumbIndex?: boolean,
      offset?: number,
    ) => FingerState | null;
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    handleInputChange: (
      valueInput: number,
      index: number,
      event: React.KeyboardEvent | React.ChangeEvent,
    ) => void;
    /**
     * The large step value of the slider when incrementing or decrementing while the shift key is held,
     * or when using Page-Up or Page-Down keys. Snaps to multiples of this value.
     * @default 10
     */
    largeStep: number;
    lastChangedValueRef: React.RefObject<number | readonly number[] | null>;
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
    /**
     * The component orientation.
     * @default 'horizontal'
     */
    orientation: Orientation;
    /**
     * The value(s) of the slider as percentages
     */
    percentageValues: readonly number[];
    registerSliderControl: (element: HTMLElement | null) => void;
    setActive: React.Dispatch<React.SetStateAction<number>>;
    setDragging: React.Dispatch<React.SetStateAction<boolean>>;
    setPercentageValues: React.Dispatch<React.SetStateAction<readonly number[]>>;
    setThumbMap: React.Dispatch<
      React.SetStateAction<Map<Node, CompositeMetadata<ThumbMetadata> | null>>
    >;
    /**
     * Callback fired when dragging and invokes onValueChange.
     */
    setValue: (
      newValue: number | number[],
      newPercentageValues: readonly number[],
      activeThumb: number,
      event: Event,
    ) => void;
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
