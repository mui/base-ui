'use client';
import * as React from 'react';
import { activeElement, contains, getTarget } from '@floating-ui/react/utils';
import { useToastContext } from '../provider/ToastProviderContext';
import type { ToastObject as ToastObjectType } from '../useToastManager';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { ownerDocument } from '../../utils/owner';
import { ToastRootCssVars } from './ToastRootCssVars';
import { mergeProps } from '../../merge-props';
import { useEventCallback } from '../../utils/useEventCallback';
import { ToastRootContext } from './ToastRootContext';

const SWIPE_THRESHOLD = 40;
const REVERSE_CANCEL_THRESHOLD = 10;
const OPPOSITE_DIRECTION_DAMPING_FACTOR = 0.5;
const MIN_DRAG_THRESHOLD = 1;

function getDisplacement(
  direction: 'up' | 'down' | 'left' | 'right',
  deltaX: number,
  deltaY: number,
) {
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

export function useToastRoot(props: useToastRoot.Parameters): useToastRoot.ReturnValue {
  const { toast, swipeDirection } = props;

  const swipeDirections = Array.isArray(swipeDirection) ? swipeDirection : [swipeDirection];

  const { toasts, focused, close, remove, setToasts, pauseTimers, resumeTimers } =
    useToastContext();

  const [renderScreenReaderContent, setRenderScreenReaderContent] = React.useState(false);
  const [currentSwipeDirection, setCurrentSwipeDirection] = React.useState<
    'up' | 'down' | 'left' | 'right' | undefined
  >(undefined);

  const rootRef = React.useRef<HTMLDivElement | null>(null);

  useOpenChangeComplete({
    open: toast.transitionStatus !== 'ending',
    ref: rootRef,
    onComplete() {
      if (toast.transitionStatus === 'ending') {
        remove(toast.id);
      }
    },
  });

  const [isSwiping, setIsSwiping] = React.useState(false);
  const [isRealSwipe, setIsRealSwipe] = React.useState(false);
  const [dragDismissed, setDragDismissed] = React.useState(false);

  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [initialTransform, setInitialTransform] = React.useState({ x: 0, y: 0, scale: 1 });
  const [titleId, setTitleId] = React.useState<string | undefined>();
  const [descriptionId, setDescriptionId] = React.useState<string | undefined>();
  const [lockedDirection, setLockedDirection] = React.useState<'horizontal' | 'vertical' | null>(
    null,
  );

  const dragStartPosRef = React.useRef({ x: 0, y: 0 });
  const initialTransformRef = React.useRef({ x: 0, y: 0, scale: 1 });
  const intendedSwipeDirectionRef = React.useRef<'up' | 'down' | 'left' | 'right' | undefined>(
    undefined,
  );
  const maxSwipeDisplacementRef = React.useRef(0);
  const cancelledSwipeRef = React.useRef(false);
  const swipeCancelBaselineRef = React.useRef({ x: 0, y: 0 });

  const domIndex = React.useMemo(() => toasts.indexOf(toast), [toast, toasts]);
  const visibleIndex = React.useMemo(
    () => toasts.filter((t) => t.transitionStatus !== 'ending').indexOf(toast),
    [toast, toasts],
  );
  const offsetY = React.useMemo(() => {
    return toasts.slice(0, toasts.indexOf(toast)).reduce((acc, t) => acc + (t.height || 0), 0);
  }, [toasts, toast]);

  React.useEffect(() => {
    if (!rootRef.current) {
      return undefined;
    }

    function setHeights() {
      const height = rootRef.current?.offsetHeight;
      setToasts((prev) =>
        prev.map((t) =>
          t.id === toast.id
            ? {
                ...t,
                ref: rootRef,
                height,
                transitionStatus: undefined,
              }
            : t,
        ),
      );
    }

    setHeights();

    if (typeof ResizeObserver === 'function') {
      const resizeObserver = new ResizeObserver(setHeights);
      resizeObserver.observe(rootRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }

    return undefined;
  }, [toast.id, setToasts]);

  function applyDirectionalDamping(deltaX: number, deltaY: number) {
    let newDeltaX = deltaX;
    let newDeltaY = deltaY;

    if (!swipeDirections.includes('left') && !swipeDirections.includes('right')) {
      newDeltaX =
        deltaX > 0
          ? deltaX ** OPPOSITE_DIRECTION_DAMPING_FACTOR
          : -(Math.abs(deltaX) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
    } else {
      if (!swipeDirections.includes('right') && deltaX > 0) {
        newDeltaX = deltaX ** OPPOSITE_DIRECTION_DAMPING_FACTOR;
      }
      if (!swipeDirections.includes('left') && deltaX < 0) {
        newDeltaX = -(Math.abs(deltaX) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
      }
    }

    if (!swipeDirections.includes('up') && !swipeDirections.includes('down')) {
      newDeltaY =
        deltaY > 0
          ? deltaY ** OPPOSITE_DIRECTION_DAMPING_FACTOR
          : -(Math.abs(deltaY) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
    } else {
      if (!swipeDirections.includes('down') && deltaY > 0) {
        newDeltaY = deltaY ** OPPOSITE_DIRECTION_DAMPING_FACTOR;
      }
      if (!swipeDirections.includes('up') && deltaY < 0) {
        newDeltaY = -(Math.abs(deltaY) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
      }
    }

    return { x: newDeltaX, y: newDeltaY };
  }

  const handlePointerDown = useEventCallback((event: React.PointerEvent) => {
    if (event.button !== 0) {
      return;
    }

    if (event.pointerType === 'touch') {
      pauseTimers();
    }

    const target = getTarget(event.nativeEvent) as HTMLElement | null;

    const isInteractiveElement = target
      ? target.closest('button,a,input,textarea,[role="button"],[data-swipe-ignore]')
      : false;

    if (isInteractiveElement) {
      return;
    }

    cancelledSwipeRef.current = false;
    intendedSwipeDirectionRef.current = undefined;
    maxSwipeDisplacementRef.current = 0;
    dragStartPosRef.current = { x: event.clientX, y: event.clientY };
    swipeCancelBaselineRef.current = dragStartPosRef.current;

    if (rootRef.current) {
      const transform = getElementTransform(rootRef.current);
      initialTransformRef.current = transform;
      setInitialTransform(transform);
      setDragOffset({
        x: transform.x,
        y: transform.y,
      });
    }

    setIsSwiping(true);
    setIsRealSwipe(false);
    setLockedDirection(null);

    rootRef.current?.setPointerCapture(event.pointerId);
  });

  const handlePointerMove = useEventCallback((event: React.PointerEvent) => {
    if (!isSwiping) {
      return;
    }

    // Prevent text selection on Safari
    event.preventDefault();

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
          const hasHorizontal =
            swipeDirections.includes('left') || swipeDirections.includes('right');
          const hasVertical = swipeDirections.includes('up') || swipeDirections.includes('down');
          if (hasHorizontal && hasVertical) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            setLockedDirection(absX > absY ? 'horizontal' : 'vertical');
          }
        }
      }
    }

    let candidate: 'up' | 'down' | 'left' | 'right' | undefined;
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

      if (candidate && swipeDirections.includes(candidate)) {
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
        maxSwipeDisplacementRef.current - currentDisplacement >=
        REVERSE_CANCEL_THRESHOLD
      ) {
        // Mark that a change-of-mind has occurred
        cancelledSwipeRef.current = true;
      }
    }

    const dampedDelta = applyDirectionalDamping(deltaX, deltaY);
    let newOffsetX = initialTransformRef.current.x;
    let newOffsetY = initialTransformRef.current.y;

    if (lockedDirection === 'horizontal') {
      if (swipeDirections.includes('left') || swipeDirections.includes('right')) {
        newOffsetX += dampedDelta.x;
      }
    } else if (lockedDirection === 'vertical') {
      if (swipeDirections.includes('up') || swipeDirections.includes('down')) {
        newOffsetY += dampedDelta.y;
      }
    } else {
      if (swipeDirections.includes('left') || swipeDirections.includes('right')) {
        newOffsetX += dampedDelta.x;
      }
      if (swipeDirections.includes('up') || swipeDirections.includes('down')) {
        newOffsetY += dampedDelta.y;
      }
    }

    setDragOffset({ x: newOffsetX, y: newOffsetY });
  });

  const handlePointerUp = useEventCallback((event: React.PointerEvent) => {
    if (!isSwiping) {
      return;
    }

    if (event.pointerType === 'touch' && !focused) {
      resumeTimers();
    }

    setIsSwiping(false);
    setIsRealSwipe(false);
    setLockedDirection(null);

    rootRef.current?.releasePointerCapture(event.pointerId);

    if (cancelledSwipeRef.current) {
      setDragOffset({ x: initialTransform.x, y: initialTransform.y });
      setCurrentSwipeDirection(undefined);
      return;
    }

    let shouldClose = false;
    const deltaX = dragOffset.x - initialTransform.x;
    const deltaY = dragOffset.y - initialTransform.y;
    let dismissDirection: 'up' | 'down' | 'left' | 'right' | undefined;

    for (const direction of swipeDirections) {
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

    if (shouldClose) {
      setCurrentSwipeDirection(dismissDirection);
      setDragDismissed(true);
      close(toast.id);
    } else {
      setDragOffset({ x: initialTransform.x, y: initialTransform.y });
      setCurrentSwipeDirection(undefined);
    }
  });

  const handleKeyDown = useEventCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (
        !rootRef.current ||
        !contains(rootRef.current, activeElement(ownerDocument(rootRef.current)))
      ) {
        return;
      }
      close(toast.id);
    }
  });

  React.useEffect(() => {
    const element = rootRef.current;
    if (!element) {
      return undefined;
    }

    function preventDefaultTouchStart(event: TouchEvent) {
      if (contains(element, event.target as HTMLElement | null)) {
        event.preventDefault();
      }
    }

    element.addEventListener('touchmove', preventDefaultTouchStart, { passive: false });
    return () => {
      element.removeEventListener('touchmove', preventDefaultTouchStart);
    };
  }, []);

  React.useEffect(() => {
    const timeout = setTimeout(
      () => setRenderScreenReaderContent(true),
      // macOS Safari needs some time to pass after the status node has been
      // created before changing its text content to reliably announce its content.
      50,
    );
    return () => clearTimeout(timeout);
  }, []);

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      function getDragStyles() {
        if (
          !isSwiping &&
          dragOffset.x === initialTransform.x &&
          dragOffset.y === initialTransform.y &&
          !dragDismissed
        ) {
          return {
            [ToastRootCssVars.swipeMovementX]: '0px',
            [ToastRootCssVars.swipeMovementY]: '0px',
          };
        }

        const deltaX = dragOffset.x - initialTransform.x;
        const deltaY = dragOffset.y - initialTransform.y;

        return {
          transition: isSwiping ? 'none' : undefined,
          [ToastRootCssVars.swipeMovementX]: `${deltaX}px`,
          [ToastRootCssVars.swipeMovementY]: `${deltaY}px`,
        };
      }

      return mergeProps(
        {
          role: toast.priority === 'high' ? 'alertdialog' : 'dialog',
          tabIndex: 0,
          'aria-modal': false,
          'aria-labelledby': titleId,
          'aria-describedby': descriptionId,
          onPointerDown: handlePointerDown,
          onPointerMove: handlePointerMove,
          onPointerUp: handlePointerUp,
          onKeyDown: handleKeyDown,
          style: {
            ...getDragStyles(),
            [ToastRootCssVars.index]: toast.transitionStatus === 'ending' ? domIndex : visibleIndex,
            [ToastRootCssVars.offsetY]: `${offsetY}px`,
          },
        },
        externalProps,
      );
    },
    [
      toast.priority,
      toast.transitionStatus,
      titleId,
      descriptionId,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handleKeyDown,
      domIndex,
      visibleIndex,
      offsetY,
      isSwiping,
      dragOffset,
      initialTransform,
      dragDismissed,
    ],
  );

  return React.useMemo(
    () => ({
      rootRef,
      renderScreenReaderContent,
      toast,
      getRootProps,
      titleId,
      setTitleId,
      descriptionId,
      setDescriptionId,
      swiping: isSwiping,
      swipeDirection: currentSwipeDirection,
    }),
    [
      renderScreenReaderContent,
      toast,
      getRootProps,
      titleId,
      descriptionId,
      isSwiping,
      currentSwipeDirection,
    ],
  );
}

export namespace useToastRoot {
  export type ToastObject<Data extends object = any> = ToastObjectType<Data>;

  export interface Parameters {
    toast: ToastObject<any>;
    swipeDirection?: 'up' | 'down' | 'left' | 'right' | ('up' | 'down' | 'left' | 'right')[];
  }

  export interface ReturnValue extends ToastRootContext {
    rootRef: React.RefObject<HTMLDivElement | null>;
    renderScreenReaderContent: boolean;
    toast: ToastObject<any>;
    getRootProps: (externalProps?: any) => any;
    titleId: string | undefined;
    setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
    descriptionId: string | undefined;
    swiping: boolean;
    swipeDirection: 'up' | 'down' | 'left' | 'right' | undefined;
  }
}
