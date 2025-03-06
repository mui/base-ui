'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { activeElement, contains, getTarget } from '@floating-ui/react/utils';
import { useToastContext } from '../provider/ToastProviderContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Toast } from '../useToast';
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

const SWIPE_THRESHOLD = 20;
const OPPOSITE_DIRECTION_DAMPING_FACTOR = 0.5;
const MIN_DRAG_THRESHOLD = 5;

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
  const { toast, render, className, swipeDirection = 'up', ...other } = props;

  const swipeDirections = Array.isArray(swipeDirection) ? swipeDirection : [swipeDirection];

  const { toasts, hovering, focused, finalizeRemove, setToasts, remove } = useToastContext();

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const mergedRef = useForkRef(rootRef, forwardedRef);

  useOpenChangeComplete({
    open: toast.animation !== 'ending',
    ref: rootRef,
    onComplete() {
      if (toast.animation === 'ending') {
        finalizeRemove(toast.id);
      }
    },
  });

  const [isDragging, setIsDragging] = React.useState(false);
  const [isRealDrag, setIsRealDrag] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [dragDismissed, setDragDismissed] = React.useState(false);
  const [initialTransform, setInitialTransform] = React.useState({ x: 0, y: 0, scale: 1 });
  const [titleId, setTitleId] = React.useState<string | undefined>();
  const [descriptionId, setDescriptionId] = React.useState<string | undefined>();
  const [lockedDirection, setLockedDirection] = React.useState<'horizontal' | 'vertical' | null>(
    null,
  );

  const dragStartPosRef = React.useRef({ x: 0, y: 0 });
  const initialTransformRef = React.useRef({ x: 0, y: 0, scale: 1 });
  const dragHistoryRef = React.useRef<Array<{ x: number; y: number; time: number }>>([]);

  const domIndex = React.useMemo(() => toasts.indexOf(toast), [toast, toasts]);
  const index = React.useMemo(
    () => toasts.filter((t) => t.animation !== 'ending').indexOf(toast),
    [toast, toasts],
  );
  const hasDifferingHeights = React.useMemo(() => {
    return toasts.some((t) => t.height !== 0 && toast.height !== 0 && t.height !== toast.height);
  }, [toast, toasts]);

  const state: ToastRoot.State = React.useMemo(
    () => ({
      transitionStatus: toast.animation,
      expanded: hovering || focused || hasDifferingHeights,
    }),
    [toast.animation, hovering, focused, hasDifferingHeights],
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
                height,
                animation: undefined,
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

  // Calculate offset based on heights of previous toasts
  const offset = React.useMemo(() => {
    const i = toasts.findIndex((t) => t.id === toast.id);
    return toasts.slice(0, i).reduce((acc, t) => acc + (t.height ?? 0), 0);
  }, [toasts, toast.id]);

  function getElementTransform(element: HTMLElement) {
    const computedStyle = window.getComputedStyle(element);
    const transform = computedStyle.transform;

    let translateX = 0;
    let translateY = 0;
    let scale = 1;

    // Parse transform matrix if it exists
    if (transform && transform !== 'none') {
      const matrix = transform.match(/matrix(?:3d)?\(([^)]+)\)/);
      if (matrix) {
        const values = matrix[1].split(', ').map(parseFloat);

        // Handle both 2D (6 values) and 3D (16 values) matrices
        if (values.length === 6) {
          // 2D matrix: matrix(a, b, c, d, tx, ty)
          translateX = values[4];
          translateY = values[5];
          // Calculate scale from the matrix (approximate)
          scale = Math.sqrt(values[0] * values[0] + values[1] * values[1]);
        } else if (values.length === 16) {
          // 3D matrix: matrix3d(...)
          translateX = values[12];
          translateY = values[13];
          scale = values[0]; // Simplified scale calculation
        }
      }
    }

    return { x: translateX, y: translateY, scale };
  }

  function applyDirectionalDamping(deltaX: number, deltaY: number) {
    let newDeltaX = deltaX;
    let newDeltaY = deltaY;

    // If horizontal direction is not allowed, apply damping to X movements
    if (!swipeDirections.includes('left') && !swipeDirections.includes('right')) {
      newDeltaX =
        deltaX > 0
          ? deltaX ** OPPOSITE_DIRECTION_DAMPING_FACTOR
          : -(Math.abs(deltaX) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
    } else {
      // Apply damping based on allowed directions
      if (!swipeDirections.includes('right') && deltaX > 0) {
        newDeltaX = deltaX ** OPPOSITE_DIRECTION_DAMPING_FACTOR;
      }
      if (!swipeDirections.includes('left') && deltaX < 0) {
        newDeltaX = -(Math.abs(deltaX) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
      }
    }

    // If vertical direction is not allowed, apply damping to Y movements
    if (!swipeDirections.includes('up') && !swipeDirections.includes('down')) {
      newDeltaY =
        deltaY > 0
          ? deltaY ** OPPOSITE_DIRECTION_DAMPING_FACTOR
          : -(Math.abs(deltaY) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
    } else {
      // Apply damping based on allowed directions
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
    // Only handle left clicks or touch
    if (event.button !== 0) {
      return;
    }

    // Check if the event target is (or is inside) an interactive element (button, a, input, etc.)
    // If so, don't initiate dragging to allow normal click behavior
    const target = event.target as HTMLElement;
    const isInteractiveElement =
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.closest('button,a,input,[role="button"]') !== null;

    if (isInteractiveElement) {
      return;
    }

    dragStartPosRef.current = { x: event.clientX, y: event.clientY };

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

    if (rootRef.current) {
      rootRef.current.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!isDragging) {
      return;
    }

    // Record position for velocity calculation
    dragHistoryRef.current.push({
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
    });

    if (dragHistoryRef.current.length > 5) {
      dragHistoryRef.current.shift();
    }

    const deltaX = event.clientX - dragStartPosRef.current.x;
    const deltaY = event.clientY - dragStartPosRef.current.y;

    if (!isRealDrag) {
      const movementDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (movementDistance >= MIN_DRAG_THRESHOLD) {
        setIsRealDrag(true);

        if (lockedDirection === null) {
          // Only lock a direction if multiple directions are allowed
          const hasHorizontalDirections =
            swipeDirections.includes('left') || swipeDirections.includes('right');
          const hasVerticalDirections =
            swipeDirections.includes('up') || swipeDirections.includes('down');

          if (hasHorizontalDirections && hasVerticalDirections) {
            // Determine the primary direction based on which has greater movement
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            setLockedDirection(absX > absY ? 'horizontal' : 'vertical');
          }
        }
      }
    }

    // Apply damping to opposite direction movements
    const dampedDelta = applyDirectionalDamping(deltaX, deltaY);

    let newOffsetX = initialTransformRef.current.x;
    let newOffsetY = initialTransformRef.current.y;

    // If we have a locked direction, only allow movement in that direction
    if (lockedDirection === 'horizontal') {
      // Only allow x movement
      if (swipeDirections.includes('left') || swipeDirections.includes('right')) {
        newOffsetX += dampedDelta.x;
      }
    } else if (lockedDirection === 'vertical') {
      // Only allow y movement
      if (swipeDirections.includes('up') || swipeDirections.includes('down')) {
        newOffsetY += dampedDelta.y;
      }
    } else {
      // No locked direction yet, allow movement based on allowed directions
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

    setIsDragging(false);
    setIsRealDrag(false);
    setLockedDirection(null);

    if (rootRef.current) {
      rootRef.current.releasePointerCapture(event.pointerId);
    }

    // Check if swipe exceeds threshold in any of the allowed directions
    let shouldClose = false;

    const deltaX = event.clientX - dragStartPosRef.current.x;
    const deltaY = event.clientY - dragStartPosRef.current.y;

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
      remove(toast.id);
    } else {
      setDragOffset({
        x: initialTransform.x,
        y: initialTransform.y,
      });

      dragHistoryRef.current = [];
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

      remove(toast.id);
    }
  }

  // Prevent page scrolling when dragging the toast
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

  function getDragStyles() {
    if (
      !isDragging &&
      dragOffset.x === initialTransform.x &&
      dragOffset.y === initialTransform.y &&
      !dragDismissed
    ) {
      return {};
    }

    return {
      transform: isDragging
        ? `translate(${dragOffset.x}px,${dragOffset.y}px) scale(${initialTransform.scale})`
        : undefined,
      transition: isDragging ? 'none' : undefined,
      userSelect: isDragging ? 'none' : undefined,
      touchAction: 'none',
    } as const;
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
        ['data-base-ui-toast' as string]: toast.id,
        ['data-drag-dismissed' as string]: dragDismissed ? '' : undefined,
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onKeyDown: handleKeyDown,
        style: {
          ...getDragStyles(),
          [ToastRootCssVars.index as string]: toast.animation === 'ending' ? domIndex : index,
          [ToastRootCssVars.offset as string]: `${offset}px`,
        },
      },
      other,
    ),
  });

  const contextValue = React.useMemo(
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
  export interface State {
    transitionStatus: TransitionStatus;
    expanded: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The toast to render.
     */
    toast: Toast<any>;
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
    onRemove: PropTypes.func,
    onRemoveComplete: PropTypes.func,
    priority: PropTypes.oneOf(['high', 'low']),
    timeout: PropTypes.number,
    title: PropTypes.string.isRequired,
    type: PropTypes.string,
  }).isRequired,
} as any;

export { ToastRoot };
