'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { activeElement, contains, getTarget } from '@floating-ui/react/utils';
import { useToastContext } from '../provider/ToastProviderContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { ToastObject as ToastObjectType } from '../useToast';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { ToastRootContext } from './ToastRootContext';
import { useForkRef } from '../../utils/useForkRef';
import { mergeProps } from '../../merge-props';
import { ToastRootCssVars } from './ToastRootCssVars';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { ownerDocument } from '../../utils/owner';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { ToastRootDataAttributes } from './ToastRootDataAttributes';

const SWIPE_THRESHOLD = 15;
const REVERSE_CANCEL_THRESHOLD = 10;
const OPPOSITE_DIRECTION_DAMPING_FACTOR = 0.5;
const MIN_DRAG_THRESHOLD = 0;

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

/**
 * Groups all parts of an individual toast.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastRoot = React.forwardRef(function ToastRoot(
  props: ToastRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { toast, render, className, children, swipeDirection = 'up', ...other } = props;

  const swipeDirections = Array.isArray(swipeDirection) ? swipeDirection : [swipeDirection];

  const { toasts, hovering, focused, close, remove, setToasts, pauseTimers, resumeTimers } =
    useToastContext();

  const [renderChildren, setRenderChildren] = React.useState(false);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const mergedRef = useForkRef(rootRef, forwardedRef);

  useOpenChangeComplete({
    open: toast.transitionStatus !== 'ending',
    ref: rootRef,
    onComplete() {
      if (toast.transitionStatus === 'ending') {
        remove(toast.id);
      }
    },
  });

  const [isDragging, setIsDragging] = React.useState(false);
  const [isRealDrag, setIsRealDrag] = React.useState(false);
  const [dragDismissed, setDragDismissed] = React.useState(false);

  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [swipeState, setSwipeState] = React.useState<'start' | 'move' | 'end' | 'cancel' | null>(
    null,
  );
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
  const offset = React.useMemo(() => {
    return toasts.slice(0, toasts.indexOf(toast)).reduce((acc, t) => acc + (t.height || 0), 0);
  }, [toasts, toast]);

  // It's not possible to stack a smaller height toast onto a larger height toast, but
  // the reverse is possible. For simplicity, we'll enforce the expanded state if the
  // toasts aren't all the same height.
  const hasDifferingHeights = React.useMemo(() => {
    return toasts.some((t) => t.height !== 0 && toast.height !== 0 && t.height !== toast.height);
  }, [toast, toasts]);

  const state: ToastRoot.State = React.useMemo(
    () => ({
      transitionStatus: toast.transitionStatus,
      expanded: hovering || focused || hasDifferingHeights,
      limited: toast.limited || false,
    }),
    [toast.transitionStatus, toast.limited, hovering, focused, hasDifferingHeights],
  );

  useEnhancedEffect(() => {
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

    const target = getTarget(event.nativeEvent) as Element | null;

    const isInteractiveElement = !!target?.closest('button,a,input,[role="button"]');

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

    setIsDragging(true);
    setIsRealDrag(false);
    setLockedDirection(null);
    setSwipeState('start');

    rootRef.current?.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!isDragging) {
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

    if (!isRealDrag) {
      const movementDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (movementDistance >= MIN_DRAG_THRESHOLD) {
        setIsRealDrag(true);
        setSwipeState('move');
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
        if (deltaY > 0) {
          candidate = 'right';
        } else if (deltaY < 0) {
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
      }
    } else {
      const direction = intendedSwipeDirectionRef.current;
      const currentDisplacement = getDisplacement(direction, cancelDeltaX, cancelDeltaY);
      if (currentDisplacement > SWIPE_THRESHOLD) {
        cancelledSwipeRef.current = false;
      } else if (
        maxSwipeDisplacementRef.current - currentDisplacement >=
        REVERSE_CANCEL_THRESHOLD
      ) {
        // Mark that a change-of-mind has occurred
        cancelledSwipeRef.current = true;
        setSwipeState('cancel');
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
    if (!isDragging) {
      return;
    }

    if (event.pointerType === 'touch' && !focused) {
      resumeTimers();
    }

    setIsDragging(false);
    setIsRealDrag(false);
    setLockedDirection(null);

    rootRef.current?.releasePointerCapture(event.pointerId);

    if (cancelledSwipeRef.current) {
      setSwipeState('cancel');
      setDragOffset({
        x: initialTransform.x,
        y: initialTransform.y,
      });
      return;
    }

    let shouldClose = false;
    const deltaX = dragOffset.x - initialTransform.x;
    const deltaY = dragOffset.y - initialTransform.y;

    for (const direction of swipeDirections) {
      switch (direction) {
        case 'right':
          if (deltaX > SWIPE_THRESHOLD) {
            shouldClose = true;
          }
          break;
        case 'left':
          if (deltaX < -SWIPE_THRESHOLD) {
            shouldClose = true;
          }
          break;
        case 'down':
          if (deltaY > SWIPE_THRESHOLD) {
            shouldClose = true;
          }
          break;
        case 'up':
          if (deltaY < -SWIPE_THRESHOLD) {
            shouldClose = true;
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
      setDragDismissed(true);
      setSwipeState('end');
      close(toast.id);
    } else {
      setDragOffset({
        x: initialTransform.x,
        y: initialTransform.y,
      });
      setSwipeState('cancel');
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
    const element = rootRef.current;
    if (!element) {
      return undefined;
    }

    function preventDefaultTouchStart(event: TouchEvent) {
      if (contains(element, getTarget(event) as HTMLElement | null)) {
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
      () => setRenderChildren(true),
      // macOS Safari needs some time to pass after the status node has been
      // created before changing its text content to reliably announce its content.
      50,
    );
    return () => clearTimeout(timeout);
  }, []);

  function getDragStyles() {
    if (
      !isDragging &&
      dragOffset.x === initialTransform.x &&
      dragOffset.y === initialTransform.y &&
      !dragDismissed
    ) {
      return {
        [ToastRootCssVars.swipeMoveX]: '0px',
        [ToastRootCssVars.swipeMoveY]: '0px',
      };
    }

    const deltaX = dragOffset.x - initialTransform.x;
    const deltaY = dragOffset.y - initialTransform.y;
    let currentSwipeDirection: 'up' | 'down' | 'left' | 'right' | undefined;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      currentSwipeDirection = deltaX > 0 ? 'right' : 'left';
    } else {
      currentSwipeDirection = deltaY > 0 ? 'down' : 'up';
    }

    if (currentSwipeDirection && !swipeDirections.includes(currentSwipeDirection)) {
      currentSwipeDirection = undefined;
    }

    return {
      transition: isDragging ? 'none' : undefined,
      [ToastRootCssVars.swipeMoveX]: `${deltaX}px`,
      [ToastRootCssVars.swipeMoveY]: `${deltaY}px`,
    } as const;
  }

  function getSwipeDirection(): 'up' | 'down' | 'left' | 'right' | undefined {
    if (!isRealDrag && !dragDismissed) {
      return undefined;
    }

    const deltaX = dragOffset.x - initialTransform.x;
    const deltaY = dragOffset.y - initialTransform.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    }

    return deltaY > 0 ? 'down' : 'up';
  }

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: mergedRef,
    className,
    state,
    customStyleHookMapping: transitionStatusMapping,
    extraProps: mergeProps(
      {
        role: toast.priority === 'high' ? 'alertdialog' : 'dialog',
        tabIndex: 0,
        'aria-modal': false,
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId,
        [ToastRootDataAttributes.swipe]: swipeState,
        [ToastRootDataAttributes.swipeDirection]: getSwipeDirection(),
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onKeyDown: handleKeyDown,
        style: {
          ...getDragStyles(),
          [ToastRootCssVars.index]: toast.transitionStatus === 'ending' ? domIndex : visibleIndex,
          [ToastRootCssVars.offset]: `${offset}px`,
        },
        // Screen readers won't announce the text upon DOM insertion of the component.
        // We need to wait until the next tick to render the children so that screen
        // readers can announce the contents.
        children: (
          <React.Fragment>
            {children}
            {!focused && (
              <div
                style={visuallyHidden}
                {...(toast.priority === 'high'
                  ? { role: 'alert', 'aria-atomic': true }
                  : { role: 'status', 'aria-live': 'polite' })}
              >
                {renderChildren && (
                  <React.Fragment>
                    {toast.title && <div>{toast.title}</div>}
                    {toast.description && <div>{toast.description}</div>}
                  </React.Fragment>
                )}
              </div>
            )}
          </React.Fragment>
        ),
      },
      other,
    ),
  });

  const contextValue: ToastRootContext = React.useMemo(
    () => ({
      toast,
      rootRef,
      titleId,
      setTitleId,
      descriptionId,
      setDescriptionId,
    }),
    [toast, rootRef, titleId, setTitleId, descriptionId, setDescriptionId],
  );

  return (
    <ToastRootContext.Provider value={contextValue}>{renderElement()}</ToastRootContext.Provider>
  );
});

export namespace ToastRoot {
  export type ToastObject<Data extends object = any> = ToastObjectType<Data>;

  export interface State {
    transitionStatus: TransitionStatus;
    expanded: boolean;
    limited: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The toast to render.
     */
    toast: ToastObject<any>;
    /**
     * Direction(s) in which the toast can be swiped to dismiss.
     * @default 'up'
     */
    swipeDirection?: 'up' | 'down' | 'left' | 'right' | ('up' | 'down' | 'left' | 'right')[];
  }
}

ToastRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Direction(s) in which the toast can be swiped to dismiss.
   * @default 'up'
   */
  swipeDirection: PropTypes.oneOfType([
    PropTypes.oneOf(['down', 'left', 'right', 'up']),
    PropTypes.arrayOf(PropTypes.oneOf(['down', 'left', 'right', 'up']).isRequired),
  ]),
  /**
   * The toast to render.
   */
  toast: PropTypes.shape({
    actionProps: PropTypes.object,
    animation: PropTypes.oneOf(['ending', 'starting']),
    data: PropTypes.any,
    description: PropTypes.string,
    height: PropTypes.number,
    id: PropTypes.string.isRequired,
    onClose: PropTypes.func,
    onRemove: PropTypes.func,
    priority: PropTypes.oneOf(['high', 'low']),
    timeout: PropTypes.number,
    title: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
} as any;

export { ToastRoot };
