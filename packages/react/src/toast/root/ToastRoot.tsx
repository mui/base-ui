'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { inertValue } from '@base-ui/utils/inertValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { activeElement, contains, getTarget } from '../../floating-ui-react/utils';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import type { ToastObject as ToastObjectType } from '../useToastManager';
import { ToastRootContext } from './ToastRootContext';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useToastContext } from '../provider/ToastProviderContext';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useRenderElement } from '../../utils/useRenderElement';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { ToastRootCssVars } from './ToastRootCssVars';

const stateAttributesMapping: StateAttributesMapping<ToastRoot.State> = {
  ...transitionStatusMapping,
  swipeDirection(value) {
    return value ? { 'data-swipe-direction': value } : null;
  },
};

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

/**
 * Groups all parts of an individual toast.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export const ToastRoot = React.forwardRef(function ToastRoot(
  componentProps: ToastRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    toast,
    render,
    className,
    swipeDirection = ['down', 'right'],
    ...elementProps
  } = componentProps;

  const isAnchored = toast.positionerProps?.anchor !== undefined;

  let swipeDirections: ('up' | 'down' | 'left' | 'right')[] = [];
  if (!isAnchored) {
    swipeDirections = Array.isArray(swipeDirection) ? swipeDirection : [swipeDirection];
  }

  const swipeEnabled = swipeDirections.length > 0;

  const { toasts, focused, close, remove, setToasts, pauseTimers, expanded, setHovering } =
    useToastContext();

  const [currentSwipeDirection, setCurrentSwipeDirection] = React.useState<
    'up' | 'down' | 'left' | 'right' | undefined
  >(undefined);
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

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const dragStartPosRef = React.useRef({ x: 0, y: 0 });
  const initialTransformRef = React.useRef({ x: 0, y: 0, scale: 1 });
  const intendedSwipeDirectionRef = React.useRef<'up' | 'down' | 'left' | 'right' | undefined>(
    undefined,
  );
  const maxSwipeDisplacementRef = React.useRef(0);
  const cancelledSwipeRef = React.useRef(false);
  const swipeCancelBaselineRef = React.useRef({ x: 0, y: 0 });
  const isFirstPointerMoveRef = React.useRef(false);

  const domIndex = React.useMemo(() => toasts.indexOf(toast), [toast, toasts]);
  const visibleIndex = React.useMemo(
    () => toasts.filter((t) => t.transitionStatus !== 'ending').indexOf(toast),
    [toast, toasts],
  );
  const offsetY = React.useMemo(() => {
    return toasts.slice(0, toasts.indexOf(toast)).reduce((acc, t) => acc + (t.height || 0), 0);
  }, [toasts, toast]);

  useOpenChangeComplete({
    open: toast.transitionStatus !== 'ending',
    ref: rootRef,
    onComplete() {
      if (toast.transitionStatus === 'ending') {
        remove(toast.id);
      }
    },
  });

  /**
   * Recalculates the natural height of the toast and updates it in the toast manager.
   * @param flushSync Whether to flush the update synchronously. Use in observer
   * callbacks to avoid visual flickers.
   */
  const recalculateHeight = useStableCallback((flushSync: boolean = false) => {
    const element = rootRef.current;
    if (!element) {
      return;
    }

    const previousHeight = element.style.height;
    element.style.height = 'auto';
    const height = element.offsetHeight;
    element.style.height = previousHeight;

    function update() {
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

    if (flushSync) {
      ReactDOM.flushSync(update);
    } else {
      update();
    }
  });

  useIsoLayoutEffect(recalculateHeight, [recalculateHeight]);

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

  function handlePointerDown(event: React.PointerEvent) {
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

    setHovering(true);
    setIsSwiping(true);
    setIsRealSwipe(false);
    setLockedDirection(null);
    isFirstPointerMoveRef.current = true;

    rootRef.current?.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!isSwiping) {
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
        !(swipeDirections.includes('left') && swipeDirections.includes('right')) &&
        !(swipeDirections.includes('up') && swipeDirections.includes('down')) &&
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
  }

  function handlePointerUp(event: React.PointerEvent) {
    if (!isSwiping) {
      return;
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
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      if (
        !rootRef.current ||
        !contains(rootRef.current, activeElement(ownerDocument(rootRef.current)))
      ) {
        return;
      }
      close(toast.id);
    }
  }

  React.useEffect(() => {
    if (!swipeEnabled) {
      return undefined;
    }

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
  }, [swipeEnabled]);

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
      // While swiping, freeze the element at its current visual transform so it doesn't snap to the
      // end position.
      transform: isSwiping
        ? `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) scale(${initialTransform.scale})`
        : undefined,
      [ToastRootCssVars.swipeMovementX]: `${deltaX}px`,
      [ToastRootCssVars.swipeMovementY]: `${deltaY}px`,
    };
  }

  const isHighPriority = toast.priority === 'high';

  const defaultProps: HTMLProps = {
    role: isHighPriority ? 'alertdialog' : 'dialog',
    tabIndex: 0,
    'aria-modal': false,
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId,
    'aria-hidden': isHighPriority && !focused ? true : undefined,
    onPointerDown: swipeEnabled ? handlePointerDown : undefined,
    onPointerMove: swipeEnabled ? handlePointerMove : undefined,
    onPointerUp: swipeEnabled ? handlePointerUp : undefined,
    onKeyDown: handleKeyDown,
    inert: inertValue(toast.limited),
    style: {
      ...getDragStyles(),
      [ToastRootCssVars.index as string]:
        toast.transitionStatus === 'ending' ? domIndex : visibleIndex,
      [ToastRootCssVars.offsetY as string]: `${offsetY}px`,
      [ToastRootCssVars.height as string]: toast.height ? `${toast.height}px` : undefined,
    },
  };

  const toastRoot: ToastRootContext = React.useMemo(
    () => ({
      rootRef,
      toast,
      titleId,
      setTitleId,
      descriptionId,
      setDescriptionId,
      swiping: isSwiping,
      swipeDirection: currentSwipeDirection,
      recalculateHeight,
      index: domIndex,
      visibleIndex,
      expanded,
    }),
    [
      toast,
      titleId,
      descriptionId,
      isSwiping,
      currentSwipeDirection,
      recalculateHeight,
      domIndex,
      visibleIndex,
      expanded,
    ],
  );

  const state: ToastRoot.State = {
    transitionStatus: toast.transitionStatus,
    expanded,
    limited: toast.limited || false,
    type: toast.type,
    swiping: toastRoot.swiping,
    swipeDirection: toastRoot.swipeDirection,
  };

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, toastRoot.rootRef],
    state,
    stateAttributesMapping,
    props: [defaultProps, elementProps],
  });

  return <ToastRootContext.Provider value={toastRoot}>{element}</ToastRootContext.Provider>;
});

export type ToastRootToastObject<Data extends object = any> = ToastObjectType<Data>;
export interface ToastRootState {
  transitionStatus: TransitionStatus;
  /** Whether the toasts in the viewport are expanded. */
  expanded: boolean;
  /** Whether the toast was removed due to exceeding the limit. */
  limited: boolean;
  /** The type of the toast. */
  type: string | undefined;
  /** Whether the toast is being swiped. */
  swiping: boolean;
  /** The direction the toast is being swiped. */
  swipeDirection: 'up' | 'down' | 'left' | 'right' | undefined;
}
export interface ToastRootProps extends BaseUIComponentProps<'div', ToastRoot.State> {
  /**
   * The toast to render.
   */
  toast: ToastRootToastObject<any>;
  /**
   * Direction(s) in which the toast can be swiped to dismiss.
   * @default ['down', 'right']
   */
  swipeDirection?:
    | ('up' | 'down' | 'left' | 'right' | ('up' | 'down' | 'left' | 'right')[])
    | undefined;
}

export namespace ToastRoot {
  export type ToastObject<Data extends object = any> = ToastRootToastObject<Data>;
  export type State = ToastRootState;
  export type Props = ToastRootProps;
}
