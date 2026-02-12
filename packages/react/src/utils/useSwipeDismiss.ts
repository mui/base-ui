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
const DEFAULT_IGNORE_SELECTOR = 'button,a,input,select,textarea,label,[role="button"]';

export function getDisplacement(direction: SwipeDirection, deltaX: number, deltaY: number) {
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

export function getElementTransform(element: HTMLElement) {
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

function getValidTimeStamp(timeStamp: number): number | null {
  return Number.isFinite(timeStamp) && timeStamp > 0 ? timeStamp : null;
}

function hasPrimaryMouseButton(buttons: number): boolean {
  return buttons % 2 === 1;
}

function safelyChangePointerCapture(
  element: HTMLElement,
  pointerId: number,
  method: 'setPointerCapture' | 'releasePointerCapture',
) {
  const pointerCaptureMethod = element[method];
  if (typeof pointerCaptureMethod !== 'function') {
    return;
  }

  try {
    pointerCaptureMethod.call(element, pointerId);
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFoundError') {
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
    ignoreSelectorWhenTouch = true,
    ignoreScrollableAncestors = false,
    swipeThreshold: swipeThresholdProp,
    onDismiss,
    onProgress,
    onSwipeStart,
    onRelease,
    onSwipingChange,
    trackDrag = true,
  } = options;

  const ignoreSelector = DEFAULT_IGNORE_SELECTOR;
  const primaryDirection = directions.length === 1 ? directions[0] : undefined;

  const swipeThresholdDefault = Math.max(
    0,
    typeof swipeThresholdProp === 'number' ? swipeThresholdProp : DEFAULT_SWIPE_THRESHOLD,
  );

  const allowLeft = directions.includes('left');
  const allowRight = directions.includes('right');
  const allowUp = directions.includes('up');
  const allowDown = directions.includes('down');
  const hasHorizontal = allowLeft || allowRight;
  const hasVertical = allowUp || allowDown;

  const scrollAxes = React.useMemo((): ScrollAxis[] => {
    const axes: ScrollAxis[] = [];
    if (hasVertical) {
      axes.push('vertical');
    }
    if (hasHorizontal) {
      axes.push('horizontal');
    }
    return axes;
  }, [hasHorizontal, hasVertical]);

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
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });
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
  const sawPrimaryButtonsOnMoveRef = React.useRef(false);
  const elementSizeRef = React.useRef({ width: 0, height: 0 });
  const swipeProgressRef = React.useRef(0);
  const swipeThresholdRef = React.useRef(swipeThresholdDefault);
  const swipeStartTimeRef = React.useRef<number | null>(null);
  const lastDragSampleRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const lastDragVelocityRef = React.useRef({ x: 0, y: 0 });
  const lastProgressDetailsRef = React.useRef<SwipeProgressDetailsInternal | null>(null);
  const isSwipingRef = React.useRef(false);

  const setSwiping = useStableCallback((nextSwiping: boolean) => {
    if (isSwipingRef.current === nextSwiping) {
      return;
    }

    isSwipingRef.current = nextSwiping;
    setIsSwiping(nextSwiping);
    onSwipingChange?.(nextSwiping);
  });

  function resolveSwipeThreshold(direction: SwipeDirection | undefined) {
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
  }

  const updateSwipeProgress = useStableCallback(
    (progress: number, details?: SwipeProgressDetailsInternal) => {
      const nextProgress = Number.isFinite(progress) ? clamp(progress, 0, 1) : 0;
      const progressChanged = nextProgress !== swipeProgressRef.current;
      let detailsChanged = false;

      if (details) {
        const lastDetails = lastProgressDetailsRef.current;
        detailsChanged =
          !lastDetails ||
          lastDetails.deltaX !== details.deltaX ||
          lastDetails.deltaY !== details.deltaY ||
          lastDetails.direction !== details.direction;
      }

      if (!progressChanged && !detailsChanged) {
        return;
      }

      swipeProgressRef.current = nextProgress;
      if (details) {
        lastProgressDetailsRef.current = details;
      } else if (progressChanged) {
        lastProgressDetailsRef.current = null;
      }
      onProgress?.(nextProgress, details);
    },
  );

  function recordDragSample(offset: { x: number; y: number }, timeStamp: number | null) {
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
  }

  const reset = React.useCallback(() => {
    setCurrentSwipeDirection(undefined);
    setSwiping(false);
    setIsRealSwipe(false);
    setDragDismissed(false);
    setDragOffset({ x: 0, y: 0 });
    setInitialTransform({ x: 0, y: 0, scale: 1 });
    setLockedDirection(null);
    updateSwipeProgress(0);

    swipeThresholdRef.current = swipeThresholdDefault;
    dragStartPosRef.current = { x: 0, y: 0 };
    dragOffsetRef.current = { x: 0, y: 0 };
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
    sawPrimaryButtonsOnMoveRef.current = false;
    elementSizeRef.current = { width: 0, height: 0 };
    swipeStartTimeRef.current = null;
    lastDragSampleRef.current = null;
    lastDragVelocityRef.current = { x: 0, y: 0 };
    lastProgressDetailsRef.current = null;
  }, [setSwiping, swipeThresholdDefault, updateSwipeProgress]);

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

  function findGestureScrollableTouchTarget(
    target: EventTarget | null,
    root: HTMLElement,
  ): HTMLElement | null {
    if (hasHorizontal && !hasVertical) {
      return findScrollableTouchTarget(target, root, 'horizontal');
    }

    if (hasVertical && !hasHorizontal) {
      return findScrollableTouchTarget(target, root, 'vertical');
    }

    return (
      findScrollableTouchTarget(target, root, 'vertical') ??
      findScrollableTouchTarget(target, root, 'horizontal')
    );
  }

  function startSwipeAtPosition(
    event: SwipeDismissStartEvent | SwipeDismissMoveEvent,
    position: { x: number; y: number },
    startOptions?: {
      ignoreScrollableTarget?: boolean | undefined;
      ignoreScrollableAncestors?: boolean | undefined;
    },
  ) {
    swipeFromScrollableRef.current = false;
    const touchLike = isTouchLikeEvent(event);
    const target = getTargetAtPoint(position, event.nativeEvent);

    const doc = ownerDocument(elementRef.current);
    const body = doc.body;

    const scrollableTarget =
      touchLike && body ? findGestureScrollableTouchTarget(target, body) : null;
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
      dragOffsetRef.current = { x: transform.x, y: transform.y };
      setInitialTransform(transform);
      setDragOffset({ x: transform.x, y: transform.y });
      recordDragSample({ x: transform.x, y: transform.y }, swipeStartTimeRef.current);

      if (!('touches' in event)) {
        safelyChangePointerCapture(element, event.pointerId, 'setPointerCapture');
      }
    }

    onSwipeStart?.(event.nativeEvent as SwipeDismissNativeEvent);

    setSwiping(true);
    setIsRealSwipe(false);
    setLockedDirection(null);
    isFirstPointerMoveRef.current = true;
    updateSwipeProgress(0);

    return true;
  }

  function resetPendingSwipeState() {
    clearPendingSwipeStartState();
    swipeFromScrollableRef.current = false;
    lastMovePosRef.current = null;
  }

  function clearPendingSwipeStartState() {
    pendingSwipeRef.current = false;
    pendingSwipeStartPosRef.current = null;
  }

  function cancelSwipeInteraction(event: React.PointerEvent) {
    resetPendingSwipeState();

    if (!isSwipingRef.current) {
      return;
    }

    setSwiping(false);
    setIsRealSwipe(false);
    setLockedDirection(null);

    const resolvedInitialTransform = trackDrag ? initialTransform : initialTransformRef.current;
    dragOffsetRef.current = { x: resolvedInitialTransform.x, y: resolvedInitialTransform.y };
    setDragOffset({ x: resolvedInitialTransform.x, y: resolvedInitialTransform.y });
    setCurrentSwipeDirection(undefined);
    sawPrimaryButtonsOnMoveRef.current = false;

    const element = elementRef.current;
    if (element) {
      safelyChangePointerCapture(element, event.pointerId, 'releasePointerCapture');
    }

    updateSwipeProgress(0, {
      deltaX: 0,
      deltaY: 0,
      direction: undefined,
    });
  }

  function applyDirectionalDamping(deltaX: number, deltaY: number) {
    const exponent = (value: number) => (value >= 0 ? value ** 0.5 : -(Math.abs(value) ** 0.5));
    const dampAxis = (delta: number, allowNegative: boolean, allowPositive: boolean) => {
      if (!allowNegative && delta < 0) {
        return exponent(delta);
      }
      if (!allowPositive && delta > 0) {
        return exponent(delta);
      }
      return delta;
    };

    const newDeltaX = hasHorizontal ? dampAxis(deltaX, allowLeft, allowRight) : exponent(deltaX);
    const newDeltaY = hasVertical ? dampAxis(deltaY, allowUp, allowDown) : exponent(deltaY);

    return { x: newDeltaX, y: newDeltaY };
  }

  function canSwipeFromScrollEdgeOnPendingMove(
    scrollTarget: HTMLElement,
    deltaX: number,
    deltaY: number,
  ): boolean | null {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const useVerticalAxis =
      hasVertical && deltaY !== 0 && (!hasHorizontal || absDeltaY >= absDeltaX);

    if (useVerticalAxis) {
      const maxScrollTop = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight);
      const atTop = scrollTarget.scrollTop <= 0;
      const atBottom = scrollTarget.scrollTop >= maxScrollTop;
      const movingDown = deltaY > 0;
      const movingUp = deltaY < 0;
      const canSwipeDown = movingDown && atTop && allowDown;
      const canSwipeUp = movingUp && atBottom && allowUp;
      return canSwipeDown || canSwipeUp;
    }

    const useHorizontalAxis =
      hasHorizontal && deltaX !== 0 && (!hasVertical || absDeltaX > absDeltaY);
    if (useHorizontalAxis) {
      const maxScrollLeft = Math.max(0, scrollTarget.scrollWidth - scrollTarget.clientWidth);
      const atLeft = scrollTarget.scrollLeft <= 0;
      const atRight = scrollTarget.scrollLeft >= maxScrollLeft;
      const movingRight = deltaX > 0;
      const movingLeft = deltaX < 0;
      const canSwipeRight = movingRight && atLeft && allowRight;
      const canSwipeLeft = movingLeft && atRight && allowLeft;
      return canSwipeRight || canSwipeLeft;
    }

    return null;
  }

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
    sawPrimaryButtonsOnMoveRef.current = false;

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
      clearPendingSwipeStartState();
    }
  });

  function handleMoveCore(
    event: SwipeDismissMoveEvent,
    position: { x: number; y: number },
    movement: { x: number; y: number },
  ) {
    if (!enabled || !isSwipingRef.current) {
      return;
    }

    const target = getTarget(event.nativeEvent) as HTMLElement | null;
    if (isTouchLikeEvent(event) && !swipeFromScrollableRef.current) {
      const boundaryElement = event.currentTarget as HTMLElement;
      if (findGestureScrollableTouchTarget(target, boundaryElement)) {
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

      if (candidate) {
        const isAllowed =
          (candidate === 'left' && allowLeft) ||
          (candidate === 'right' && allowRight) ||
          (candidate === 'up' && allowUp) ||
          (candidate === 'down' && allowDown);
        if (isAllowed) {
          intendedSwipeDirectionRef.current = candidate;
          maxSwipeDisplacementRef.current = getDisplacement(candidate, deltaX, deltaY);
          setCurrentSwipeDirection(candidate);
          resolveSwipeThreshold(candidate);
        }
      }
    } else {
      const direction = intendedSwipeDirectionRef.current;
      const currentDisplacement = getDisplacement(direction, cancelDeltaX, cancelDeltaY);
      if (currentDisplacement > swipeThresholdRef.current) {
        cancelledSwipeRef.current = false;
        setCurrentSwipeDirection(direction);
      } else if (
        !(allowLeft && allowRight) &&
        !(allowUp && allowDown) &&
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
      if (hasHorizontal) {
        newOffsetX += dampedDelta.x;
      }
    } else if (lockedDirection === 'vertical') {
      if (hasVertical) {
        newOffsetY += dampedDelta.y;
      }
    } else {
      if (hasHorizontal) {
        newOffsetX += dampedDelta.x;
      }
      if (hasVertical) {
        newOffsetY += dampedDelta.y;
      }
    }

    dragOffsetRef.current = { x: newOffsetX, y: newOffsetY };
    if (trackDrag) {
      setDragOffset({ x: newOffsetX, y: newOffsetY });
    }
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
  }

  const handleMove = useStableCallback((event: SwipeDismissMoveEvent) => {
    const currentPos = getPrimaryPointerPosition(event);
    if (!currentPos) {
      return;
    }

    if (!('touches' in event)) {
      const hasPrimaryButton = hasPrimaryMouseButton(event.buttons);
      if (hasPrimaryButton) {
        sawPrimaryButtonsOnMoveRef.current = true;
      }

      // Cancel the swipe if a non-primary button takes over the interaction.
      // This handles cases where a right-click interrupts dragging.
      const lostPrimaryButtonDuringSwipe =
        event.buttons === 0 && sawPrimaryButtonsOnMoveRef.current;
      if ((event.buttons !== 0 && !hasPrimaryButton) || lostPrimaryButtonDuringSwipe) {
        cancelSwipeInteraction(event);
        return;
      }
    }

    if (!isSwiping && pendingSwipeRef.current) {
      if (
        !isTouchLikeEvent(event) &&
        (event.defaultPrevented || event.nativeEvent.defaultPrevented)
      ) {
        resetPendingSwipeState();
        return;
      }

      const allowedToStart = canStart
        ? canStart(currentPos, {
            nativeEvent: event.nativeEvent as SwipeDismissNativeEvent,
            direction: primaryDirection,
          })
        : true;

      if (allowedToStart) {
        const pendingStartPos = pendingSwipeStartPosRef.current;
        let ignoreScrollableOnStart = false;
        if (isTouchLikeEvent(event)) {
          const element = elementRef.current;
          if (pendingStartPos && element) {
            const target = getTargetAtPoint(currentPos, event.nativeEvent);
            const doc = ownerDocument(element);
            const body = doc.body;
            const scrollTarget = body ? findGestureScrollableTouchTarget(target, body) : null;

            if (
              scrollTarget &&
              (contains(element, scrollTarget) || contains(scrollTarget, element))
            ) {
              const deltaX = currentPos.x - pendingStartPos.x;
              const deltaY = currentPos.y - pendingStartPos.y;
              const canSwipeFromEdge = canSwipeFromScrollEdgeOnPendingMove(
                scrollTarget,
                deltaX,
                deltaY,
              );

              if (canSwipeFromEdge === false) {
                return;
              }

              if (canSwipeFromEdge === true) {
                ignoreScrollableOnStart = true;
              }
            }
          }
        }

        const started = startSwipeAtPosition(event, currentPos, {
          ignoreScrollableTarget: ignoreScrollableOnStart,
          ignoreScrollableAncestors: ignoreScrollableOnStart,
        });
        if (started) {
          if (pendingStartPos && ignoreScrollableOnStart) {
            // Preserve displacement between touchstart and the move that activates swipe from
            // a scroll-edge so quick flicks can dismiss.
            clearPendingSwipeStartState();
            dragStartPosRef.current = pendingStartPos;
            swipeCancelBaselineRef.current = pendingStartPos;
            lastMovePosRef.current = pendingStartPos;
            isFirstPointerMoveRef.current = false;
          } else {
            // Start from the current in-bounds position without dropping follow-up move
            // displacement; this avoids jumps when entering from outside the element while
            // keeping swipe tracking responsive on the next move.
            clearPendingSwipeStartState();
            swipeFromScrollableRef.current = false;
          }
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

    const resolvedDragOffset = dragOffsetRef.current;
    const resolvedInitialTransform = initialTransformRef.current;
    const releaseDeltaX = resolvedDragOffset.x - resolvedInitialTransform.x;
    const releaseDeltaY = resolvedDragOffset.y - resolvedInitialTransform.y;
    const progressDetails: SwipeProgressDetailsInternal = {
      deltaX: releaseDeltaX,
      deltaY: releaseDeltaY,
      direction: currentSwipeDirection ?? intendedSwipeDirectionRef.current,
    };

    if (!isSwipingRef.current) {
      resetPendingSwipeState();
      updateSwipeProgress(0, progressDetails);
      return;
    }

    setSwiping(false);
    setIsRealSwipe(false);
    setLockedDirection(null);
    resetPendingSwipeState();
    sawPrimaryButtonsOnMoveRef.current = false;

    const element = elementRef.current;
    if (element) {
      if (!('touches' in event)) {
        safelyChangePointerCapture(element, event.pointerId, 'releasePointerCapture');
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
        const deltaFromLastSampleX = resolvedDragOffset.x - lastSample.x;
        const deltaFromLastSampleY = resolvedDragOffset.y - lastSample.y;
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

    const releaseDecision = onRelease?.({
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
      dragOffsetRef.current = { x: resolvedInitialTransform.x, y: resolvedInitialTransform.y };
      setDragOffset({ x: resolvedInitialTransform.x, y: resolvedInitialTransform.y });
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
      dragOffsetRef.current = { x: resolvedInitialTransform.x, y: resolvedInitialTransform.y };
      setDragOffset({ x: resolvedInitialTransform.x, y: resolvedInitialTransform.y });
      setCurrentSwipeDirection(undefined);
      updateSwipeProgress(0, progressDetails);
    }
  });

  const getDragStyles = React.useCallback((): React.CSSProperties => {
    const resolvedDragOffset = trackDrag ? dragOffset : dragOffsetRef.current;
    const resolvedInitialTransform = trackDrag ? initialTransform : initialTransformRef.current;

    if (
      !isSwiping &&
      resolvedDragOffset.x === resolvedInitialTransform.x &&
      resolvedDragOffset.y === resolvedInitialTransform.y &&
      !dragDismissed
    ) {
      return {
        [movementCssVars.x]: '0px',
        [movementCssVars.y]: '0px',
      } as React.CSSProperties;
    }

    const deltaX = resolvedDragOffset.x - resolvedInitialTransform.x;
    const deltaY = resolvedDragOffset.y - resolvedInitialTransform.y;

    return {
      transition: isSwiping ? 'none' : undefined,
      // While swiping, freeze the element at its current visual transform so it doesn't snap to the
      // end position.
      transform: isSwiping
        ? `translateX(${resolvedDragOffset.x}px) translateY(${resolvedDragOffset.y}px) scale(${resolvedInitialTransform.scale})`
        : undefined,
      [movementCssVars.x]: `${deltaX}px`,
      [movementCssVars.y]: `${deltaY}px`,
    } as React.CSSProperties;
  }, [dragDismissed, dragOffset, initialTransform, isSwiping, movementCssVars, trackDrag]);

  const getPointerProps = React.useCallback(() => {
    if (!enabled) {
      return {};
    }

    return {
      onPointerDown: handleStart,
      onPointerMove: handleMove,
      onPointerUp: handleEnd,
      onPointerCancel: handleEnd,
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
    /**
     * If true, swiping won't start when the gesture begins within a scrollable element.
     * This helps avoid conflicts between scrolling content and swipe-to-dismiss.
     * @default false
     */
    ignoreScrollableAncestors?: boolean | undefined;
    /**
     * If false, touch interactions can start swiping on interactive elements
     * that are ignored during pointer swipes.
     * @default true
     */
    ignoreSelectorWhenTouch?: boolean | undefined;
    /**
     * Whether to update drag offsets in React state on every move.
     * Disable for event-only usage to avoid re-renders.
     * @default true
     */
    trackDrag?: boolean | undefined;
    onSwipeStart?: ((event: PointerEvent | TouchEvent) => void) | undefined;
    onProgress?: ((progress: number, details?: SwipeProgressDetailsInternal) => void) | undefined;
    /**
     * Called when the swipe interaction starts or ends.
     */
    onSwipingChange?: ((swiping: boolean) => void) | undefined;
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
      onPointerCancel?: ((event: React.PointerEvent) => void) | undefined;
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
