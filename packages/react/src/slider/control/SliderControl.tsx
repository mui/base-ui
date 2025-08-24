'use client';
import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { clamp } from '../../utils/clamp';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { valueToPercent } from '../../utils/valueToPercent';
import { useDirection } from '../../direction-provider/DirectionContext';
import type { Coords } from '../../floating-ui-react';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStyleHookMapping } from '../root/styleHooks';
import type { SliderRoot } from '../root/SliderRoot';
import { replaceArrayItemAtIndex } from '../utils/replaceArrayItemAtIndex';
import { roundValueToStep } from '../utils/roundValueToStep';
import { validateMinimumDistance } from '../utils/validateMinimumDistance';

const INTENTIONAL_DRAG_COUNT_THRESHOLD = 2;

function getThumbMidpoint(element: HTMLElement, axis: 'x' | 'y') {
  const rect = element.getBoundingClientRect();
  return {
    x: (rect.left + rect.right) / 2,
    y: (rect.top + rect.bottom) / 2,
  }[axis];
}

function findClosestThumbIndex(
  fingerPosition: Coords,
  elem: HTMLElement | null,
  orientation: Orientation,
  range: boolean,
  thumbRefs: React.RefObject<(HTMLElement | null)[]>,
  values: readonly number[],
  max: number,
) {
  if (elem == null) {
    return -1;
  }

  if (!range) {
    return 0;
  }

  const eventLandedOnThumb = thumbRefs.current.includes(elem);
  if (eventLandedOnThumb) {
    const thumbIndex = thumbRefs.current.indexOf(elem);
    console.log('landed on thumb');
    if (thumbIndex === 0) {
      return thumbIndex;
    }

    // handle thumbs that overlap at max, the lowest index thumb has to be
    // dragged first or it will block higher index thumbs from moving
    // otherwise higher index thumbs will be closest by default when their
    // values are identical
    for (let i = thumbIndex; i >= 0; i -= 1) {
      const prevIndex = i - 1;
      if (values[prevIndex] !== max) {
        return i;
      }
    }
  }

  console.log('landed on control');
  // horizontal slider:
  // - controlRect.left
  // - fingerPosition.x
  // - thumbRectMidpointX = (thumbRect.right - thumbRect.left) / 2

  // vertical slider:
  // - controlRect.???
  // - fingerPosition.y
  // - thumbRectMidpointY = (thumbRect.bottom - thumbRect.top) / 2

  const axis = orientation === 'horizontal' ? 'x' : 'y';
  const fingerCoordinate = fingerPosition[axis];

  let closestIndex = -1;
  let minDistance;

  for (let i = 0; i < thumbRefs.current.length; i += 1) {
    const item = thumbRefs.current[i];
    if (isElement(item)) {
      const midpoint = getThumbMidpoint(item, axis);
      const distance = Math.abs(fingerCoordinate - midpoint);

      if (minDistance === undefined || distance <= minDistance) {
        closestIndex = i;
        minDistance = distance;
      }
    }
  }
  return closestIndex;
}

// DEPRECATE
// function legacy_getClosestThumbIndex(values: readonly number[], currentValue: number, max: number) {
//   let closestIndex;
//   let minDistance;
//   for (let i = 0; i < values.length; i += 1) {
//     const distance = Math.abs(currentValue - values[i]);
//     if (
//       minDistance === undefined ||
//       // when the value is at max, the lowest index thumb has to be dragged
//       // first or it will block higher index thumbs from moving
//       // otherwise consider higher index thumbs to be closest when their values are identical
//       (values[i] === max ? distance < minDistance : distance <= minDistance)
//     ) {
//       closestIndex = i;
//       minDistance = distance;
//     }
//   }

//   return closestIndex;
// }

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
): Coords | null {
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
    disabled,
    dragging,
    fieldControlValidation,
    inset,
    lastChangedValueRef,
    max,
    min,
    minStepsBetweenValues,
    onValueCommitted,
    orientation,
    registerFieldControlRef,
    setActive,
    setDragging,
    setValue,
    state,
    step,
    thumbRefs,
    values,
  } = useSliderRootContext();

  const range = values.length > 1;

  const controlRef = React.useRef<HTMLElement>(null);
  const stylesRef = React.useRef<CSSStyleDeclaration | null>(null);
  const setStylesRef = useEventCallback((element: HTMLElement | null) => {
    if (element && stylesRef.current == null) {
      if (stylesRef.current == null) {
        stylesRef.current = getComputedStyle(element);
      }
    }
  });
  // A number that uniquely identifies the current finger in the touch session.
  const touchIdRef = React.useRef<number | null>(null);
  const moveCountRef = React.useRef(0);
  /**
   * The difference between the value at the finger origin and the value at
   * the center of the thumb scaled down to fit the range [0, 1]
   */
  const thumbCenterOffsetRef = React.useRef(0);
  // The offset amount to each side of the control for inset sliders.
  // This value should be equal to the radius or half the width/height of the thumb.
  const insetThumbOffsetRef = React.useRef(0);

  const activeThumbIndexRef = React.useRef<number>(-1);

  const direction = useDirection();

  const getFingerState = useEventCallback(
    (
      fingerPosition: Coords | null,
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
      const adjustedControlWidth =
        width - controlOffset.start - insetThumbOffsetRef.current * 2 - controlOffset.end;
      const adjustedControlHeight =
        height - controlOffset.start - insetThumbOffsetRef.current * 2 - controlOffset.end;
      console.log(
        'control width',
        width,
        'insetThumbOffset',
        insetThumbOffsetRef.current,
        'adjusted width',
        adjustedControlWidth,
      );

      // the value at the finger origin scaled down to fit the range [0, 1]
      let valueRescaled = isVertical
        ? (bottom - controlOffset.end - fingerPosition.y) / adjustedControlHeight + thumbOffset
        : (isRtl
            ? right - controlOffset.start - fingerPosition.x
            : fingerPosition.x - left - controlOffset.start) /
            adjustedControlWidth +
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

      const minValueDifference = minStepsBetweenValues * step;

      // Bound the new value to the thumb's neighbours.
      newValue = clamp(
        newValue,
        values[activeThumbIndexRef.current - 1] + minValueDifference || -Infinity,
        values[activeThumbIndexRef.current + 1] - minValueDifference || Infinity,
      );

      return {
        value: replaceArrayItemAtIndex(values, activeThumbIndexRef.current, newValue),
        valueRescaled,
        thumbIndex: activeThumbIndexRef.current,
      };
    },
  );

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

    const finger = getFingerState(fingerPosition, thumbCenterOffsetRef.current);

    if (finger == null) {
      return;
    }

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

    const finger = getFingerState(fingerPosition, 0);

    activeThumbIndexRef.current = -1;
    insetThumbOffsetRef.current = 0;

    if (finger == null) {
      return;
    }

    setActive(-1);

    thumbRefs.current?.[finger.thumbIndex]?.focus();

    fieldControlValidation.commitValidation(lastChangedValueRef.current ?? finger.value);
    onValueCommitted(lastChangedValueRef.current ?? finger.value, nativeEvent);

    if (
      'pointerType' in nativeEvent &&
      controlRef.current?.hasPointerCapture(nativeEvent.pointerId)
    ) {
      controlRef.current?.releasePointerCapture(nativeEvent.pointerId);
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

    const fingerPosition = getFingerPosition(nativeEvent, touchIdRef);

    if (fingerPosition != null && isElement(nativeEvent.target)) {
      const closestThumbIndex = findClosestThumbIndex(
        fingerPosition,
        nativeEvent.target as HTMLElement,
        orientation,
        range,
        thumbRefs,
        values,
        max,
      );
      activeThumbIndexRef.current = closestThumbIndex;
      const finger = getFingerState(fingerPosition, 0);

      if (finger == null) {
        return;
      }

      setActive(finger.thumbIndex);
      setValue(finger.value, finger.thumbIndex, nativeEvent);
    }

    moveCountRef.current = 0;
    const doc = ownerDocument(controlRef.current);
    doc.addEventListener('touchmove', handleTouchMove, { passive: true });
    doc.addEventListener('touchend', handleTouchEnd, { passive: true });
  });

  const stopListening = useEventCallback(() => {
    thumbCenterOffsetRef.current = 0;
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
    ref: [forwardedRef, registerFieldControlRef, controlRef, setStylesRef],
    props: [
      {
        onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
          if (disabled) {
            return;
          }

          if (event.defaultPrevented) {
            return;
          }

          if (!controlRef.current) {
            return;
          }

          // Only handle left clicks
          if (event.button !== 0) {
            return;
          }

          const eventTarget = event.target as HTMLElement;

          const eventLandedOnThumb = thumbRefs.current.includes(eventTarget);

          const fingerPosition = getFingerPosition(event, touchIdRef);

          if (fingerPosition != null) {
            const closestThumbIndex = findClosestThumbIndex(
              fingerPosition,
              eventTarget,
              orientation,
              range,
              thumbRefs,
              values,
              max,
            );
            activeThumbIndexRef.current = closestThumbIndex;
            if (inset) {
              const thumbElement = thumbRefs.current[closestThumbIndex];
              if (isElement(thumbElement)) {
                const thumbRect = thumbElement.getBoundingClientRect();
                const side = orientation === 'horizontal' ? 'width' : 'height';
                insetThumbOffsetRef.current = thumbRect[side] / 2;
              }
            }

            const finger = getFingerState(fingerPosition, 0);

            if (finger == null) {
              return;
            }

            setActive(finger.thumbIndex);
            setDragging(true);
            // if the event lands on a thumb, don't change the value, just get the
            // percentageValue difference represented by the distance between the click origin
            // and the coordinates of the value on the track area
            if (eventLandedOnThumb) {
              thumbCenterOffsetRef.current =
                valueToPercent(values[finger.thumbIndex], min, max) / 100 - finger.valueRescaled;
            } else {
              setValue(finger.value, finger.thumbIndex, event.nativeEvent);
            }
          }

          // Avoid pointerId issues with user.pointer()
          if (process.env.NODE_ENV !== 'test' && event.nativeEvent.pointerId) {
            controlRef.current?.setPointerCapture(event.nativeEvent.pointerId);
          }

          moveCountRef.current = 0;
          const doc = ownerDocument(controlRef.current);
          doc.addEventListener('pointermove', handleTouchMove, { passive: true });
          doc.addEventListener('pointerup', handleTouchEnd);
        },
      },
      elementProps,
    ],
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return element;
});

interface FingerState {
  value: number | number[];
  valueRescaled: number;
  thumbIndex: number;
}

export namespace SliderControl {
  export interface Props extends BaseUIComponentProps<'div', SliderRoot.State> {}
}
