import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerDocument } from '../../utils/owner';
import { useForkRef } from '../../utils/useForkRef';
import { useSliderContext } from '../Root/SliderContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { roundValueToStep, valueToPercent } from '../utils';
import { areValuesEqual, focusThumb, trackFinger } from '../Root/useSliderRoot';

const INTENTIONAL_DRAG_COUNT_THRESHOLD = 2;

export function useSliderTrack(parameters: any) {
  const { rootRef: externalRef } = parameters;

  const trackRef = React.useRef<HTMLElement>(null);

  const handleRootRef = useForkRef(externalRef, trackRef);

  // A number that uniquely identifies the current finger in the touch session.
  const touchId = React.useRef<number>();

  const moveCount = React.useRef(0);

  // offset distance between:
  // 1. pointerDown coordinates and
  // 2. the exact intersection of the center of the thumb and the track
  const offsetRef = React.useRef(0);

  const {
    disabled,
    dragging,
    getFingerNewValue,
    handleValueChange,
    onValueCommitted,
    max,
    min,
    setActive,
    setDragging,
    setOpen,
    setValueState,
    subitems,
    value,
    valueState,
  } = useSliderContext('Track');

  const thumbRefs = React.useMemo(() => {
    return Array.from(subitems).map((subitem) => {
      const { ref } = subitem[1];
      return ref.current;
    });
  }, [subitems]);

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
      referenceRef: trackRef,
      offset: offsetRef.current,
    });

    focusThumb({ sliderRef: trackRef, activeIndex, setActive });
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

    const { newValue } = getFingerNewValue({ finger, move: true, referenceRef: trackRef });

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
      const { newValue, activeIndex } = getFingerNewValue({ finger, referenceRef: trackRef });
      focusThumb({ sliderRef: trackRef, activeIndex, setActive });

      setValueState(newValue);

      if (handleValueChange && !areValuesEqual(newValue, valueState)) {
        handleValueChange(newValue, activeIndex, nativeEvent);
      }
    }

    moveCount.current = 0;
    const doc = ownerDocument(trackRef.current);
    doc.addEventListener('touchmove', handleTouchMove, { passive: true });
    doc.addEventListener('touchend', handleTouchEnd, { passive: true });
  });

  const stopListening = React.useCallback(() => {
    offsetRef.current = 0;
    const doc = ownerDocument(trackRef.current);
    doc.removeEventListener('pointermove', handleTouchMove);
    doc.removeEventListener('pointerup', handleTouchEnd);
    doc.removeEventListener('touchmove', handleTouchMove);
    doc.removeEventListener('touchend', handleTouchEnd);
  }, [handleTouchEnd, handleTouchMove]);

  React.useEffect(() => {
    const { current: slider } = trackRef;
    slider!.addEventListener('touchstart', handleTouchStart, {
      // TODO: check this is ok, all supported browsers in 2024 should support touch-action: none
      passive: true,
    });

    return () => {
      slider!.removeEventListener('touchstart', handleTouchStart);

      stopListening();
    };
  }, [stopListening, handleTouchStart, trackRef]);

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
          const finger = trackFinger(event, touchId);
          if (finger !== false) {
            const { newValue, activeIndex, newValuePercent } = getFingerNewValue({
              finger,
              referenceRef: trackRef,
            });
            focusThumb({ sliderRef: trackRef, activeIndex, setActive });

            const eventLandedOnThumb = thumbRefs.includes(event.target as HTMLElement);

            if (eventLandedOnThumb) {
              const targetThumbIndex = (event.target as HTMLElement).getAttribute('data-index');
              const oldValuePercent = valueToPercent(
                value[Number(targetThumbIndex) ?? 0],
                min,
                max,
              );
              // console.log(
              //   'getFingerNewValue return:',
              //   newValue,
              //   roundValueToStep(newValuePercent * 100, 1, 0),
              // );
              // console.log('oldValuePercent', oldValuePercent);
              const offset = oldValuePercent - roundValueToStep(newValuePercent * 100, 1, 0);
              // console.log('offset', offset);

              offsetRef.current = offset;
            }

            // do not change the value and shift the thumb if the event lands on a thumb
            if (!eventLandedOnThumb) {
              setValueState(newValue);

              if (handleValueChange && !areValuesEqual(newValue, valueState)) {
                handleValueChange(newValue, activeIndex, event);
              }
            }
          }

          moveCount.current = 0;
          const doc = ownerDocument(trackRef.current);
          doc.addEventListener('pointermove', handleTouchMove, { passive: true });
          doc.addEventListener('pointerup', handleTouchEnd);
        },
        ref: handleRootRef,
      });
    },
    [
      disabled,
      getFingerNewValue,
      handleRootRef,
      handleTouchMove,
      handleTouchEnd,
      handleValueChange,
      max,
      min,
      setActive,
      setValueState,
      thumbRefs,
      value,
      valueState,
    ],
  );

  return React.useMemo(
    () => ({
      getRootProps,
    }),
    [getRootProps],
  );
}
