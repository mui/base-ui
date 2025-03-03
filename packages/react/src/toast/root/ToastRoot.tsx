'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { contains, getTarget } from '@floating-ui/react/utils';
import { useToastContext, type Toast } from '../provider/ToastProviderContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { ToastRootContext } from './ToastRootContext';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ToastRootCssVars } from './ToastRootCssVars';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';

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

  const { toasts, finalizeRemove, hovering, focused, setToasts, remove, dismissToast } =
    useToastContext();

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

  const dragStartPosRef = React.useRef({ x: 0, y: 0 });
  const initialTransformRef = React.useRef({ x: 0, y: 0, scale: 1 });
  const dragHistoryRef = React.useRef<Array<{ x: number; y: number; time: number }>>([]);

  const domIndex = React.useMemo(() => toasts.indexOf(toast), [toast, toasts]);
  const index = React.useMemo(
    () => toasts.filter((t) => t.animation !== 'ending').indexOf(toast),
    [toast, toasts],
  );

  const state: ToastRoot.State = React.useMemo(
    () => ({
      transitionStatus: toast.animation,
      expanded: hovering || focused,
    }),
    [toast.animation, hovering, focused],
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
    const resizeObserver = new ResizeObserver(setHeights);

    resizeObserver.observe(rootRef.current);
    return () => {
      resizeObserver.disconnect();
    };
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

    switch (swipeDirection) {
      case 'right':
        if (deltaX < 0) {
          newDeltaX = -(Math.abs(deltaX) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
        }
        break;
      case 'left':
        if (deltaX > 0) {
          newDeltaX = deltaX ** OPPOSITE_DIRECTION_DAMPING_FACTOR;
        }
        break;
      case 'down':
        if (deltaY < 0) {
          newDeltaY = -(Math.abs(deltaY) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
        }
        break;
      case 'up':
        if (deltaY > 0) {
          newDeltaY = deltaY ** OPPOSITE_DIRECTION_DAMPING_FACTOR;
        }
        break;
      default:
        break;
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

    // Check if the user has moved enough to be considered a real drag
    if (!isRealDrag) {
      const movementDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (movementDistance >= MIN_DRAG_THRESHOLD) {
        setIsRealDrag(true);
      }
    }

    // Apply damping to opposite direction movements
    const dampedDelta = applyDirectionalDamping(deltaX, deltaY);

    let newOffsetX = initialTransformRef.current.x;
    let newOffsetY = initialTransformRef.current.y;

    if (swipeDirection === 'left' || swipeDirection === 'right') {
      newOffsetX += dampedDelta.x;
    } else if (swipeDirection === 'up' || swipeDirection === 'down') {
      newOffsetY += dampedDelta.y;
    }

    setDragOffset({ x: newOffsetX, y: newOffsetY });
  }

  function handlePointerUp(event: React.PointerEvent) {
    if (!isDragging) {
      return;
    }

    setIsDragging(false);
    setIsRealDrag(false);

    if (rootRef.current) {
      rootRef.current.releasePointerCapture(event.pointerId);
    }

    // Check if swipe exceeds threshold
    const deltaX = event.clientX - dragStartPosRef.current.x;
    const deltaY = event.clientY - dragStartPosRef.current.y;

    let shouldClose = false;

    switch (swipeDirection) {
      case 'right':
        shouldClose = deltaX > SWIPE_THRESHOLD;
        break;
      case 'left':
        shouldClose = deltaX < -SWIPE_THRESHOLD;
        break;
      case 'down':
        shouldClose = deltaY > SWIPE_THRESHOLD;
        break;
      case 'up':
        shouldClose = deltaY < -SWIPE_THRESHOLD;
        break;
      default:
        break;
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
      // Check if focus is inside this toast
      if (!rootRef.current || !rootRef.current.contains(document.activeElement)) {
        return;
      }

      dismissToast(toast.id, rootRef.current);
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
    extraProps: mergeReactProps<'div'>(other, {
      role: toast.priority === 'high' ? 'alertdialog' : 'dialog',
      'aria-modal': false,
      'aria-labelledby': titleId,
      'aria-describedby': descriptionId,
      tabIndex: 0,
      ['data-base-ui-toast' as string]: '',
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
    }),
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
    toast: Toast;
    /**
     * Direction in which the toast can be swiped to dismiss.
     * @default 'up'
     */
    swipeDirection?: 'up' | 'down' | 'left' | 'right';
    /**
     * Threshold in pixels to determine if swipe should close toast or cancel.
     * @default 20
     */
    swipeThreshold?: number;
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
   * Direction in which the toast can be swiped to dismiss.
   * @default 'up'
   */
  swipeDirection: PropTypes.oneOf(['down', 'left', 'right', 'up']),
  /**
   * Threshold in pixels to determine if swipe should close toast or cancel.
   * @default 20
   */
  swipeThreshold: PropTypes.number,
  /**
   * @ignore
   */
  toast: PropTypes.shape({
    actionProps: PropTypes.object,
    animation: PropTypes.oneOf(['ending', 'starting']),
    data: PropTypes.object,
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
