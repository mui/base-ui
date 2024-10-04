'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerDocument } from '../../utils/owner';
import { useForkRef } from '../../utils/useForkRef';
import { useEventCallback } from '../../utils/useEventCallback';
import { focusThumb, trackFinger, validateMinimumDistance } from '../Root/useSliderRoot';
import { UseSliderControlParameters, UseSliderControlReturnValue } from './SliderControl.types';
import { useFieldControlValidation } from '../../Field/Control/useFieldControlValidation';

const INTENTIONAL_DRAG_COUNT_THRESHOLD = 2;

export function useSliderControl(
  parameters: UseSliderControlParameters,
): UseSliderControlReturnValue {
  const {
    areValuesEqual,
    disabled,
    dragging,
    getFingerNewValue,
    handleValueChange,
    onValueCommitted,
    minStepsBetweenValues,
    percentageValues,
    registerSliderControl,
    rootRef: externalRef,
    setActive,
    setDragging,
    setValueState,
    step,
    subitems,
  } = parameters;

  const { commitValidation } = useFieldControlValidation();

  const controlRef = React.useRef<HTMLElement>(null);

  const handleRootRef = useForkRef(externalRef, registerSliderControl, controlRef);

  // A number that uniquely identifies the current finger in the touch session.
  const touchIdRef = React.useRef<number | null>(null);

  const moveCountRef = React.useRef(0);

  // offset distance between:
  // 1. pointerDown coordinates and
  // 2. the exact intersection of the center of the thumb and the track
  const offsetRef = React.useRef(0);

  const thumbRefs = React.useMemo(() => {
    return Array.from(subitems).map((subitem) => {
      const { ref } = subitem[1];
      return ref.current;
    });
  }, [subitems]);

  const handleTouchMove = useEventCallback((nativeEvent: TouchEvent | PointerEvent) => {
    const finger = trackFinger(nativeEvent, touchIdRef);

    if (!finger) {
      return;
    }

    moveCountRef.current += 1;

    // Cancel move in case some other element consumed a pointerup event and it was not fired.
    // @ts-ignore buttons doesn't not exists on touch event
    if (nativeEvent.type === 'pointermove' && nativeEvent.buttons === 0) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleTouchEnd(nativeEvent);
      return;
    }

    const newFingerValue = getFingerNewValue({
      finger,
      move: true,
      offset: offsetRef.current,
    });

    if (!newFingerValue) {
      return;
    }

    const { newValue, activeIndex } = newFingerValue;

    focusThumb({ sliderRef: controlRef, activeIndex, setActive });

    if (validateMinimumDistance(newValue, step, minStepsBetweenValues)) {
      setValueState(newValue);

      if (!dragging && moveCountRef.current > INTENTIONAL_DRAG_COUNT_THRESHOLD) {
        setDragging(true);
      }

      if (handleValueChange && !areValuesEqual(newValue)) {
        handleValueChange(newValue, activeIndex, nativeEvent);
      }
    }
  });

  const handleTouchEnd = useEventCallback((nativeEvent: TouchEvent | PointerEvent) => {
    const finger = trackFinger(nativeEvent, touchIdRef);
    setDragging(false);

    if (!finger) {
      return;
    }

    const newFingerValue = getFingerNewValue({
      finger,
      move: true,
    });

    if (!newFingerValue) {
      return;
    }

    setActive(-1);

    commitValidation(newFingerValue.newValue);

    if (onValueCommitted) {
      onValueCommitted(newFingerValue.newValue, nativeEvent);
    }

    touchIdRef.current = null;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    stopListening();
  });

  const handleTouchStart = useEventCallback((nativeEvent: TouchEvent) => {
    if (disabled) {
      return;
    }

    const touch = nativeEvent.changedTouches[0];

    if (touch != null) {
      touchIdRef.current = touch.identifier;
    }

    const finger = trackFinger(nativeEvent, touchIdRef);

    if (finger !== false) {
      const newFingerValue = getFingerNewValue({
        finger,
      });

      if (!newFingerValue) {
        return;
      }
      const { newValue, activeIndex } = newFingerValue;

      focusThumb({ sliderRef: controlRef, activeIndex, setActive });

      setValueState(newValue);

      if (handleValueChange && !areValuesEqual(newValue)) {
        handleValueChange(newValue, activeIndex, nativeEvent);
      }
    }

    moveCountRef.current = 0;
    const doc = ownerDocument(controlRef.current);
    doc.addEventListener('touchmove', handleTouchMove, { passive: true });
    doc.addEventListener('touchend', handleTouchEnd, { passive: true });
  });

  const stopListening = useEventCallback(() => {
    offsetRef.current = 0;
    const doc = ownerDocument(controlRef.current);
    doc.removeEventListener('pointermove', handleTouchMove);
    doc.removeEventListener('pointerup', handleTouchEnd);
    doc.removeEventListener('touchmove', handleTouchMove);
    doc.removeEventListener('touchend', handleTouchEnd);
  });

  React.useEffect(() => {
    const { current: sliderControl } = controlRef;

    if (!sliderControl) {
      return () => stopListening();
    }

    sliderControl.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });

    return () => {
      sliderControl.removeEventListener('touchstart', handleTouchStart);

      stopListening();
    };
  }, [stopListening, handleTouchStart, controlRef]);

  React.useEffect(() => {
    if (disabled) {
      stopListening();
    }
  }, [disabled, stopListening]);

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(externalProps, {
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

          const finger = trackFinger(event, touchIdRef);

          if (finger !== false) {
            const newFingerValue = getFingerNewValue({
              finger,
            });

            if (!newFingerValue) {
              return;
            }

            const { newValue, activeIndex, newPercentageValue } = newFingerValue;

            focusThumb({ sliderRef: controlRef, activeIndex, setActive });

            // if the event lands on a thumb, don't change the value, just get the
            // percentageValue difference represented by the distance between the click origin
            // and the coordinates of the value on the track area
            if (thumbRefs.includes(event.target as HTMLElement)) {
              const targetThumbIndex = (event.target as HTMLElement).getAttribute('data-index');

              const offset = percentageValues[Number(targetThumbIndex)] / 100 - newPercentageValue;

              offsetRef.current = offset;
            } else {
              setValueState(newValue);

              if (handleValueChange && !areValuesEqual(newValue)) {
                handleValueChange(newValue, activeIndex, event);
              }
            }
          }

          moveCountRef.current = 0;
          const doc = ownerDocument(controlRef.current);
          doc.addEventListener('pointermove', handleTouchMove, { passive: true });
          doc.addEventListener('pointerup', handleTouchEnd);
        },
        ref: handleRootRef,
      });
    },
    [
      areValuesEqual,
      disabled,
      getFingerNewValue,
      handleRootRef,
      handleTouchMove,
      handleTouchEnd,
      handleValueChange,
      percentageValues,
      setActive,
      setValueState,
      thumbRefs,
    ],
  );

  return React.useMemo(
    () => ({
      getRootProps,
    }),
    [getRootProps],
  );
}
