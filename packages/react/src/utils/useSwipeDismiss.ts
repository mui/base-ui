'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { contains, getTarget } from '../floating-ui-react/utils';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

const SWIPE_THRESHOLD = 40;
const REVERSE_CANCEL_THRESHOLD = 10;
const MIN_DRAG_THRESHOLD = 1;

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

type ScrollAxis = 'horizontal' | 'vertical';

function isScrollable(element: HTMLElement, axis: ScrollAxis) {
  const style = window.getComputedStyle(element);
  if (axis === 'vertical') {
    const overflowY = style.overflowY;
    return (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      element.scrollHeight > element.clientHeight
    );
  }

  const overflowX = style.overflowX;
  return (
    (overflowX === 'auto' || overflowX === 'scroll') && element.scrollWidth > element.clientWidth
  );
}

function hasScrollableAncestor(
  target: HTMLElement,
  root: HTMLElement,
  axes: ScrollAxis[],
): boolean {
  let node: HTMLElement | null = target;
  while (node && node !== root) {
    for (const axis of axes) {
      if (isScrollable(node, axis)) {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

export function useSwipeDismiss(options: useSwipeDismiss.Options): useSwipeDismiss.ReturnValue {
  const {
    enabled,
    directions,
    elementRef,
    movementCssVars,
    ignoreSelector = 'button,a,input,textarea,[role="button"],[data-swipe-ignore]',
    ignoreScrollableAncestors = false,
    oppositeDirectionDamping = 'exponential',
    onDismiss,
    onSwipeStart,
    onTouchSwipeStart,
  } = options;

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
  const initialTransformRef = React.useRef({ x: 0, y: 0, scale: 1 });
  const intendedSwipeDirectionRef = React.useRef<SwipeDirection | undefined>(undefined);
  const maxSwipeDisplacementRef = React.useRef(0);
  const cancelledSwipeRef = React.useRef(false);
  const swipeCancelBaselineRef = React.useRef({ x: 0, y: 0 });
  const isFirstPointerMoveRef = React.useRef(false);

  const reset = React.useCallback(() => {
    setCurrentSwipeDirection(undefined);
    setIsSwiping(false);
    setIsRealSwipe(false);
    setDragDismissed(false);
    setDragOffset({ x: 0, y: 0 });
    setInitialTransform({ x: 0, y: 0, scale: 1 });
    setLockedDirection(null);

    dragStartPosRef.current = { x: 0, y: 0 };
    initialTransformRef.current = { x: 0, y: 0, scale: 1 };
    intendedSwipeDirectionRef.current = undefined;
    maxSwipeDisplacementRef.current = 0;
    cancelledSwipeRef.current = false;
    swipeCancelBaselineRef.current = { x: 0, y: 0 };
    isFirstPointerMoveRef.current = false;
  }, []);

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

  const handlePointerDown = useStableCallback((event: React.PointerEvent) => {
    if (!enabled) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    const target = getTarget(event.nativeEvent) as HTMLElement | null;

    const isInteractiveElement = target ? target.closest(ignoreSelector) : false;
    if (isInteractiveElement) {
      return;
    }

    const element = elementRef.current;
    if (ignoreScrollableAncestors && event.pointerType !== 'mouse' && element && target) {
      const axes: ScrollAxis[] = [];
      if (directions.includes('up') || directions.includes('down')) {
        axes.push('vertical');
      }
      if (directions.includes('left') || directions.includes('right')) {
        axes.push('horizontal');
      }

      if (axes.length > 0 && hasScrollableAncestor(target, element, axes)) {
        return;
      }
    }

    if (event.pointerType === 'touch') {
      onTouchSwipeStart?.(event.nativeEvent);
    }

    cancelledSwipeRef.current = false;
    intendedSwipeDirectionRef.current = undefined;
    maxSwipeDisplacementRef.current = 0;
    dragStartPosRef.current = { x: event.clientX, y: event.clientY };
    swipeCancelBaselineRef.current = dragStartPosRef.current;

    if (element) {
      const transform = getElementTransform(element);
      initialTransformRef.current = transform;
      setInitialTransform(transform);
      setDragOffset({ x: transform.x, y: transform.y });
      safelySetPointerCapture(element, event.pointerId);
    }

    onSwipeStart?.(event.nativeEvent);

    setIsSwiping(true);
    setIsRealSwipe(false);
    setLockedDirection(null);
    isFirstPointerMoveRef.current = true;
  });

  const handlePointerMove = useStableCallback((event: React.PointerEvent) => {
    if (!enabled || !isSwiping) {
      return;
    }

    // Prevent text selection on Safari
    event.preventDefault();

    if (isFirstPointerMoveRef.current) {
      // Adjust the starting position to the current position on the first move
      // to account for the delay between pointerdown and the first pointermove on iOS.
      dragStartPosRef.current = { x: event.clientX, y: event.clientY };
      isFirstPointerMoveRef.current = false;
    }

    const { clientY, clientX, movementX, movementY } = event;

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
      }
    } else {
      const direction = intendedSwipeDirectionRef.current;
      const currentDisplacement = getDisplacement(direction, cancelDeltaX, cancelDeltaY);
      if (currentDisplacement > SWIPE_THRESHOLD) {
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
  });

  const handlePointerUp = useStableCallback((event: React.PointerEvent) => {
    if (!enabled || !isSwiping) {
      return;
    }

    setIsSwiping(false);
    setIsRealSwipe(false);
    setLockedDirection(null);

    const element = elementRef.current;
    if (element) {
      safelyReleasePointerCapture(element, event.pointerId);
    }

    if (cancelledSwipeRef.current) {
      setDragOffset({ x: initialTransform.x, y: initialTransform.y });
      setCurrentSwipeDirection(undefined);
      return;
    }

    let shouldClose = false;
    const deltaX = dragOffset.x - initialTransform.x;
    const deltaY = dragOffset.y - initialTransform.y;
    let dismissDirection: SwipeDirection | undefined;

    for (const direction of directions) {
      switch (direction) {
        case 'right':
          if (deltaX > SWIPE_THRESHOLD) {
            shouldClose = true;
            dismissDirection = 'right';
          }
          break;
        case 'left':
          if (deltaX < -SWIPE_THRESHOLD) {
            shouldClose = true;
            dismissDirection = 'left';
          }
          break;
        case 'down':
          if (deltaY > SWIPE_THRESHOLD) {
            shouldClose = true;
            dismissDirection = 'down';
          }
          break;
        case 'up':
          if (deltaY < -SWIPE_THRESHOLD) {
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

    if (shouldClose && dismissDirection) {
      setCurrentSwipeDirection(dismissDirection);
      setDragDismissed(true);
      onDismiss?.(dismissDirection, event.nativeEvent);
    } else {
      setDragOffset({ x: initialTransform.x, y: initialTransform.y });
      setCurrentSwipeDirection(undefined);
    }
  });

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const element = elementRef.current;
    if (!element) {
      return undefined;
    }

    function preventDefaultTouchMove(event: TouchEvent) {
      if (!isSwiping || !intendedSwipeDirectionRef.current) {
        return;
      }
      if (contains(element, getTarget(event) as HTMLElement | null)) {
        event.preventDefault();
      }
    }

    element.addEventListener('touchmove', preventDefaultTouchMove, { passive: false });
    return () => {
      element.removeEventListener('touchmove', preventDefaultTouchMove);
    };
  }, [elementRef, enabled, isSwiping]);

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
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    } as const;
  }, [enabled, handlePointerDown, handlePointerMove, handlePointerUp]);

  return {
    swiping: isSwiping,
    swipeDirection: currentSwipeDirection,
    dragDismissed,
    getPointerProps,
    getDragStyles,
    reset,
  };
}

export namespace useSwipeDismiss {
  export interface Options {
    enabled: boolean;
    directions: SwipeDirection[];
    elementRef: React.RefObject<HTMLElement | null>;
    movementCssVars: { x: string; y: string };
    ignoreSelector?: string;
    /**
     * If true, swiping won't start when the gesture begins within a scrollable element.
     * This helps avoid conflicts between scrolling content and swipe-to-dismiss.
     * @default false
     */
    ignoreScrollableAncestors?: boolean;
    oppositeDirectionDamping?: 'exponential' | 'none';
    onSwipeStart?: (event: PointerEvent) => void;
    onTouchSwipeStart?: (event: PointerEvent) => void;
    onDismiss?: (direction: SwipeDirection, event: PointerEvent) => void;
  }

  export interface ReturnValue {
    swiping: boolean;
    swipeDirection: SwipeDirection | undefined;
    dragDismissed: boolean;
    getPointerProps: () => {
      onPointerDown?: (event: React.PointerEvent) => void;
      onPointerMove?: (event: React.PointerEvent) => void;
      onPointerUp?: (event: React.PointerEvent) => void;
    };
    getDragStyles: () => React.CSSProperties;
    reset: () => void;
  }
}
