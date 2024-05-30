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
import {
  Mark,
  SliderThumbMetadata,
  UseSliderParameters,
  UseSliderReturnValue,
} from './SliderRoot.types';

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
  // console.log('focusThumb activeIndex', activeIndex);
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

function setValueIndex({
  values,
  newValue,
  index,
}: {
  values: number[];
  newValue: number;
  index: number;
}) {
  // console.log('setValueIndex activeIndex', index);
  const output = values.slice();
  output[index] = newValue;
  return output;
  // return output.sort(asc);
}

export function trackFinger(
  event: TouchEvent | PointerEvent | React.PointerEvent,
  touchId: React.RefObject<any>,
) {
  // The event is TouchEvent
  if (touchId.current !== undefined && (event as TouchEvent).changedTouches) {
    const touchEvent = event as TouchEvent;
    for (let i = 0; i < touchEvent.changedTouches.length; i += 1) {
      const touch = touchEvent.changedTouches[i];
      if (touch.identifier === touchId.current) {
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

export const Identity = (x: any) => x;

function sortValues(unsortedValues: readonly number[], sortType: 'asc' | 'off') {
  const output = unsortedValues.slice();
  return output.sort((a, b) => {
    if (sortType === 'asc') {
      return a - b;
    }

    return 0;
  });
}
/**
 *
 * API:
 *
 * - [useSliderRoot API](https://mui.com/base-ui/api/use-slider-root/)
 */
function useSliderRoot(parameters: UseSliderParameters): UseSliderReturnValue {
  const {
    'aria-labelledby': ariaLabelledby,
    defaultValue,
    disabled = false,
    disableSwap = false,
    isRtl = false,
    largeStep = 10,
    marks: marksProp,
    max = 100,
    min = 0,
    name,
    onValueChange,
    onValueCommitted,
    orientation = 'horizontal',
    rootRef,
    scale = Identity,
    sort = 'asc',
    step = 1,
    tabIndex,
    value: valueProp,
  } = parameters;

  // We can't use the :active browser pseudo-classes.
  // - The active state isn't triggered when clicking on the rail.
  // - The active state isn't transferred when inversing a range slider.
  const [active, setActive] = React.useState(-1);
  const [open, setOpen] = React.useState(-1);
  const [dragging, setDragging] = React.useState(false);

  const trackRef: React.MutableRefObject<HTMLElement | null> = React.useRef(null);

  const registerSliderTrack = React.useCallback((element: HTMLElement | null) => {
    if (element) {
      trackRef.current = element;
    }
  }, []);

  const [valueState, setValueState] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? min,
    name: 'Slider',
  });

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

      let newValue = value;

      if (Array.isArray(value)) {
        newValue = sortValues(value, sort);
      }

      Object.defineProperty(clonedEvent, 'target', {
        writable: true,
        value: { value: newValue, name },
      });

      onValueChange(newValue, thumbIndex, clonedEvent);
    },
    [name, onValueChange, sort],
  );

  const range = Array.isArray(valueState);

  const unsortedValues = React.useMemo(() => {
    return (range ? valueState.slice() : [valueState]).map((val) =>
      val == null ? min : clamp(val, min, max),
    );
  }, [max, min, range, valueState]);

  const marks = React.useMemo(() => {
    if (marksProp === true && step !== null) {
      return [...Array(Math.floor((max - min) / step) + 1)].map((_, index) => ({
        value: min + step * index,
      }));
    }

    return marksProp ?? [];
  }, [marksProp, max, min, step]);

  const marksValues = (marks as Mark[]).map((mark: Mark) => mark.value);

  const sliderRef = React.useRef<HTMLDivElement>(null);

  const handleRootRef = useForkRef(rootRef, sliderRef);

  const areValuesEqual = React.useCallback(
    (newValue: number | ReadonlyArray<number>): boolean => {
      if (typeof newValue === 'number' && typeof valueState === 'number') {
        return newValue === valueState;
      }
      if (typeof newValue === 'object' && typeof valueState === 'object') {
        // console.log('comparing newValue vs valueState', newValue, valueState);
        return areArraysEqual(newValue, valueState);
      }
      return false;
    },
    [valueState],
  );

  const changeValue = React.useCallback(
    (valueInput: number, index: number, event: React.KeyboardEvent | React.ChangeEvent) => {
      const value = unsortedValues[index];
      const marksIndex = marksValues.indexOf(value);
      let newValue: number | number[] = valueInput;

      if (marks && step == null) {
        const maxMarksValue = marksValues[marksValues.length - 1];
        if (newValue > maxMarksValue) {
          newValue = maxMarksValue;
        } else if (newValue < marksValues[0]) {
          newValue = marksValues[0];
        } else {
          newValue = newValue < value ? marksValues[marksIndex - 1] : marksValues[marksIndex + 1];
        }
      }

      newValue = clamp(newValue, min, max);

      if (range) {
        // Bound the new value to the thumb's neighbours.
        if (disableSwap) {
          newValue = clamp(
            newValue,
            unsortedValues[index - 1] || -Infinity,
            unsortedValues[index + 1] || Infinity,
          );
        }

        // const previousValue = newValue;
        newValue = setValueIndex({
          values: unsortedValues,
          newValue,
          index,
        });

        /* let activeIndex = index;

        // Potentially swap the index if needed.
        if (!disableSwap) {
          activeIndex = newValue.indexOf(previousValue);
        } */

        focusThumb({ sliderRef, activeIndex: index });
      }

      setValueState(newValue);

      if (handleValueChange && !areValuesEqual(newValue)) {
        handleValueChange(newValue, index, event);
      }

      if (onValueCommitted) {
        if (Array.isArray(newValue)) {
          onValueCommitted(sortValues(newValue, sort), event);
        } else {
          onValueCommitted(newValue, event);
        }
      }
    },
    [
      areValuesEqual,
      disableSwap,
      handleValueChange,
      marks,
      marksValues,
      max,
      min,
      onValueCommitted,
      range,
      setValueState,
      sort,
      step,
      unsortedValues,
    ],
  );

  // const previousIndex = React.useRef<number>();
  let axis = orientation;
  if (isRtl && orientation === 'horizontal') {
    axis += '-reverse';
  }

  const getFingerNewValue = React.useCallback(
    ({
      finger,
      offset = 0,
      activeIndex,
    }: {
      finger: { x: number; y: number };
      offset?: number;
      activeIndex?: number;
    }) => {
      const { current: track } = trackRef;
      const { width, height, bottom, left } = track!.getBoundingClientRect();
      let percent;

      if (axis.indexOf('vertical') === 0) {
        percent = (bottom - finger.y) / height + offset;
      } else {
        percent = (finger.x - left) / width + offset;
      }

      if (axis.indexOf('-reverse') !== -1) {
        percent = 1 - percent;
      }

      let newValue;
      newValue = percentToValue(percent, min, max);
      if (step) {
        newValue = roundValueToStep(newValue, step, min);
      } else {
        const closestIndex = findClosest(marksValues, newValue);
        newValue = marksValues[closestIndex!];
      }

      newValue = clamp(newValue, min, max);
      // let activeIndex = 0;
      // console.log('there newValue', newValue);
      // const singleValue = newValue;

      let derivedIndex = 0;

      if (range) {
        // if (!move) {
        //   activeIndex = findClosest(values, newValue)!;
        // } else {
        //   activeIndex = previousIndex.current!;
        // }

        derivedIndex = activeIndex ?? findClosest(unsortedValues, newValue) ?? 0;

        // if (!activeIndex) {
        //   activeIndex = findClosest(values, newValue);
        // }

        // Bound the new value to the thumb's neighbours.
        if (disableSwap) {
          newValue = clamp(
            newValue,
            unsortedValues[derivedIndex - 1] || -Infinity,
            unsortedValues[derivedIndex + 1] || Infinity,
          );
        }

        // const previousValue = newValue;
        // console.log('newValue1', newValue);
        newValue = setValueIndex({
          values: unsortedValues,
          newValue,
          index: derivedIndex,
        });
        // console.log('newValue2', newValue);

        // Potentially swap the index if needed.
        // if (!disableSwap && !move) {
        //   activeIndex = newValue.indexOf(previousValue);
        //   previousIndex.current = activeIndex;
        // }
      }
      // console.log('xxxxxx', newValue, 'activeIndex', activeIndex);
      // console.log('here singleValue', singleValue);

      return {
        newValue,
        activeIndex: activeIndex ?? derivedIndex,
        newPercentageValue: percent,
      };
    },
    [axis, disableSwap, marksValues, max, min, range, step, unsortedValues],
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
      mergeReactProps(externalProps, {
        ref: handleRootRef,
        role: 'group',
        dir: isRtl ? 'rtl' : 'ltr',
        ...externalProps,
      }),
    [handleRootRef, isRtl],
  );

  const sortedValues = React.useMemo(() => {
    return sortValues(unsortedValues, sort);
  }, [unsortedValues, sort]);

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
      disabled,
      getFingerNewValue,
      handleValueChange,
      isRtl,
      largeStep,
      max,
      min,
      name,
      onValueCommitted,
      open,
      orientation,
      registerSliderTrack,
      unsortedPercentageValues: unsortedValues.map((v) => valueToPercent(v, min, max)),
      scale,
      setActive,
      setDragging,
      setOpen,
      setValueState,
      step,
      subitems,
      tabIndex,
      unsortedValues,
      values: sortedValues,
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
      disabled,
      getFingerNewValue,
      handleValueChange,
      isRtl,
      largeStep,
      max,
      min,
      name,
      onValueCommitted,
      open,
      orientation,
      registerSliderTrack,
      scale,
      setActive,
      setDragging,
      setOpen,
      setValueState,
      sortedValues,
      step,
      subitems,
      tabIndex,
      unsortedValues,
    ],
  );
}

export { useSliderRoot };
