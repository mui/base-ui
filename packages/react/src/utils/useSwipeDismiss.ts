'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { ownerDocument } from '@base-ui/utils/owner';
import { contains, getTarget } from '../floating-ui-react/utils';
import { findScrollableTouchTarget, hasScrollableAncestor, type ScrollAxis } from './scrollable';
import { clamp } from './clamp';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

type SwipeDismissNativeEvent = PointerEvent | TouchEvent;
type SwipeDismissStartEvent = React.PointerEvent | React.TouchEvent;
type SwipeDismissMoveEvent = React.PointerEvent | React.TouchEvent;
type SwipeDismissEndEvent = React.PointerEvent | React.TouchEvent;
type SwipeProgressDetailsInternal = {
  deltaX: number;
  deltaY: number;
  direction: SwipeDirection | undefined;
};

const DEFAULT_SWIPE_THRESHOLD = 40;
const REVERSE_CANCEL_THRESHOLD = 10;
const MIN_DRAG_THRESHOLD = 1;
const MIN_VELOCITY_DURATION_MS = 50;
const MIN_RELEASE_VELOCITY_DURATION_MS = 16;
const MAX_RELEASE_VELOCITY_AGE_MS = 80;

function getDisplacement(direction: SwipeDirection, deltaX: number, deltaY: number) {
  switch (direction) {
    case 'up':
      return -deltaY;
    case 'down':
      return deltaY;
    case 'left':
      return -deltaX;
    case 'right':
      return deltaX;
    default:
      return 0;
  }
}

function getElementTransform(element: HTMLElement) {
  const computedStyle = window.getComputedStyle(element);
  const transform = computedStyle.transform;
  let translateX = 0;
  let translateY = 0;
  let scale = 1;

  if (transform && transform !== 'none') {
    const matrix = transform.match(/matrix(?:3d)?\(([^)]+)\)/);
    if (matrix) {
      const values = matrix[1].split(', ').map(parseFloat);
      if (values.length === 6) {
        translateX = values[4];
        translateY = values[5];
        scale = Math.sqrt(values[0] * values[0] + values[1] * values[1]);
      } else if (values.length === 16) {
        translateX = values[12];
        translateY = values[13];
        scale = values[0];
      }
    }
  }

  return { x: translateX, y: translateY, scale };
}

function isPointerCaptureNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'NotFoundError';
  }

  return 'name' in error && error.name === 'NotFoundError';
}

function getValidTimeStamp(timeStamp: number): number | null {
  return Number.isFinite(timeStamp) && timeStamp > 0 ? timeStamp : null;
}

function safelySetPointerCapture(element: HTMLElement, pointerId: number) {
  if (typeof element.setPointerCapture !== 'function') {
    return;
  }

  try {
    element.setPointerCapture(pointerId);
  } catch (error) {
    if (isPointerCaptureNotFoundError(error)) {
      return;
    }
    throw error;
  }
}

function safelyReleasePointerCapture(element: HTMLElement, pointerId: number) {
  if (typeof element.releasePointerCapture !== 'function') {
    return;
  }

  try {
    element.releasePointerCapture(pointerId);
  } catch (error) {
    if (isPointerCaptureNotFoundError(error)) {
      return;
    }
    throw error;
  }
}

export function useSwipeDismiss(options: useSwipeDismiss.Options): useSwipeDismiss.ReturnValue {
  const {
    enabled,
    directions,
    elementRef,
    movementCssVars,
    canStart,
    ignoreSelector = 'button,a,input,textarea,label,[role="button"],[data-swipe-ignore]',
    ignoreSelectorWhenTouch = true,
    ignoreScrollableAncestors = false,
    oppositeDirectionDamping = 'exponential',
    swipeThreshold: swipeThresholdProp,
    onDismiss,
    onProgress,
    onSwipeStart,
    onTouchSwipeStart,
    onRelease,
  } = options;

  const swipeThresholdDefault = Math.max(
    0,
    typeof swipeThresholdProp === 'number' ? swipeThresholdProp : DEFAULT_SWIPE_THRESHOLD,
  );

  const primaryDirection = directions.length === 1 ? directions[0] : undefined;

  const scrollAxes = React.useMemo((): ScrollAxis[] => {
    const axes: ScrollAxis[] = [];
    if (directions.includes('up') || directions.includes('down')) {
      axes.push('vertical');
    }
    if (directions.includes('left') || directions.includes('right')) {
      axes.push('horizontal');
    }
    return axes;
  }, [directions]);

  const [currentSwipeDirection, setCurrentSwipeDirection] = React.useState<
    SwipeDirection | undefined
  >(undefined);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const [isRealSwipe, setIsRealSwipe] = React.useState(false);
  const [dragDismissed, setDragDismissed] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [initialTransform, setInitialTransform] = React.useState({ x: 0, y: 0, scale: 1 });
  const [lockedDirection, setLockedDirection] = React.useState<'horizontal' | 'vertical' | null>(
    null,
  );

  const dragStartPosRef = React.useRef({ x: 0, y: 0 });
  const lastMovePosRef = React.useRef<{ x: number; y: number } | null>(null);
  const initialTransformRef = React.useRef({ x: 0, y: 0, scale: 1 });
  const intendedSwipeDirectionRef = React.useRef<SwipeDirection | undefined>(undefined);
  const maxSwipeDisplacementRef = React.useRef(0);
  const cancelledSwipeRef = React.useRef(false);
  const swipeCancelBaselineRef = React.useRef({ x: 0, y: 0 });
  const isFirstPointerMoveRef = React.useRef(false);
  const pendingSwipeRef = React.useRef(false);
  const pendingSwipeStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const swipeFromScrollableRef = React.useRef(false);
  const elementSizeRef = React.useRef({ width: 0, height: 0 });
  const swipeProgressRef = React.useRef(0);
  const swipeThresholdRef = React.useRef(swipeThresholdDefault);
  const swipeStartTimeRef = React.useRef<number | null>(null);
  const lastDragSampleRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const lastDragVelocityRef = React.useRef({ x: 0, y: 0 });

  const onProgressStable = useStableCallback(onProgress);
  const onReleaseStable = useStableCallback(onRelease);

  const resolveSwipeThreshold = useStableCallback((direction: SwipeDirection | undefined) => {
    if (!direction) {
      return;
    }

    if (typeof swipeThresholdProp !== 'function') {
      swipeThresholdRef.current = swipeThresholdDefault;
      return;
    }

    const element = elementRef.current;
    if (!element) {
      return;
    }

    const value = swipeThresholdProp({ element, direction });
    swipeThresholdRef.current = Math.max(0, value);
  });

  const updateSwipeProgress = useStableCallback(
    (progress: number, details?: SwipeProgressDetailsInternal) => {
      const nextProgress = Number.isFinite(progress) ? clamp(progress, 0, 1) : 0;
      if (nextProgress === swipeProgressRef.current) {
        return;
      }

      swipeProgressRef.current = nextProgress;
      onProgressStable(nextProgress, details);
    },
  );

  const recordDragSample = useStableCallback(
    (offset: { x: number; y: number }, timeStamp: number | null) => {
      if (timeStamp === null) {
        return;
      }

      const lastSample = lastDragSampleRef.current;
      if (lastSample && timeStamp > lastSample.time) {
        const durationMs = Math.max(timeStamp - lastSample.time, MIN_RELEASE_VELOCITY_DURATION_MS);
        lastDragVelocityRef.current = {
          x: (offset.x - lastSample.x) / durationMs,
          y: (offset.y - lastSample.y) / durationMs,
        };
      }

      lastDragSampleRef.current = { x: offset.x, y: offset.y, time: timeStamp };
    },
  );

  const reset = React.useCallback(() => {
    setCurrentSwipeDirection(undefined);
    setIsSwiping(false);
    setIsRealSwipe(false);
    setDragDismissed(false);
    setDragOffset({ x: 0, y: 0 });
    setInitialTransform({ x: 0, y: 0, scale: 1 });
    setLockedDirection(null);
    updateSwipeProgress(0);

    swipeThresholdRef.current = swipeThresholdDefault;
    dragStartPosRef.current = { x: 0, y: 0 };
    initialTransformRef.current = { x: 0, y: 0, scale: 1 };
    intendedSwipeDirectionRef.current = undefined;
    maxSwipeDisplacementRef.current = 0;
    cancelledSwipeRef.current = false;
    swipeCancelBaselineRef.current = { x: 0, y: 0 };
    isFirstPointerMoveRef.current = false;
    lastMovePosRef.current = null;
    pendingSwipeRef.current = false;
    pendingSwipeStartPosRef.current = null;
    swipeFromScrollableRef.current = false;
    elementSizeRef.current = { width: 0, height: 0 };
    swipeStartTimeRef.current = null;
    lastDragSampleRef.current = null;
    lastDragVelocityRef.current = { x: 0, y: 0 };
  }, [swipeThresholdDefault, updateSwipeProgress]);

  React.useEffect(() => {
    if (typeof swipeThresholdProp !== 'function') {
      swipeThresholdRef.current = swipeThresholdDefault;
    }
  }, [swipeThresholdDefault, swipeThresholdProp]);

  function getPrimaryPointerPosition(
    event: SwipeDismissStartEvent | SwipeDismissMoveEvent | SwipeDismissEndEvent,
  ) {
    if ('touches' in event) {
      const touch = event.touches[0];
      return touch ? { x: touch.clientX, y: touch.clientY } : null;
    }

    return { x: event.clientX, y: event.clientY };
  }

  function isTouchLikeEvent(
    event: SwipeDismissStartEvent | SwipeDismissMoveEvent | SwipeDismissEndEvent,
  ) {
    if ('touches' in event) {
      return true;
    }
    return event.pointerType === 'touch';
  }

  function getTargetAtPoint(position: { x: number; y: number }, nativeEvent: Event) {
    const doc = ownerDocument(elementRef.current);
    const elementAtPoint =
      typeof doc?.elementFromPoint === 'function'
        ? doc.elementFromPoint(position.x, position.y)
        : null;
    const target = elementAtPoint ?? getTarget(nativeEvent);
    return target as HTMLElement | null;
  }

  const startSwipeAtPosition = useStableCallback(
    (
      event: SwipeDismissStartEvent | SwipeDismissMoveEvent,
      position: { x: number; y: number },
      startOptions?: {
        ignoreScrollableTarget?: boolean | undefined;
        ignoreScrollableAncestors?: boolean | undefined;
      },
    ) => {
      swipeFromScrollableRef.current = false;
      const touchLike = isTouchLikeEvent(event);
      const target = getTargetAtPoint(position, event.nativeEvent);

      const doc = ownerDocument(elementRef.current);
      const body = doc.body;

      const scrollableTarget = touchLike && body ? findScrollableTouchTarget(target, body) : null;
      const ignoreScrollableTarget = startOptions?.ignoreScrollableTarget ?? false;
      if (scrollableTarget && !ignoreScrollableTarget) {
        return false;
      }
      swipeFromScrollableRef.current = Boolean(scrollableTarget && ignoreScrollableTarget);

      const isInteractiveElement = target ? target.closest(ignoreSelector) : false;
      if (isInteractiveElement && (!touchLike || ignoreSelectorWhenTouch)) {
        return false;
      }

      const element = elementRef.current;
      if (ignoreScrollableAncestors && element && target && scrollAxes.length > 0) {
        const ignoreAncestors = startOptions?.ignoreScrollableAncestors ?? false;
        if (!ignoreAncestors && hasScrollableAncestor(target, element, scrollAxes)) {
          return false;
        }
      }

      if (touchLike) {
        onTouchSwipeStart?.(event.nativeEvent as SwipeDismissNativeEvent);
      }

      cancelledSwipeRef.current = false;
      intendedSwipeDirectionRef.current = undefined;
      maxSwipeDisplacementRef.current = 0;

      dragStartPosRef.current = position;
      swipeStartTimeRef.current = getValidTimeStamp(event.timeStamp);
      swipeCancelBaselineRef.current = position;
      lastMovePosRef.current = position;

      if (element) {
        elementSizeRef.current = { width: element.offsetWidth, height: element.offsetHeight };
        resolveSwipeThreshold(primaryDirection);
        const transform = getElementTransform(element);
        initialTransformRef.current = transform;
        setInitialTransform(transform);
        setDragOffset({ x: transform.x, y: transform.y });
        recordDragSample({ x: transform.x, y: transform.y }, swipeStartTimeRef.current);

        if (!('touches' in event)) {
          safelySetPointerCapture(element, event.pointerId);
        }
      }

      onSwipeStart?.(event.nativeEvent as SwipeDismissNativeEvent);

      setIsSwiping(true);
      setIsRealSwipe(false);
      setLockedDirection(null);
      isFirstPointerMoveRef.current = true;
      updateSwipeProgress(0);

      return true;
    },
  );

  const applyDirectionalDamping = useStableCallback((deltaX: number, deltaY: number) => {
    let newDeltaX = deltaX;
    let newDeltaY = deltaY;

    const exponent =
      oppositeDirectionDamping === 'exponential'
        ? (value: number) => (value >= 0 ? value ** 0.5 : -(Math.abs(value) ** 0.5))
        : () => 0;

    if (!directions.includes('left') && !directions.includes('right')) {
      newDeltaX = exponent(deltaX);
    } else {
      if (!directions.includes('right') && deltaX > 0) {
        newDeltaX = exponent(deltaX);
      }
      if (!directions.includes('left') && deltaX < 0) {
        newDeltaX = exponent(deltaX);
      }
    }

    if (!directions.includes('up') && !directions.includes('down')) {
      newDeltaY = exponent(deltaY);
    } else {
      if (!directions.includes('down') && deltaY > 0) {
        newDeltaY = exponent(deltaY);
      }
      if (!directions.includes('up') && deltaY < 0) {
        newDeltaY = exponent(deltaY);
      }
    }

    return { x: newDeltaX, y: newDeltaY };
  });

  const handleStart = useStableCallback((event: SwipeDismissStartEvent) => {
    if (!enabled) {
      return;
    }

    if (event.defaultPrevented || event.nativeEvent.defaultPrevented) {
      return;
    }

    if (!('touches' in event) && event.button !== 0) {
      return;
    }

    const startPos = getPrimaryPointerPosition(event);
    if (!startPos) {
      return;
    }

    pendingSwipeRef.current = true;
    pendingSwipeStartPosRef.current = startPos;
    swipeFromScrollableRef.current = false;

    const allowedToStart = canStart
      ? canStart(startPos, {
          nativeEvent: event.nativeEvent as SwipeDismissNativeEvent,
          direction: primaryDirection,
        })
      : true;
    if (!allowedToStart) {
      return;
    }

    if (startSwipeAtPosition(event, startPos)) {
      pendingSwipeRef.current = false;
      pendingSwipeStartPosRef.current = null;
    }
  });

  const handleMoveCore = useStableCallback(
    (
      event: SwipeDismissMoveEvent,
      position: { x: number; y: number },
      movement: { x: number; y: number },
    ) => {
      if (!enabled || !isSwiping) {
        return;
      }

      const target = getTarget(event.nativeEvent) as HTMLElement | null;
      if (isTouchLikeEvent(event) && !swipeFromScrollableRef.current) {
        const boundaryElement = event.currentTarget as HTMLElement;
        if (findScrollableTouchTarget(target, boundaryElement)) {
          return;
        }
      }

      if (!('touches' in event)) {
        // Prevent text selection on Safari
        event.preventDefault();
      }

      if (isFirstPointerMoveRef.current) {
        // Adjust the starting position to the current position on the first move
        // to account for the delay between pointerdown and the first pointermove on iOS.
        dragStartPosRef.current = position;
        const moveTime = getValidTimeStamp(event.timeStamp);
        if (moveTime !== null) {
          swipeStartTimeRef.current = moveTime;
        }
        isFirstPointerMoveRef.current = false;
      }

      const clientX = position.x;
      const clientY = position.y;
      const movementX = movement.x;
      const movementY = movement.y;

      if (
        (movementY < 0 && clientY > swipeCancelBaselineRef.current.y) ||
        (movementY > 0 && clientY < swipeCancelBaselineRef.current.y)
      ) {
        swipeCancelBaselineRef.current = { x: swipeCancelBaselineRef.current.x, y: clientY };
      }

      if (
        (movementX < 0 && clientX > swipeCancelBaselineRef.current.x) ||
        (movementX > 0 && clientX < swipeCancelBaselineRef.current.x)
      ) {
        swipeCancelBaselineRef.current = { x: clientX, y: swipeCancelBaselineRef.current.y };
      }

      const deltaX = clientX - dragStartPosRef.current.x;
      const deltaY = clientY - dragStartPosRef.current.y;
      const cancelDeltaY = clientY - swipeCancelBaselineRef.current.y;
      const cancelDeltaX = clientX - swipeCancelBaselineRef.current.x;

      if (!isRealSwipe) {
        const movementDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (movementDistance >= MIN_DRAG_THRESHOLD) {
          setIsRealSwipe(true);
          if (lockedDirection === null) {
            const hasHorizontal = directions.includes('left') || directions.includes('right');
            const hasVertical = directions.includes('up') || directions.includes('down');
            if (hasHorizontal && hasVertical) {
              const absX = Math.abs(deltaX);
              const absY = Math.abs(deltaY);
              setLockedDirection(absX > absY ? 'horizontal' : 'vertical');
            }
          }
        }
      }

      let candidate: SwipeDirection | undefined;
      if (!intendedSwipeDirectionRef.current) {
        if (lockedDirection === 'vertical') {
          if (deltaY > 0) {
            candidate = 'down';
          } else if (deltaY < 0) {
            candidate = 'up';
          }
        } else if (lockedDirection === 'horizontal') {
          if (deltaX > 0) {
            candidate = 'right';
          } else if (deltaX < 0) {
            candidate = 'left';
          }
        } else if (Math.abs(deltaX) >= Math.abs(deltaY)) {
          candidate = deltaX > 0 ? 'right' : 'left';
        } else {
          candidate = deltaY > 0 ? 'down' : 'up';
        }

        if (candidate && directions.includes(candidate)) {
          intendedSwipeDirectionRef.current = candidate;
          maxSwipeDisplacementRef.current = getDisplacement(candidate, deltaX, deltaY);
          setCurrentSwipeDirection(candidate);
          resolveSwipeThreshold(candidate);
        }
      } else {
        const direction = intendedSwipeDirectionRef.current;
        const currentDisplacement = getDisplacement(direction, cancelDeltaX, cancelDeltaY);
        if (currentDisplacement > swipeThresholdRef.current) {
          cancelledSwipeRef.current = false;
          setCurrentSwipeDirection(direction);
        } else if (
          !(directions.includes('left') && directions.includes('right')) &&
          !(directions.includes('up') && directions.includes('down')) &&
          maxSwipeDisplacementRef.current - currentDisplacement >= REVERSE_CANCEL_THRESHOLD
        ) {
          // Mark that a change-of-mind has occurred
          cancelledSwipeRef.current = true;
        }
      }

      const dampedDelta = applyDirectionalDamping(deltaX, deltaY);
      let newOffsetX = initialTransformRef.current.x;
      let newOffsetY = initialTransformRef.current.y;

      if (lockedDirection === 'horizontal') {
        if (directions.includes('left') || directions.includes('right')) {
          newOffsetX += dampedDelta.x;
        }
      } else if (lockedDirection === 'vertical') {
        if (directions.includes('up') || directions.includes('down')) {
          newOffsetY += dampedDelta.y;
        }
      } else {
        if (directions.includes('left') || directions.includes('right')) {
          newOffsetX += dampedDelta.x;
        }
        if (directions.includes('up') || directions.includes('down')) {
          newOffsetY += dampedDelta.y;
        }
      }

      setDragOffset({ x: newOffsetX, y: newOffsetY });
      recordDragSample({ x: newOffsetX, y: newOffsetY }, getValidTimeStamp(event.timeStamp));
      const dragDeltaX = newOffsetX - initialTransformRef.current.x;
      const dragDeltaY = newOffsetY - initialTransformRef.current.y;
      const swipeDirectionDetails = intendedSwipeDirectionRef.current;

      const progressDirection = primaryDirection ?? intendedSwipeDirectionRef.current;
      if (!progressDirection) {
        updateSwipeProgress(0, {
          deltaX: dragDeltaX,
          deltaY: dragDeltaY,
          direction: swipeDirectionDetails,
        });
        return;
      }

      const size =
        progressDirection === 'left' || progressDirection === 'right'
          ? elementSizeRef.current.width
          : elementSizeRef.current.height;
      const scale = initialTransformRef.current.scale || 1;
      if (size <= 0 || scale <= 0) {
        updateSwipeProgress(0, {
          deltaX: dragDeltaX,
          deltaY: dragDeltaY,
          direction: swipeDirectionDetails,
        });
        return;
      }

      const progressDisplacement = getDisplacement(
        progressDirection,
        newOffsetX - initialTransformRef.current.x,
        newOffsetY - initialTransformRef.current.y,
      );
      if (progressDisplacement <= 0) {
        updateSwipeProgress(0, {
          deltaX: dragDeltaX,
          deltaY: dragDeltaY,
          direction: swipeDirectionDetails,
        });
        return;
      }

      updateSwipeProgress(progressDisplacement / (size * scale), {
        deltaX: dragDeltaX,
        deltaY: dragDeltaY,
        direction: swipeDirectionDetails,
      });
    },
  );

  const handleMove = useStableCallback((event: SwipeDismissMoveEvent) => {
    const currentPos = getPrimaryPointerPosition(event);
    if (!currentPos) {
      return;
    }

    if (!isSwiping && pendingSwipeRef.current) {
      if (
        !isTouchLikeEvent(event) &&
        (event.defaultPrevented || event.nativeEvent.defaultPrevented)
      ) {
        pendingSwipeRef.current = false;
        pendingSwipeStartPosRef.current = null;
        return;
      }

      const allowedToStart = canStart
        ? canStart(currentPos, {
            nativeEvent: event.nativeEvent as SwipeDismissNativeEvent,
            direction: primaryDirection,
          })
        : true;

      if (allowedToStart) {
        let ignoreScrollableTarget = false;
        let ignoreScrollableAncestorsOnStart = false;
        if (isTouchLikeEvent(event)) {
          const pendingStartPos = pendingSwipeStartPosRef.current;
          const element = elementRef.current;
          if (pendingStartPos && element) {
            const target = getTargetAtPoint(currentPos, event.nativeEvent);
            const doc = ownerDocument(element);
            const body = doc.body;
            const scrollTarget = body ? findScrollableTouchTarget(target, body) : null;

            if (
              scrollTarget &&
              (contains(element, scrollTarget) || contains(scrollTarget, element))
            ) {
              const deltaX = currentPos.x - pendingStartPos.x;
              const deltaY = currentPos.y - pendingStartPos.y;
              const hasVertical = directions.includes('down') || directions.includes('up');
              if (hasVertical && deltaY !== 0 && Math.abs(deltaY) >= Math.abs(deltaX)) {
                const maxScrollTop = Math.max(
                  0,
                  scrollTarget.scrollHeight - scrollTarget.clientHeight,
                );
                const atTop = scrollTarget.scrollTop <= 0;
                const atBottom = scrollTarget.scrollTop >= maxScrollTop;
                const movingDown = deltaY > 0;
                const movingUp = deltaY < 0;
                const allowDown = movingDown && atTop && directions.includes('down');
                const allowUp = movingUp && atBottom && directions.includes('up');

                if (allowDown || allowUp) {
                  ignoreScrollableTarget = true;
                  ignoreScrollableAncestorsOnStart = true;
                } else {
                  return;
                }
              }
            }
          }
        }

        const started = startSwipeAtPosition(event, currentPos, {
          ignoreScrollableTarget,
          ignoreScrollableAncestors: ignoreScrollableAncestorsOnStart,
        });
        if (started) {
          pendingSwipeRef.current = false;
          pendingSwipeStartPosRef.current = null;
          return;
        }
      }
    }

    const previousPos = lastMovePosRef.current;
    const movement =
      previousPos === null
        ? { x: 0, y: 0 }
        : { x: currentPos.x - previousPos.x, y: currentPos.y - previousPos.y };

    lastMovePosRef.current = currentPos;
    handleMoveCore(event, currentPos, movement);
  });

  const handleEnd = useStableCallback((event: SwipeDismissEndEvent) => {
    if (!enabled) {
      return;
    }

    const releaseDeltaX = dragOffset.x - initialTransform.x;
    const releaseDeltaY = dragOffset.y - initialTransform.y;
    const progressDetails: SwipeProgressDetailsInternal = {
      deltaX: releaseDeltaX,
      deltaY: releaseDeltaY,
      direction: currentSwipeDirection ?? intendedSwipeDirectionRef.current,
    };

    if (!isSwiping) {
      pendingSwipeRef.current = false;
      pendingSwipeStartPosRef.current = null;
      swipeFromScrollableRef.current = false;
      lastMovePosRef.current = null;
      updateSwipeProgress(0, progressDetails);
      return;
    }

    const target = getTarget(event.nativeEvent) as HTMLElement | null;
    if (isTouchLikeEvent(event) && !swipeFromScrollableRef.current) {
      const boundaryElement = event.currentTarget as HTMLElement;
      if (findScrollableTouchTarget(target, boundaryElement)) {
        return;
      }
    }

    setIsSwiping(false);
    setIsRealSwipe(false);
    setLockedDirection(null);

    lastMovePosRef.current = null;
    pendingSwipeRef.current = false;
    pendingSwipeStartPosRef.current = null;
    swipeFromScrollableRef.current = false;

    const element = elementRef.current;
    if (element) {
      if (!('touches' in event)) {
        safelyReleasePointerCapture(element, event.pointerId);
      }
    }

    const deltaX = releaseDeltaX;
    const deltaY = releaseDeltaY;
    const startTime = swipeStartTimeRef.current;
    const endTime = getValidTimeStamp(event.timeStamp);
    const durationMs =
      startTime !== null && endTime !== null && endTime > startTime ? endTime - startTime : 0;
    const velocityDurationMs = durationMs > 0 ? Math.max(durationMs, MIN_VELOCITY_DURATION_MS) : 0;
    const velocityX = velocityDurationMs > 0 ? deltaX / velocityDurationMs : 0;
    const velocityY = velocityDurationMs > 0 ? deltaY / velocityDurationMs : 0;
    let releaseVelocityX = lastDragVelocityRef.current.x;
    let releaseVelocityY = lastDragVelocityRef.current.y;
    const lastSample = lastDragSampleRef.current;
    if (lastSample && endTime !== null && endTime >= lastSample.time) {
      const ageMs = endTime - lastSample.time;
      if (ageMs <= MAX_RELEASE_VELOCITY_AGE_MS) {
        const sampleDurationMs = Math.max(ageMs, MIN_RELEASE_VELOCITY_DURATION_MS);
        const deltaFromLastSampleX = dragOffset.x - lastSample.x;
        const deltaFromLastSampleY = dragOffset.y - lastSample.y;
        const sampleVelocityX = deltaFromLastSampleX / sampleDurationMs;
        const sampleVelocityY = deltaFromLastSampleY / sampleDurationMs;
        if (sampleVelocityX !== 0) {
          releaseVelocityX = sampleVelocityX;
        }
        if (sampleVelocityY !== 0) {
          releaseVelocityY = sampleVelocityY;
        }
      } else {
        releaseVelocityX = 0;
        releaseVelocityY = 0;
      }
    }

    const releaseDecision = onReleaseStable?.({
      event: event.nativeEvent as SwipeDismissNativeEvent,
      direction: currentSwipeDirection ?? intendedSwipeDirectionRef.current,
      deltaX,
      deltaY,
      velocityX,
      velocityY,
      releaseVelocityX,
      releaseVelocityY,
    });
    const hasReleaseDecision = typeof releaseDecision === 'boolean';

    if (cancelledSwipeRef.current && !hasReleaseDecision) {
      setDragOffset({ x: initialTransform.x, y: initialTransform.y });
      setCurrentSwipeDirection(undefined);
      updateSwipeProgress(0, progressDetails);
      return;
    }

    let shouldClose = false;
    let dismissDirection: SwipeDirection | undefined;

    if (hasReleaseDecision) {
      shouldClose = releaseDecision;
      dismissDirection =
        currentSwipeDirection ?? intendedSwipeDirectionRef.current ?? primaryDirection;
    } else {
      for (const direction of directions) {
        switch (direction) {
          case 'right':
            if (deltaX > swipeThresholdRef.current) {
              shouldClose = true;
              dismissDirection = 'right';
            }
            break;
          case 'left':
            if (deltaX < -swipeThresholdRef.current) {
              shouldClose = true;
              dismissDirection = 'left';
            }
            break;
          case 'down':
            if (deltaY > swipeThresholdRef.current) {
              shouldClose = true;
              dismissDirection = 'down';
            }
            break;
          case 'up':
            if (deltaY < -swipeThresholdRef.current) {
              shouldClose = true;
              dismissDirection = 'up';
            }
            break;
          default:
            break;
        }
        if (shouldClose) {
          break;
        }
      }
    }

    if (shouldClose && dismissDirection) {
      setCurrentSwipeDirection(dismissDirection);
      setDragDismissed(true);
      onDismiss?.(event.nativeEvent as SwipeDismissNativeEvent, { direction: dismissDirection });
    } else {
      setDragOffset({ x: initialTransform.x, y: initialTransform.y });
      setCurrentSwipeDirection(undefined);
      updateSwipeProgress(0, progressDetails);
    }
  });

  const getDragStyles = React.useCallback((): React.CSSProperties => {
    if (
      !isSwiping &&
      dragOffset.x === initialTransform.x &&
      dragOffset.y === initialTransform.y &&
      !dragDismissed
    ) {
      return {
        [movementCssVars.x]: '0px',
        [movementCssVars.y]: '0px',
      } as React.CSSProperties;
    }

    const deltaX = dragOffset.x - initialTransform.x;
    const deltaY = dragOffset.y - initialTransform.y;

    return {
      transition: isSwiping ? 'none' : undefined,
      // While swiping, freeze the element at its current visual transform so it doesn't snap to the
      // end position.
      transform: isSwiping
        ? `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) scale(${initialTransform.scale})`
        : undefined,
      [movementCssVars.x]: `${deltaX}px`,
      [movementCssVars.y]: `${deltaY}px`,
    } as React.CSSProperties;
  }, [dragDismissed, dragOffset, initialTransform, isSwiping, movementCssVars]);

  const getPointerProps = React.useCallback(() => {
    if (!enabled) {
      return {};
    }

    return {
      onPointerDown: handleStart,
      onPointerMove: handleMove,
      onPointerUp: handleEnd,
    } as const;
  }, [enabled, handleEnd, handleMove, handleStart]);

  const getTouchProps = React.useCallback(() => {
    if (!enabled) {
      return {};
    }

    return {
      onTouchStart: handleStart,
      onTouchMove: handleMove,
      onTouchEnd: handleEnd,
      onTouchCancel: handleEnd,
    } as const;
  }, [enabled, handleEnd, handleMove, handleStart]);

  return {
    swiping: isSwiping,
    swipeDirection: currentSwipeDirection,
    dragDismissed,
    getPointerProps,
    getTouchProps,
    getDragStyles,
    reset,
  };
}

export namespace useSwipeDismiss {
  export interface SwipeDismissDetails {
    nativeEvent: PointerEvent | TouchEvent;
    direction: SwipeDirection | undefined;
  }

  export type SwipeProgressDetails = SwipeProgressDetailsInternal;

  export interface Options {
    enabled: boolean;
    directions: SwipeDirection[];
    elementRef: React.RefObject<HTMLElement | null>;
    movementCssVars: { x: string; y: string };
    /**
     * The minimum distance (in pixels) the pointer must travel from the initial swipe point
     * before the gesture is considered a dismiss.
     * @default 40
     */
    swipeThreshold?:
      | number
      | ((details: { element: HTMLElement; direction: SwipeDirection }) => number)
      | undefined;
    /**
     * If provided, swiping will only begin once this returns true.
     * The predicate is evaluated on start and on subsequent move events while the pointer is down.
     */
    canStart?:
      | ((position: { x: number; y: number }, details: SwipeDismissDetails) => boolean)
      | undefined;
    ignoreSelector?: string | undefined;
    /**
     * If true, swiping won't start when the gesture begins within a scrollable element.
     * This helps avoid conflicts between scrolling content and swipe-to-dismiss.
     * @default false
     */
    ignoreScrollableAncestors?: boolean | undefined;
    /**
     * If false, touch interactions can start swiping on elements matched by `ignoreSelector`.
     * @default true
     */
    ignoreSelectorWhenTouch?: boolean | undefined;
    oppositeDirectionDamping?: ('exponential' | 'none') | undefined;
    onSwipeStart?: ((event: PointerEvent | TouchEvent) => void) | undefined;
    onTouchSwipeStart?: ((event: PointerEvent | TouchEvent) => void) | undefined;
    onProgress?: ((progress: number, details?: SwipeProgressDetailsInternal) => void) | undefined;
    /**
     * Called when the swipe interaction ends. Returning `true` or `false`
     * overrides the default dismissal behavior.
     */
    onRelease?:
      | ((details: {
          event: PointerEvent | TouchEvent;
          direction: SwipeDirection | undefined;
          deltaX: number;
          deltaY: number;
          velocityX: number;
          velocityY: number;
          releaseVelocityX: number;
          releaseVelocityY: number;
        }) => boolean | void)
      | undefined;
    onDismiss?:
      | ((event: PointerEvent | TouchEvent, details: { direction: SwipeDirection }) => void)
      | undefined;
  }

  export interface ReturnValue {
    swiping: boolean;
    swipeDirection: SwipeDirection | undefined;
    dragDismissed: boolean;
    getPointerProps: () => {
      onPointerDown?: ((event: React.PointerEvent) => void) | undefined;
      onPointerMove?: ((event: React.PointerEvent) => void) | undefined;
      onPointerUp?: ((event: React.PointerEvent) => void) | undefined;
    };
    getTouchProps: () => {
      onTouchStart?: ((event: React.TouchEvent) => void) | undefined;
      onTouchMove?: ((event: React.TouchEvent) => void) | undefined;
      onTouchEnd?: ((event: React.TouchEvent) => void) | undefined;
      onTouchCancel?: ((event: React.TouchEvent) => void) | undefined;
    };
    getDragStyles: () => React.CSSProperties;
    reset: () => void;
  }
}
