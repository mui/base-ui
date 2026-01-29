'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import {
  getDisplacement,
  getElementTransform,
  useSwipeDismiss,
  type SwipeDirection,
} from '../../utils/useSwipeDismiss';
import { DrawerPopupCssVars } from '../popup/DrawerPopupCssVars';
import { DrawerPopupDataAttributes } from '../popup/DrawerPopupDataAttributes';
import { DrawerBackdropCssVars } from '../backdrop/DrawerBackdropCssVars';
import { useDrawerRootContext, type DrawerSwipeDirection } from '../root/DrawerRootContext';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useTriggerRegistration } from '../../utils/popups';
import { useDrawerProviderContext } from '../provider/DrawerProviderContext';
import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

const DEFAULT_SWIPE_THRESHOLD = 40;
const MIN_SWIPE_START_DISTANCE = 1;

const SWIPE_AREA_OPEN_HOOK: Record<string, string> = {
  [CommonPopupDataAttributes.open]: '',
};

const SWIPE_AREA_CLOSED_HOOK: Record<string, string> = {
  [CommonPopupDataAttributes.closed]: '',
};

const stateAttributesMapping: StateAttributesMapping<DrawerSwipeArea.State> = {
  open(value) {
    return value ? SWIPE_AREA_OPEN_HOOK : SWIPE_AREA_CLOSED_HOOK;
  },
  swiping(value) {
    return value ? { 'data-swiping': '' } : null;
  },
  swipeDirection(value) {
    return value ? { 'data-swipe-direction': value } : null;
  },
  disabled(value) {
    return value ? { 'data-disabled': '' } : null;
  },
};

const oppositeSwipeDirection: Record<DrawerSwipeDirection, DrawerSwipeDirection> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

function resolveTouchAction(direction: DrawerSwipeDirection) {
  return direction === 'left' || direction === 'right' ? 'pan-y' : 'pan-x';
}

/**
 * An invisible area that listens for swipe gestures to open the drawer.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerSwipeArea = React.forwardRef(function DrawerSwipeArea(
  componentProps: DrawerSwipeArea.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    render,
    disabled = false,
    swipeDirection: swipeDirectionProp,
    swipeThreshold,
    ...elementProps
  } = componentProps;

  const { store } = useDialogRootContext();
  const { swipeDirection, frontmostHeight } = useDrawerRootContext();
  const providerContext = useDrawerProviderContext(true);
  const swipeAreaRef = React.useRef<HTMLDivElement>(null);
  const swipeStartEventRef = React.useRef<PointerEvent | TouchEvent | null>(null);
  const openedBySwipeRef = React.useRef(false);
  const [swipeActive, setSwipeActive] = React.useState(false);
  const swipeThresholdRef = React.useRef(DEFAULT_SWIPE_THRESHOLD);
  const dragDeltaRef = React.useRef({ x: 0, y: 0 });
  const closedOffsetRef = React.useRef<number | null>(null);
  const appliedSwipeStylesRef = React.useRef(false);
  const popupTransitionRef = React.useRef<string | null>(null);

  const swipeAreaId = useBaseUiId(componentProps.id);
  const registerTrigger = useTriggerRegistration(swipeAreaId, store);

  const open = store.useState('open');
  const viewportElement = store.useState('viewportElement');
  const mounted = store.useState('mounted');
  const popupElementState = store.useState('popupElement');
  const resolvedSwipeDirection = swipeDirectionProp ?? oppositeSwipeDirection[swipeDirection];
  const dismissDirection = oppositeSwipeDirection[resolvedSwipeDirection];
  const enabled = !disabled && (!open || swipeActive);

  const resolveSwipeThreshold = useStableCallback((direction: DrawerSwipeDirection) => {
    let resolvedThreshold = DEFAULT_SWIPE_THRESHOLD;

    if (typeof swipeThreshold === 'function') {
      const element = swipeAreaRef.current;
      if (element) {
        resolvedThreshold = swipeThreshold({ element, direction });
      }
    } else if (typeof swipeThreshold === 'number') {
      resolvedThreshold = swipeThreshold;
    }

    resolvedThreshold = Math.max(0, resolvedThreshold);
    swipeThresholdRef.current = resolvedThreshold;
    return resolvedThreshold;
  });

  const resetDragDelta = useStableCallback(() => {
    dragDeltaRef.current.x = 0;
    dragDeltaRef.current.y = 0;
  });

  const resolveClosedOffset = useStableCallback(() => {
    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      return null;
    }

    const isHorizontal = dismissDirection === 'left' || dismissDirection === 'right';
    const offset = isHorizontal ? popupElement.offsetWidth : popupElement.offsetHeight;
    if (offset <= 0) {
      return null;
    }

    const transform = getElementTransform(popupElement);
    const transformOffset = isHorizontal ? transform.x : transform.y;
    if (Number.isFinite(transformOffset) && Math.abs(transformOffset) > 0.5) {
      return Math.min(offset, Math.abs(transformOffset));
    }

    const viewport = viewportElement ?? popupElement.ownerDocument?.documentElement ?? null;
    if (!viewport || typeof viewport.getBoundingClientRect !== 'function') {
      return offset;
    }

    const popupRect = popupElement.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    let overlap = 0;

    switch (dismissDirection) {
      case 'right':
        overlap = popupRect.right - viewportRect.right;
        break;
      case 'left':
        overlap = viewportRect.left - popupRect.left;
        break;
      case 'down':
        overlap = popupRect.bottom - viewportRect.bottom;
        break;
      case 'up':
        overlap = viewportRect.top - popupRect.top;
        break;
      default:
        overlap = 0;
        break;
    }

    if (!Number.isFinite(overlap)) {
      return offset;
    }

    const resolvedOverlap = Math.max(0, overlap);
    const resolvedOffset = offset - resolvedOverlap;
    if (resolvedOffset > 0) {
      return resolvedOffset;
    }

    return offset;
  });

  const openDrawer = useStableCallback((event?: PointerEvent | TouchEvent) => {
    if (store.select('open')) {
      return;
    }

    openedBySwipeRef.current = true;
    store.setOpen(
      true,
      createChangeEventDetails(REASONS.swipe, event, swipeAreaRef.current ?? undefined),
    );
  });

  const closeDrawer = useStableCallback((event?: PointerEvent | TouchEvent) => {
    if (!store.select('open')) {
      return;
    }

    store.setOpen(
      false,
      createChangeEventDetails(REASONS.swipe, event, swipeAreaRef.current ?? undefined),
    );
  });

  const swipe = useSwipeDismiss({
    enabled,
    directions: [resolvedSwipeDirection],
    elementRef: swipeAreaRef,
    movementCssVars: {
      x: DrawerPopupCssVars.swipeMovementX,
      y: DrawerPopupCssVars.swipeMovementY,
    },
    swipeThreshold,
    onSwipeStart(event) {
      swipeStartEventRef.current = event;
      openedBySwipeRef.current = false;
      resetDragDelta();
      resolveSwipeThreshold(resolvedSwipeDirection);
      setSwipeActive(true);
    },
    onProgress(_progress, details) {
      if (!details) {
        return;
      }

      dragDeltaRef.current.x = details.deltaX;
      dragDeltaRef.current.y = details.deltaY;

      if (details.direction && details.direction !== resolvedSwipeDirection) {
        return;
      }

      const displacement = getDisplacement(resolvedSwipeDirection, details.deltaX, details.deltaY);

      if (displacement < MIN_SWIPE_START_DISTANCE) {
        return;
      }

      if (openedBySwipeRef.current) {
        return;
      }

      openDrawer(swipeStartEventRef.current ?? undefined);
    },
    onRelease({ event, direction, deltaX, deltaY }) {
      const displacement = getDisplacement(resolvedSwipeDirection, deltaX, deltaY);
      const threshold = swipeThresholdRef.current;
      const shouldOpen =
        direction === resolvedSwipeDirection && displacement >= threshold && !disabled;

      if (shouldOpen) {
        if (!store.select('open')) {
          openDrawer(event);
        }
      } else if (openedBySwipeRef.current) {
        closeDrawer(event);
      }

      swipeStartEventRef.current = null;
      openedBySwipeRef.current = false;
      resetDragDelta();
      setSwipeActive(false);

      return false;
    },
  });

  const swipePointerProps = swipe.getPointerProps();
  const swipeTouchProps = swipe.getTouchProps();
  const resetSwipe = swipe.reset;
  const dragDeltaX = dragDeltaRef.current.x;
  const dragDeltaY = dragDeltaRef.current.y;

  const clearSwipeStyles = useStableCallback(() => {
    const popupElement = store.context.popupRef.current;
    if (popupElement && appliedSwipeStylesRef.current) {
      popupElement.style.removeProperty(DrawerPopupCssVars.swipeMovementX);
      popupElement.style.removeProperty(DrawerPopupCssVars.swipeMovementY);
      popupElement.removeAttribute(DrawerPopupDataAttributes.swiping);
    }

    if (popupElement && popupTransitionRef.current !== null) {
      popupElement.style.transition = popupTransitionRef.current;
      popupTransitionRef.current = null;
    }

    const backdropElement = store.context.backdropRef.current;
    if (backdropElement) {
      backdropElement.removeAttribute(DrawerPopupDataAttributes.swiping);
      backdropElement.style.removeProperty(DrawerBackdropCssVars.swipeProgress);
      backdropElement.style.removeProperty(DrawerPopupCssVars.height);
    }

    providerContext?.swipeProgressStore.set(0);
    providerContext?.frontmostHeightStore.set(0);
    appliedSwipeStylesRef.current = false;
  });

  React.useEffect(() => {
    if (!enabled) {
      resetSwipe();
      setSwipeActive(false);
      openedBySwipeRef.current = false;
      swipeStartEventRef.current = null;
      resetDragDelta();
      closedOffsetRef.current = null;
      clearSwipeStyles();
    }
  }, [clearSwipeStyles, enabled, resetDragDelta, resetSwipe]);

  useIsoLayoutEffect(() => {
    if (!swipeActive) {
      closedOffsetRef.current = null;
      clearSwipeStyles();
      return;
    }

    if (!open || !mounted || !popupElementState) {
      return;
    }
    const popupElement = popupElementState;

    if (closedOffsetRef.current == null) {
      closedOffsetRef.current = resolveClosedOffset();
    }

    const closedOffset = closedOffsetRef.current;
    if (!closedOffset || !Number.isFinite(closedOffset) || closedOffset <= 0) {
      return;
    }

    const displacement = getDisplacement(resolvedSwipeDirection, dragDeltaX, dragDeltaY);
    const clampedDisplacement = Math.max(0, displacement);
    const dampedDisplacement =
      clampedDisplacement > closedOffset
        ? closedOffset + Math.sqrt(clampedDisplacement - closedOffset)
        : clampedDisplacement;
    const remaining = closedOffset - dampedDisplacement;
    const directionSign = dismissDirection === 'left' || dismissDirection === 'up' ? -1 : 1;
    const movement = remaining * directionSign;
    const isHorizontal = dismissDirection === 'left' || dismissDirection === 'right';
    const movementX = isHorizontal ? movement : 0;
    const movementY = isHorizontal ? 0 : movement;
    const openProgress = Math.max(0, Math.min(1, clampedDisplacement / closedOffset));
    const backdropProgress = Math.max(0, Math.min(1, 1 - openProgress));

    popupElement.style.setProperty(DrawerPopupCssVars.swipeMovementX, `${movementX}px`);
    popupElement.style.setProperty(DrawerPopupCssVars.swipeMovementY, `${movementY}px`);
    popupElement.setAttribute(DrawerPopupDataAttributes.swiping, '');
    if (popupTransitionRef.current === null) {
      popupTransitionRef.current = popupElement.style.transition;
    }
    popupElement.style.transition = 'none';

    const backdropElement = store.context.backdropRef.current;
    if (backdropElement) {
      backdropElement.setAttribute(DrawerPopupDataAttributes.swiping, '');
      backdropElement.style.setProperty(DrawerBackdropCssVars.swipeProgress, `${backdropProgress}`);
      if (openProgress > 0 && frontmostHeight > 0) {
        backdropElement.style.setProperty(DrawerPopupCssVars.height, `${frontmostHeight}px`);
      } else {
        backdropElement.style.removeProperty(DrawerPopupCssVars.height);
      }
    }

    providerContext?.swipeProgressStore.set(openProgress);
    providerContext?.frontmostHeightStore.set(openProgress > 0 ? frontmostHeight : 0);
    appliedSwipeStylesRef.current = true;
  }, [
    clearSwipeStyles,
    dismissDirection,
    dragDeltaX,
    dragDeltaY,
    frontmostHeight,
    open,
    providerContext,
    resolveClosedOffset,
    resolvedSwipeDirection,
    swipeActive,
    popupElementState,
    store.context.backdropRef,
    mounted,
  ]);

  const state: DrawerSwipeArea.State = React.useMemo(
    () => ({
      open,
      swiping: swipe.swiping,
      swipeDirection: resolvedSwipeDirection,
      disabled,
    }),
    [disabled, open, resolvedSwipeDirection, swipe.swiping],
  );

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, swipeAreaRef, registerTrigger],
    stateAttributesMapping,
    props: [
      {
        role: 'presentation',
        'aria-hidden': true,
        style: {
          pointerEvents: !enabled ? 'none' : undefined,
          touchAction: resolveTouchAction(resolvedSwipeDirection),
        },
        onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
          if (event.pointerType === 'touch') {
            return;
          }
          swipePointerProps.onPointerDown?.(event);
        },
        onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
          if (event.pointerType === 'touch') {
            return;
          }
          swipePointerProps.onPointerMove?.(event);
        },
        onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
          if (event.pointerType === 'touch') {
            return;
          }
          swipePointerProps.onPointerUp?.(event);
        },
      },
      swipeTouchProps,
      swipeAreaId ? { id: swipeAreaId } : undefined,
      elementProps,
    ],
  });
});

export interface DrawerSwipeAreaProps extends BaseUIComponentProps<'div', DrawerSwipeArea.State> {
  /**
   * Whether the swipe area is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The swipe direction that opens the drawer.
   * Defaults to the opposite of `Drawer.Root` `swipeDirection`.
   */
  swipeDirection?: DrawerSwipeDirection | undefined;
  /**
   * The minimum distance (in pixels) the swipe must travel to open the drawer.
   * @default 40
   */
  swipeThreshold?: useSwipeDismiss.Options['swipeThreshold'] | undefined;
}

export interface DrawerSwipeAreaState {
  /**
   * Whether the drawer is currently open.
   */
  open: boolean;
  /**
   * Whether the swipe area is currently being swiped.
   */
  swiping: boolean;
  /**
   * The swipe direction that opens the drawer.
   */
  swipeDirection: SwipeDirection;
  /**
   * Whether the swipe area is disabled.
   */
  disabled: boolean;
}

export namespace DrawerSwipeArea {
  export type Props = DrawerSwipeAreaProps;
  export type State = DrawerSwipeAreaState;
}
