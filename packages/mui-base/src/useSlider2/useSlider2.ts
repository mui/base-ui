'use client';
import * as React from 'react';
import { areArraysEqual } from '../utils/areArraysEqual';
import { clamp } from '../utils/clamp';
import { mergeReactProps } from '../utils/mergeReactProps';
import { ownerDocument } from '../utils/owner';
import { useControlled } from '../utils/useControlled';
import { useEventCallback } from '../utils/useEventCallback';
import { useForkRef } from '../utils/useForkRef';
import { useCompoundParent } from '../useCompound';
import { valueToPercent } from './utils';
import { Mark, UseSliderParameters, UseSliderReturnValue } from './useSlider.types';
import { ThumbMetadata } from './useSliderThumb.types';

const INTENTIONAL_DRAG_COUNT_THRESHOLD = 2;

function areValuesEqual(
  newValue: number | ReadonlyArray<number>,
  oldValue: number | ReadonlyArray<number>,
): boolean {
  if (typeof newValue === 'number' && typeof oldValue === 'number') {
    return newValue === oldValue;
  }
  if (typeof newValue === 'object' && typeof oldValue === 'object') {
    return areArraysEqual(newValue, oldValue);
  }
  return false;
}

function asc(a: number, b: number) {
  return a - b;
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

function focusThumb({
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

function getDecimalPrecision(num: number) {
  // This handles the case when num is very small (0.00000001), js will turn this into 1e-8.
  // When num is bigger than 1 or less than -1 it won't get converted to this notation so it's fine.
  if (Math.abs(num) < 1) {
    const parts = num.toExponential().split('e-');
    const matissaDecimalPart = parts[0].split('.')[1];
    return (matissaDecimalPart ? matissaDecimalPart.length : 0) + parseInt(parts[1], 10);
  }

  const decimalPart = num.toString().split('.')[1];
  return decimalPart ? decimalPart.length : 0;
}

function percentToValue(percent: number, min: number, max: number) {
  return (max - min) * percent + min;
}

function roundValueToStep(value: number, step: number, min: number) {
  const nearest = Math.round((value - min) / step) * step + min;
  return Number(nearest.toFixed(getDecimalPrecision(step)));
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
  const output = values.slice();
  output[index] = newValue;
  return output.sort(asc);
}

function trackFinger(
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

// TODO: keep this here if we provide "Track Fill" component(s)
// if not move to Thumb and can probably remove leap/trackLeap too
const axisProps = {
  horizontal: {
    offset: (percent: number) => ({ left: `${percent}%` }),
    leap: (percent: number) => ({ width: `${percent}%` }),
  },
  'horizontal-reverse': {
    offset: (percent: number) => ({ right: `${percent}%` }),
    leap: (percent: number) => ({ width: `${percent}%` }),
  },
  vertical: {
    offset: (percent: number) => ({ bottom: `${percent}%` }),
    leap: (percent: number) => ({ height: `${percent}%` }),
  },
};

export const Identity = (x: any) => x;

function useSlider(parameters: UseSliderParameters): UseSliderReturnValue {
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
    step = 1,
    tabIndex,
    value: valueProp,
  } = parameters;

  // A number that uniquely identifies the current finger in the touch session.
  const touchId = React.useRef<number>();

  const moveCount = React.useRef(0);

  // We can't use the :active browser pseudo-classes.
  // - The active state isn't triggered when clicking on the rail.
  // - The active state isn't transferred when inversing a range slider.
  const [active, setActive] = React.useState(-1);
  const [open, setOpen] = React.useState(-1);
  const [dragging, setDragging] = React.useState(false);

  const [valueState, setValueState] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? min,
    name: 'Slider',
  });

  const { contextValue: compoundComponentContextValue, subitems } = useCompoundParent<
    string,
    ThumbMetadata
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

  const handleRef = useForkRef(rootRef, sliderRef);

  const changeValue = React.useCallback(
    (valueInput: number, index: number, event: React.KeyboardEvent | React.ChangeEvent) => {
      const value = values[index];
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
          newValue = clamp(newValue, values[index - 1] || -Infinity, values[index + 1] || Infinity);
        }

        const previousValue = newValue;
        newValue = setValueIndex({
          values,
          newValue,
          index,
        });

        let activeIndex = index;

        // Potentially swap the index if needed.
        if (!disableSwap) {
          activeIndex = newValue.indexOf(previousValue);
        }

        focusThumb({ sliderRef, activeIndex });
      }

      setValueState(newValue);
      // TODO: don't need this?
      // setFocusedThumbIndex(index);

      if (handleValueChange && !areValuesEqual(newValue, valueState)) {
        handleValueChange(newValue, index, event);
      }

      if (onValueCommitted) {
        onValueCommitted(newValue, event);
      }
    },
    [
      disableSwap,
      handleValueChange,
      marks,
      marksValues,
      max,
      min,
      onValueCommitted,
      range,
      setValueState,
      step,
      valueState,
      values,
    ],
  );

  const previousIndex = React.useRef<number>();
  let axis = orientation;
  if (isRtl && orientation === 'horizontal') {
    axis += '-reverse';
  }

  const getFingerNewValue = React.useCallback(
    ({ finger, move = false }: { finger: { x: number; y: number }; move?: boolean }) => {
      const { current: slider } = sliderRef;
      const { width, height, bottom, left } = slider!.getBoundingClientRect();
      let percent;

      if (axis.indexOf('vertical') === 0) {
        percent = (bottom - finger.y) / height;
      } else {
        percent = (finger.x - left) / width;
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
      let activeIndex = 0;

      if (range) {
        if (!move) {
          activeIndex = findClosest(values, newValue)!;
        } else {
          activeIndex = previousIndex.current!;
        }

        // Bound the new value to the thumb's neighbours.
        if (disableSwap) {
          newValue = clamp(
            newValue,
            values[activeIndex - 1] || -Infinity,
            values[activeIndex + 1] || Infinity,
          );
        }

        const previousValue = newValue;
        newValue = setValueIndex({
          values,
          newValue,
          index: activeIndex,
        });

        // Potentially swap the index if needed.
        if (!(disableSwap && move)) {
          activeIndex = newValue.indexOf(previousValue);
          previousIndex.current = activeIndex;
        }
      }

      return { newValue, activeIndex };
    },
    [axis, disableSwap, marksValues, max, min, range, step, values],
  );

  const handleTouchMove = useEventCallback((nativeEvent: TouchEvent | PointerEvent) => {
    const finger = trackFinger(nativeEvent, touchId);

    if (!finger) {
      return;
    }

    moveCount.current += 1;

    // Cancel move in case some other element consumed a pointerup event and it was not fired.
    // @ts-ignore buttons doesn't not exists on touch event
    if (nativeEvent.type === 'pointermove' && nativeEvent.buttons === 0) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleTouchEnd(nativeEvent);
      return;
    }

    const { newValue, activeIndex } = getFingerNewValue({
      finger,
      move: true,
    });

    focusThumb({ sliderRef, activeIndex, setActive });
    setValueState(newValue);

    if (!dragging && moveCount.current > INTENTIONAL_DRAG_COUNT_THRESHOLD) {
      setDragging(true);
    }

    if (handleValueChange && !areValuesEqual(newValue, valueState)) {
      handleValueChange(newValue, activeIndex, nativeEvent);
    }
  });

  const handleTouchEnd = useEventCallback((nativeEvent: TouchEvent | PointerEvent) => {
    const finger = trackFinger(nativeEvent, touchId);
    setDragging(false);

    if (!finger) {
      return;
    }

    const { newValue } = getFingerNewValue({ finger, move: true });

    setActive(-1);
    if (nativeEvent.type === 'touchend') {
      setOpen(-1);
    }

    if (onValueCommitted) {
      onValueCommitted(newValue, nativeEvent);
    }

    touchId.current = undefined;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    stopListening();
  });

  const handleTouchStart = useEventCallback((nativeEvent: TouchEvent) => {
    if (disabled) {
      return;
    }

    const touch = nativeEvent.changedTouches[0];

    if (touch != null) {
      touchId.current = touch.identifier;
    }

    const finger = trackFinger(nativeEvent, touchId);

    if (finger !== false) {
      const { newValue, activeIndex } = getFingerNewValue({ finger });
      focusThumb({ sliderRef, activeIndex, setActive });

      setValueState(newValue);

      if (handleValueChange && !areValuesEqual(newValue, valueState)) {
        handleValueChange(newValue, activeIndex, nativeEvent);
      }
    }

    moveCount.current = 0;
    const doc = ownerDocument(sliderRef.current);
    doc.addEventListener('touchmove', handleTouchMove, { passive: true });
    doc.addEventListener('touchend', handleTouchEnd, { passive: true });
  });

  const stopListening = React.useCallback(() => {
    const doc = ownerDocument(sliderRef.current);
    doc.removeEventListener('pointermove', handleTouchMove);
    doc.removeEventListener('pointerup', handleTouchEnd);
    doc.removeEventListener('touchmove', handleTouchMove);
    doc.removeEventListener('touchend', handleTouchEnd);
  }, [handleTouchEnd, handleTouchMove]);

  React.useEffect(() => {
    const { current: slider } = sliderRef;
    slider!.addEventListener('touchstart', handleTouchStart, {
      // TODO: check this is ok, all supported browsers in 2024 should support touch-action: none
      passive: true,
    });

    return () => {
      slider!.removeEventListener('touchstart', handleTouchStart);

      stopListening();
    };
  }, [stopListening, handleTouchStart, sliderRef]);

  React.useEffect(() => {
    if (disabled) {
      stopListening();
    }
  }, [disabled, stopListening]);

  const trackOffset = valueToPercent(range ? values[0] : min, min, max);
  const trackLeap = valueToPercent(values[values.length - 1], min, max) - trackOffset;

  const getRootProps: UseSliderReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        ref: handleRef,
      }),
    [handleRef],
  );

  const getTrackProps: UseSliderReturnValue['getTrackProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        onPointerDown(event: React.PointerEvent<HTMLSpanElement>) {
          if (disabled) {
            return;
          }

          if (event.defaultPrevented) {
            return;
          }

          // Only handle left clicks
          if (event.button !== 0) {
            return;
          }

          // Avoid text selection
          event.preventDefault();
          const finger = trackFinger(event, touchId);
          if (finger !== false) {
            const { newValue, activeIndex } = getFingerNewValue({ finger });
            focusThumb({ sliderRef, activeIndex, setActive });

            setValueState(newValue);

            if (handleValueChange && !areValuesEqual(newValue, valueState)) {
              handleValueChange(newValue, activeIndex, event);
            }
          }

          moveCount.current = 0;
          const doc = ownerDocument(sliderRef.current);
          doc.addEventListener('pointermove', handleTouchMove, { passive: true });
          doc.addEventListener('pointerup', handleTouchEnd);
        },
      }),
    [
      disabled,
      getFingerNewValue,
      handleValueChange,
      handleTouchEnd,
      handleTouchMove,
      setValueState,
      valueState,
    ],
  );

  const outputFor = Array.from(subitems.values()).reduce((acc, item) => {
    return `${acc} ${item.id}`;
  }, '');

  const getOutputProps: UseSliderReturnValue['getOutputProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(externalProps, {
        // off by default because it will keep announcing when the slider is being dragged
        // and also when the value is changing (but not yet committed)
        'aria-live': 'off',
        htmlFor: outputFor.trim(),
      });
    },
    [outputFor],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      getTrackProps,
      getOutputProps,
      active,
      ariaLabelledby,
      axis,
      axisProps,
      changeValue,
      compoundComponentContextValue,
      dragging,
      disabled,
      isRtl,
      largeStep,
      max,
      min,
      name,
      open,
      orientation,
      scale,
      setOpen,
      step,
      tabIndex,
      trackOffset,
      trackLeap,
      value: values,
    }),
    [
      getRootProps,
      getTrackProps,
      getOutputProps,
      active,
      ariaLabelledby,
      axis,
      changeValue,
      compoundComponentContextValue,
      dragging,
      disabled,
      isRtl,
      largeStep,
      max,
      min,
      name,
      open,
      orientation,
      scale,
      setOpen,
      step,
      tabIndex,
      trackOffset,
      trackLeap,
      values,
    ],
  );
}

export { useSlider };
