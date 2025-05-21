'use client';
import * as React from 'react';
import { activeElement } from '@floating-ui/react/utils';
import { clamp } from '../../utils/clamp';
import { ownerDocument } from '../../utils/owner';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useEventCallback } from '../../utils/useEventCallback';
import { useRenderElement } from '../../utils/useRenderElement';
import { valueToPercent } from '../../utils/valueToPercent';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderMapping } from '../root/stateAttributesMapping';
import type { SliderRoot } from '../root/SliderRoot';
import { replaceArrayItemAtIndex } from '../utils/replaceArrayItemAtIndex';
import { roundValueToStep } from '../utils/roundValueToStep';
import { validateMinimumDistance } from '../utils/validateMinimumDistance';

const INTENTIONAL_DRAG_COUNT_THRESHOLD = 2;

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

function getFingerPosition(
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
 * The clickable, interactive part of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export const SliderControl = React.forwardRef(function SliderControl(
  componentProps: SliderControl.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render: renderProp, className, ...elementProps } = componentProps;

  const {
    active: activeThumbIndex,
    disabled,
    dragging,
    lastChangedValueRef,
    max,
    min,
    minStepsBetweenValues,
    onValueCommitted,
    orientation,
    range,
    registerInputValidationRef,
    setActive,
    setDragging,
    setValue,
    state,
    step,
    thumbRefs,
    values,
  } = useSliderRootContext();

  const controlRef = React.useRef<HTMLElement>(null);
  const stylesRef = React.useRef<CSSStyleDeclaration | null>(null);
  const setStylesRef = useEventCallback((element: HTMLElement | null) => {
    if (element && stylesRef.current == null) {
      if (stylesRef.current == null) {
        stylesRef.current = getComputedStyle(element);
      }
    }
  });
  const closestThumbIndexRef = React.useRef<number | null>(null);
  // A number that uniquely identifies the current finger in the touch session.
  const touchIdRef = React.useRef<number | null>(null);
  const moveCountRef = React.useRef(0);
  /**
   * The difference between the value at the finger origin and the value at
   * the center of the thumb scaled down to fit the range [0, 1]
   */
  const offsetRef = React.useRef(0);

  const direction = useDirection();
  const { commitValidation } = useFieldControlValidation();

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

      const controlOffset = getControlOffset(stylesRef.current, orientation);

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

  const focusThumb = useEventCallback((thumbIndex: number) => {
    const control = controlRef.current;
    if (!control) {
      return;
    }

    const activeEl = activeElement(ownerDocument(control));

    if (activeEl == null || !control.contains(activeEl) || activeThumbIndex !== thumbIndex) {
      setActive(thumbIndex);
      thumbRefs.current?.[thumbIndex]
        ?.querySelector<HTMLInputElement>('input[type="range"]')
        ?.focus();
    }
  });

  const handleTouchMove = useEventCallback((nativeEvent: TouchEvent | PointerEvent) => {
    const fingerPosition = getFingerPosition(nativeEvent, touchIdRef);

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

    focusThumb(finger.thumbIndex);

    if (validateMinimumDistance(finger.value, step, minStepsBetweenValues)) {
      if (!dragging && moveCountRef.current > INTENTIONAL_DRAG_COUNT_THRESHOLD) {
        setDragging(true);
      }

      setValue(finger.value, finger.thumbIndex, nativeEvent);
    }
  });

  const handleTouchEnd = useEventCallback((nativeEvent: TouchEvent | PointerEvent) => {
    const fingerPosition = getFingerPosition(nativeEvent, touchIdRef);
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
    onValueCommitted(lastChangedValueRef.current ?? finger.value, nativeEvent);

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

    const fingerPosition = getFingerPosition(nativeEvent, touchIdRef);

    if (fingerPosition != null) {
      const finger = getFingerState(fingerPosition, true);

      if (finger == null) {
        return;
      }

      focusThumb(finger.thumbIndex);
      setValue(finger.value, finger.thumbIndex, nativeEvent);
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
    const control = controlRef.current;
    if (!control) {
      return () => stopListening();
    }

    control.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });

    return () => {
      control.removeEventListener('touchstart', handleTouchStart);

      stopListening();
    };
  }, [stopListening, handleTouchStart, controlRef]);

  React.useEffect(() => {
    if (disabled) {
      stopListening();
    }
  }, [disabled, stopListening]);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, registerInputValidationRef, controlRef, setStylesRef],
    props: [
      {
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

          const fingerPosition = getFingerPosition(event, touchIdRef);

          if (fingerPosition != null) {
            const finger = getFingerState(fingerPosition, true);

            if (finger == null) {
              return;
            }

            focusThumb(finger.thumbIndex);
            setDragging(true);
            // if the event lands on a thumb, don't change the value, just get the
            // percentageValue difference represented by the distance between the click origin
            // and the coordinates of the value on the track area
            if (thumbRefs.current.includes(event.target as HTMLElement)) {
              offsetRef.current =
                valueToPercent(values[finger.thumbIndex], min, max) / 100 - finger.valueRescaled;
            } else {
              setValue(finger.value, finger.thumbIndex, event.nativeEvent);
            }
          }

          moveCountRef.current = 0;
          const doc = ownerDocument(controlRef.current);
          doc.addEventListener('pointermove', handleTouchMove, { passive: true });
          doc.addEventListener('pointerup', handleTouchEnd);
        },
      },
      elementProps,
    ],
    stateAttributesMapping: sliderMapping,
  });

  return element;
});

export interface FingerPosition {
  x: number;
  y: number;
}

interface FingerState {
  value: number | number[];
  valueRescaled: number;
  thumbIndex: number;
}

export namespace SliderControl {
  export interface Props extends BaseUIComponentProps<'div', SliderRoot.State> {}
}
