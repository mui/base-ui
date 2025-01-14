'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerDocument } from '../../utils/owner';
import type { GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { useEventCallback } from '../../utils/useEventCallback';
import {
  focusThumb,
  SliderValue,
  validateMinimumDistance,
  type FingerPosition,
  type useSliderRoot,
} from '../root/useSliderRoot';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';

const INTENTIONAL_DRAG_COUNT_THRESHOLD = 2;

function trackFinger(
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

export function useSliderControl<Value extends number | readonly number[]>(
  parameters: useSliderControl.Parameters<Value>,
): useSliderControl.ReturnValue {
  const {
    disabled,
    dragging,
    getFingerState,
    lastChangedValueRef,
    minStepsBetweenValues,
    onValueCommitted,
    percentageValues,
    registerSliderControl,
    rootRef: externalRef,
    setActive,
    setDragging,
    setValue,
    step,
    thumbRefs,
  } = parameters;

  const { commitValidation } = useFieldControlValidation();

  const controlRef = React.useRef<HTMLElement>(null);

  const handleRootRef = useForkRef(externalRef, registerSliderControl, controlRef);

  // A number that uniquely identifies the current finger in the touch session.
  const touchIdRef = React.useRef<number | null>(null);
  const moveCountRef = React.useRef(0);
  /**
   * The difference between the value at the finger origin and the value at
   * the center of the thumb scaled down to fit the range [0, 1]
   */
  const offsetRef = React.useRef(0);

  const handleTouchMove = useEventCallback((nativeEvent: TouchEvent | PointerEvent) => {
    const fingerPosition = trackFinger(nativeEvent, touchIdRef);

    if (fingerPosition == null) {
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

    const finger = getFingerState(fingerPosition, false, offsetRef.current);

    if (finger == null) {
      return;
    }

    focusThumb(finger.thumbIndex, controlRef, setActive);

    if (validateMinimumDistance(finger.value, step, minStepsBetweenValues)) {
      if (!dragging && moveCountRef.current > INTENTIONAL_DRAG_COUNT_THRESHOLD) {
        setDragging(true);
      }

      setValue(
        finger.value as SliderValue<Value>,
        finger.percentageValues,
        finger.thumbIndex,
        nativeEvent,
      );
    }
  });

  const handleTouchEnd = useEventCallback((nativeEvent: TouchEvent | PointerEvent) => {
    const fingerPosition = trackFinger(nativeEvent, touchIdRef);
    setDragging(false);

    if (fingerPosition == null) {
      return;
    }

    const finger = getFingerState(fingerPosition, false);

    if (finger == null) {
      return;
    }

    setActive(-1);

    commitValidation(lastChangedValueRef.current ?? finger.value);

    onValueCommitted(
      lastChangedValueRef.current ?? (finger.value as SliderValue<Value>),
      nativeEvent,
    );

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

    const fingerPosition = trackFinger(nativeEvent, touchIdRef);

    if (fingerPosition != null) {
      const finger = getFingerState(fingerPosition, true);

      if (finger == null) {
        return;
      }

      focusThumb(finger.thumbIndex, controlRef, setActive);

      setValue(
        finger.value as SliderValue<Value>,
        finger.percentageValues,
        finger.thumbIndex,
        nativeEvent,
      );
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
        onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
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

          const fingerPosition = trackFinger(event, touchIdRef);

          if (fingerPosition != null) {
            const finger = getFingerState(fingerPosition, true);

            if (finger == null) {
              return;
            }

            focusThumb(finger.thumbIndex, controlRef, setActive);

            // if the event lands on a thumb, don't change the value, just get the
            // percentageValue difference represented by the distance between the click origin
            // and the coordinates of the value on the track area
            if (thumbRefs.current.includes(event.target as HTMLElement)) {
              offsetRef.current = percentageValues[finger.thumbIndex] / 100 - finger.valueRescaled;
            } else {
              setValue(
                finger.value as SliderValue<Value>,
                finger.percentageValues,
                finger.thumbIndex,
                event.nativeEvent,
              );
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
      disabled,
      getFingerState,
      handleRootRef,
      handleTouchMove,
      handleTouchEnd,
      setValue,
      percentageValues,
      setActive,
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

export namespace useSliderControl {
  export interface Parameters<Value>
    extends Pick<
      useSliderRoot.ReturnValue<Value>,
      | 'disabled'
      | 'dragging'
      | 'getFingerState'
      | 'lastChangedValueRef'
      | 'minStepsBetweenValues'
      | 'onValueCommitted'
      | 'percentageValues'
      | 'registerSliderControl'
      | 'setActive'
      | 'setDragging'
      | 'setValue'
      | 'step'
      | 'thumbRefs'
    > {
    /**
     * The ref attached to the control area of the Slider.
     */
    rootRef?: React.Ref<Element>;
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
