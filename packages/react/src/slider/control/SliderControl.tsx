'use client';
import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { activeElement, contains } from '../../floating-ui-react/utils';
import type { Coords } from '../../floating-ui-react/types';
import { clamp } from '../../utils/clamp';
import type { BaseUIComponentProps } from '../../utils/types';
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStateAttributesMapping } from '../root/stateAttributesMapping';
import type { SliderRoot } from '../root/SliderRoot';
import { getMidpoint } from '../utils/getMidpoint';
import { replaceArrayItemAtIndex } from '../utils/replaceArrayItemAtIndex';
import { roundValueToStep } from '../utils/roundValueToStep';
import { validateMinimumDistance } from '../utils/validateMinimumDistance';

const INTENTIONAL_DRAG_COUNT_THRESHOLD = 2;

function getControlOffset(styles: CSSStyleDeclaration | null, vertical: boolean) {
  if (!styles) {
    return {
      start: 0,
      end: 0,
    };
  }

  const start = !vertical ? 'InlineStart' : 'Top';
  const end = !vertical ? 'InlineEnd' : 'Bottom';

  return {
    start: parseFloat(styles[`border${start}Width`]) + parseFloat(styles[`padding${start}`]),
    end: parseFloat(styles[`border${end}Width`]) + parseFloat(styles[`padding${end}`]),
  };
}

function getFingerCoords(
  event: TouchEvent | PointerEvent | React.PointerEvent,
  touchIdRef: React.RefObject<number | null>,
): Coords | null {
  // The event is TouchEvent
  if (touchIdRef.current != null && (event as TouchEvent).changedTouches) {
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
    lastChangedValueRef,
    max,
    min,
    minStepsBetweenValues,
    onValueCommitted,
    orientation,
    pressedInputRef,
    pressedThumbCenterOffsetRef,
    pressedThumbIndexRef,
    registerFieldControlRef,
    setActive,
    setDragging,
    setValue,
    state,
    step,
    thumbRefs,
    values,
  } = useSliderRootContext();

  const direction = useDirection();
  const range = values.length > 1;
  const vertical = orientation === 'vertical';

  const controlRef = React.useRef<HTMLElement>(null);
  const stylesRef = React.useRef<CSSStyleDeclaration>(null);
  const setStylesRef = useEventCallback((element: HTMLElement | null) => {
    if (element && stylesRef.current == null) {
      if (stylesRef.current == null) {
        stylesRef.current = getComputedStyle(element);
      }
    }
  });

  // A number that uniquely identifies the current finger in the touch session.
  const touchIdRef = React.useRef<number>(null);
  // The number of touch/pointermove events that have fired.
  const moveCountRef = React.useRef(0);

  const getFingerState = useEventCallback((fingerCoords: Coords): FingerState | null => {
    const control = controlRef.current;

    if (!control) {
      return null;
    }

    const { width, height, bottom, left, right } = control.getBoundingClientRect();

    const controlOffset = getControlOffset(stylesRef.current, vertical);
    const controlSize = (vertical ? height : width) - controlOffset.start - controlOffset.end;
    const thumbCenterOffset = pressedThumbCenterOffsetRef.current ?? 0;
    const fingerX = fingerCoords.x - thumbCenterOffset;
    const fingerY = fingerCoords.y - thumbCenterOffset;

    const valueSize = vertical
      ? bottom - fingerY - controlOffset.end
      : (direction === 'rtl' ? right - fingerX : fingerX - left) - controlOffset.start;
    // the value at the finger origin scaled down to fit the range [0, 1]
    const valueRescaled = clamp(valueSize / controlSize, 0, 1);

    let newValue = (max - min) * valueRescaled + min;
    newValue = roundValueToStep(newValue, step, min);
    newValue = clamp(newValue, min, max);

    if (!range) {
      return {
        value: newValue,
        thumbIndex: 0,
      };
    }

    const minValueDifference = minStepsBetweenValues * step;

    // Bound the new value to the thumb's neighbours.
    newValue = clamp(
      newValue,
      values[pressedThumbIndexRef.current - 1] + minValueDifference || -Infinity,
      values[pressedThumbIndexRef.current + 1] - minValueDifference || Infinity,
    );

    return {
      value: replaceArrayItemAtIndex(values, pressedThumbIndexRef.current, newValue),
      thumbIndex: pressedThumbIndexRef.current,
    };
  });

  const startPressing = useEventCallback((fingerCoords: Coords) => {
    let closestThumbIndex = -1;
    const pressedThumbIndex = pressedThumbIndexRef.current;

    if (values.length === 1 || pressedThumbIndex === 0) {
      closestThumbIndex = 0;
    }

    // pressed on a thumb
    if (pressedThumbIndex > -1) {
      // handle thumbs that overlap at max, the lowest index thumb has to be
      // dragged first or it will block higher index thumbs from moving
      // otherwise higher index thumbs will be closest by default when their
      // values are identical
      if (pressedThumbIndex === 1) {
        closestThumbIndex = values[0] === max ? 0 : 1;
      } else {
        // avoid this loop unless there are 2+ lower index thumbs
        for (let i = pressedThumbIndex; i >= 0; i -= 1) {
          const prevIndex = i - 1;
          if (values[prevIndex] !== max) {
            closestThumbIndex = i;
          }
        }
      }
    } else {
      // pressed on control
      const axis = !vertical ? 'x' : 'y';
      let minDistance;

      for (let i = 0; i < thumbRefs.current.length; i += 1) {
        const thumbEl = thumbRefs.current[i];
        if (isElement(thumbEl)) {
          const midpoint = getMidpoint(thumbEl);
          const distance = Math.abs(fingerCoords[axis] - midpoint[axis]);

          if (minDistance === undefined || distance <= minDistance) {
            closestThumbIndex = i;
            minDistance = distance;
          }
        }
      }
    }

    if (closestThumbIndex > -1 && closestThumbIndex !== pressedThumbIndexRef.current) {
      pressedThumbIndexRef.current = closestThumbIndex;
    }

    return closestThumbIndex;
  });

  const focusThumb = useEventCallback((thumbIndex: number) => {
    thumbRefs.current?.[thumbIndex]
      ?.querySelector<HTMLInputElement>('input[type="range"]')
      ?.focus({ preventScroll: true });
  });

  const handleTouchMove = useEventCallback((nativeEvent: TouchEvent | PointerEvent) => {
    const fingerCoords = getFingerCoords(nativeEvent, touchIdRef);

    if (fingerCoords == null) {
      return;
    }

    moveCountRef.current += 1;

    // Cancel move in case some other element consumed a pointerup event and it was not fired.
    if (nativeEvent.type === 'pointermove' && (nativeEvent as PointerEvent).buttons === 0) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleTouchEnd(nativeEvent);
      return;
    }

    const finger = getFingerState(fingerCoords);

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
    setActive(-1);
    setDragging(false);

    pressedInputRef.current = null;
    pressedThumbCenterOffsetRef.current = null;
    pressedThumbIndexRef.current = -1;

    const fingerCoords = getFingerCoords(nativeEvent, touchIdRef);

    if (fingerCoords == null) {
      return;
    }

    const finger = getFingerState(fingerCoords);

    if (finger == null) {
      return;
    }

    fieldControlValidation.commitValidation(lastChangedValueRef.current ?? finger.value);
    onValueCommitted(
      lastChangedValueRef.current ?? finger.value,
      createBaseUIEventDetails('none', nativeEvent),
    );

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

    const fingerCoords = getFingerCoords(nativeEvent, touchIdRef);

    if (fingerCoords != null) {
      startPressing(fingerCoords);

      const finger = getFingerState(fingerCoords);

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
    const doc = ownerDocument(controlRef.current);
    doc.removeEventListener('pointermove', handleTouchMove);
    doc.removeEventListener('pointerup', handleTouchEnd);
    doc.removeEventListener('touchmove', handleTouchMove);
    doc.removeEventListener('touchend', handleTouchEnd);
  });

  const focusFrame = useAnimationFrame();

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
      focusFrame.cancel();

      stopListening();
    };
  }, [stopListening, handleTouchStart, controlRef, focusFrame]);

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
        onPointerDown(event) {
          const control = controlRef.current;

          if (
            !control ||
            disabled ||
            event.defaultPrevented ||
            !isElement(event.target) ||
            // Only handle left clicks
            event.button !== 0
          ) {
            return;
          }

          const fingerCoords = getFingerCoords(event, touchIdRef);

          if (fingerCoords != null) {
            startPressing(fingerCoords);

            const finger = getFingerState(fingerCoords);

            if (finger == null) {
              return;
            }

            const pressedOnFocusedThumb = contains(
              thumbRefs.current[finger.thumbIndex],
              activeElement(ownerDocument(control)),
            );

            if (pressedOnFocusedThumb) {
              event.preventDefault();
            } else {
              focusFrame.request(() => {
                focusThumb(finger.thumbIndex);
              });
            }

            setDragging(true);

            const pressedOnAnyThumb = pressedThumbCenterOffsetRef.current != null;
            if (!pressedOnAnyThumb) {
              setValue(finger.value, finger.thumbIndex, event.nativeEvent);
            }
          }

          if (event.nativeEvent.pointerId) {
            control.setPointerCapture(event.nativeEvent.pointerId);
          }

          moveCountRef.current = 0;
          const doc = ownerDocument(controlRef.current);
          doc.addEventListener('pointermove', handleTouchMove, { passive: true });
          doc.addEventListener('pointerup', handleTouchEnd);
        },
        tabIndex: -1,
      },
      elementProps,
    ],
    stateAttributesMapping: sliderStateAttributesMapping,
  });

  return element;
});

interface FingerState {
  value: number | number[];
  thumbIndex: number;
}

export namespace SliderControl {
  export interface Props extends BaseUIComponentProps<'div', SliderRoot.State> {}
}
