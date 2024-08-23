'use client';
import * as React from 'react';
import { areArraysEqual } from '../../utils/areArraysEqual';
import { clamp } from '../../utils/clamp';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerDocument } from '../../utils/owner';
import { useControlled } from '../../utils/useControlled';
import { useForkRef } from '../../utils/useForkRef';
import { useCompoundParent } from '../../useCompound';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { percentToValue, roundValueToStep, valueToPercent } from '../utils';
import { SliderThumbMetadata, UseSliderParameters, UseSliderReturnValue } from './SliderRoot.types';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import { useId } from '../../utils/useId';
import { useFieldControlValidation } from '../../Field/Control/useFieldControlValidation';
import { asc } from '../utils/asc';
import { setValueIndex } from '../utils/setValueIndex';
import { getSliderValue } from '../utils/getSliderValue';
import { useField } from '../../Field/useField';

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

export function focusThumb({
  sliderRef,
  activeIndex,
  setActive,
}: {
  sliderRef: React.RefObject<any>;
  activeIndex: number;
  setActive?: (num: number) => void;
}) {
  const doc = ownerDocument(sliderRef.current);
  if (
    !sliderRef.current?.contains(doc.activeElement) ||
    Number(doc?.activeElement?.getAttribute('data-index')) !== activeIndex
  ) {
    sliderRef.current?.querySelector(`[type="range"][data-index="${activeIndex}"]`).focus();
  }

  if (setActive) {
    setActive(activeIndex);
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
) {
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

    return false;
  }

  // The event is PointerEvent
  return {
    x: (event as PointerEvent).clientX,
    y: (event as PointerEvent).clientY,
  };
}

/**
 *
 * Demos:
 *
 * - [Slider](https://mui.com/base-ui/react-slider/#hooks)
 *
 * API:
 *
 * - [useSliderRoot API](https://mui.com/base-ui/react-slider/hooks-api/#use-slider-root)
 */
function useSliderRoot(parameters: UseSliderParameters): UseSliderReturnValue {
  const {
    'aria-labelledby': ariaLabelledby,
    id: idProp,
    name,
    defaultValue,
    direction = 'ltr',
    disabled = false,
    largeStep = 10,
    max = 100,
    min = 0,
    minStepsBetweenValues = 0,
    onValueChange,
    onValueCommitted,
    orientation = 'horizontal',
    rootRef,
    step = 1,
    tabIndex,
    value: valueProp,
  } = parameters;

  const { setControlId, setTouched, setDirty, validityData } = useFieldRootContext();

  const {
    getValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

  const [valueState, setValueState] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? min,
    name: 'Slider',
  });

  const controlRef: React.MutableRefObject<HTMLElement | null> = React.useRef(null);

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
  }, [id, setControlId]);

  useField({
    id,
    commitValidation,
    value: valueState,
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

  const { contextValue: compoundComponentContextValue, subitems } = useCompoundParent<
    string,
    SliderThumbMetadata
  >();

  const handleValueChange = React.useCallback(
    (value: number | number[], thumbIndex: number, event: Event | React.SyntheticEvent) => {
      if (!onValueChange) {
        return;
      }

      // Redefine target to allow name and value to be read.
      // This allows seamless integration with the most popular form libraries.
      // https://github.com/mui/material-ui/issues/13485#issuecomment-676048492
      // Clone the event to not override `target` of the original event.
      const nativeEvent = (event as React.SyntheticEvent).nativeEvent || event;
      // @ts-ignore The nativeEvent is function, not object
      const clonedEvent = new nativeEvent.constructor(nativeEvent.type, nativeEvent);

      Object.defineProperty(clonedEvent, 'target', {
        writable: true,
        value: { value, name },
      });

      onValueChange(value, thumbIndex, clonedEvent);
    },
    [name, onValueChange],
  );

  const range = Array.isArray(valueState);

  const values = React.useMemo(() => {
    return (range ? valueState.slice().sort(asc) : [valueState]).map((val) =>
      val == null ? min : clamp(val, min, max),
    );
  }, [max, min, range, valueState]);

  const sliderRef = React.useRef<HTMLDivElement>(null);

  const handleRootRef = useForkRef(rootRef, sliderRef);

  const areValuesEqual = React.useCallback(
    (newValue: number | ReadonlyArray<number>): boolean => {
      if (typeof newValue === 'number' && typeof valueState === 'number') {
        return newValue === valueState;
      }
      if (typeof newValue === 'object' && typeof valueState === 'object') {
        return areArraysEqual(newValue, valueState);
      }
      return false;
    },
    [valueState],
  );

  const changeValue = React.useCallback(
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
        focusThumb({ sliderRef, activeIndex: index });
      }

      if (validateMinimumDistance(newValue, step, minStepsBetweenValues)) {
        setValueState(newValue);
        setDirty(newValue !== validityData.initialValue);

        if (handleValueChange && !areValuesEqual(newValue) && event) {
          handleValueChange(newValue, index, event);
        }

        setTouched(true);
        commitValidation(newValue);

        if (onValueCommitted && event) {
          onValueCommitted(newValue, event.nativeEvent);
        }
      }
    },
    [
      min,
      max,
      range,
      step,
      minStepsBetweenValues,
      values,
      setValueState,
      setDirty,
      validityData.initialValue,
      handleValueChange,
      areValuesEqual,
      onValueCommitted,
      setTouched,
      commitValidation,
    ],
  );

  const isRtl = direction === 'rtl';

  const previousIndexRef = React.useRef<number>();
  let axis = orientation;
  if (isRtl && orientation === 'horizontal') {
    axis += '-reverse';
  }

  const getFingerNewValue = React.useCallback(
    ({
      finger,
      move = false,
      offset = 0,
    }: {
      finger: { x: number; y: number };
      // `move` is used to distinguish between when this is called by touchstart vs touchmove/end
      move?: boolean;
      offset?: number;
    }) => {
      const { current: sliderControl } = controlRef;
      if (!sliderControl) {
        return null;
      }

      const { width, height, bottom, left } = sliderControl!.getBoundingClientRect();
      let percent;

      if (axis.indexOf('vertical') === 0) {
        percent = (bottom - finger.y) / height + offset;
      } else {
        percent = (finger.x - left) / width + offset * (isRtl ? -1 : 1);
      }

      percent = Math.min(percent, 1);

      if (axis.indexOf('-reverse') !== -1) {
        percent = 1 - percent;
      }

      let newValue;
      newValue = percentToValue(percent, min, max);
      if (step) {
        newValue = roundValueToStep(newValue, step, min);
      }

      newValue = clamp(newValue, min, max);
      let activeIndex = 0;

      if (!range) {
        return { newValue, activeIndex, newPercentageValue: percent };
      }

      if (!move) {
        activeIndex = findClosest(values, newValue)!;
      } else {
        activeIndex = previousIndexRef.current!;
      }

      // Bound the new value to the thumb's neighbours.
      newValue = clamp(
        newValue,
        values[activeIndex - 1] + minStepsBetweenValues || -Infinity,
        values[activeIndex + 1] - minStepsBetweenValues || Infinity,
      );

      const previousValue = newValue;
      newValue = setValueIndex({
        values,
        newValue,
        index: activeIndex,
      });

      // Potentially swap the index if needed.
      if (!move) {
        activeIndex = newValue.indexOf(previousValue);
        previousIndexRef.current = activeIndex;
      }

      return { newValue, activeIndex, newPercentageValue: percent };
    },
    [axis, isRtl, max, min, minStepsBetweenValues, range, step, values],
  );

  useEnhancedEffect(() => {
    if (disabled && sliderRef.current!.contains(document.activeElement)) {
      // This is necessary because Firefox and Safari will keep focus
      // on a disabled element:
      // https://codesandbox.io/p/sandbox/mui-pr-22247-forked-h151h?file=/src/App.js
      // @ts-ignore
      document.activeElement?.blur();
    }
  }, [disabled]);

  if (disabled && active !== -1) {
    setActive(-1);
  }

  const getRootProps: UseSliderReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(getValidationProps(externalProps), {
        'aria-labelledby': ariaLabelledby,
        dir: direction,
        ref: handleRootRef,
        role: 'group',
      }),
    [ariaLabelledby, direction, getValidationProps, handleRootRef],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      active,
      areValuesEqual,
      'aria-labelledby': ariaLabelledby,
      axis,
      changeValue,
      compoundComponentContextValue,
      dragging,
      direction,
      disabled,
      getFingerNewValue,
      handleValueChange,
      largeStep,
      max,
      min,
      minStepsBetweenValues,
      name,
      onValueCommitted,
      orientation,
      percentageValues: values.map((v) => valueToPercent(v, min, max)),
      registerSliderControl,
      setActive,
      setDragging,
      setValueState,
      step,
      subitems,
      tabIndex,
      range,
      values,
    }),
    [
      getRootProps,
      active,
      areValuesEqual,
      ariaLabelledby,
      axis,
      changeValue,
      compoundComponentContextValue,
      dragging,
      direction,
      disabled,
      getFingerNewValue,
      handleValueChange,
      largeStep,
      max,
      min,
      minStepsBetweenValues,
      name,
      onValueCommitted,
      orientation,
      registerSliderControl,
      setActive,
      setDragging,
      setValueState,
      step,
      subitems,
      tabIndex,
      range,
      values,
    ],
  );
}

export { useSliderRoot };
