'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isElement } from '@floating-ui/utils/dom';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { DialogViewport } from '../../dialog/viewport/DialogViewport';
import { mergeProps } from '../../merge-props';
import { useDrawerRootContext } from '../root/DrawerRootContext';
import { useDrawerSnapPoints } from '../root/useDrawerSnapPoints';
import { useDrawerProviderContext } from '../provider/DrawerProviderContext';
import { clamp } from '../../utils/clamp';
import { useSwipeDismiss, type SwipeDirection } from '../../utils/useSwipeDismiss';
import { DrawerPopupCssVars } from '../popup/DrawerPopupCssVars';
import { DrawerPopupDataAttributes } from '../popup/DrawerPopupDataAttributes';
import { DrawerBackdropCssVars } from '../backdrop/DrawerBackdropCssVars';
import { REASONS } from '../../utils/reasons';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { contains } from '../../floating-ui-react/utils';
import { DrawerViewportContext } from './DrawerViewportContext';
import { TransitionStatusDataAttributes } from '../../utils/stateAttributesMapping';
import { findScrollableTouchTarget } from '../../utils/scrollable';

const MIN_SWIPE_THRESHOLD = 10;
const FAST_SWIPE_VELOCITY = 0.5;
const SNAP_VELOCITY_THRESHOLD = 0.5;
const SNAP_VELOCITY_MULTIPLIER = 300;
const MAX_SNAP_VELOCITY = 4;
const MIN_SWIPE_RELEASE_VELOCITY = 0.2;
const MAX_SWIPE_RELEASE_VELOCITY = 4;
const MIN_SWIPE_RELEASE_DURATION_MS = 80;
const MAX_SWIPE_RELEASE_DURATION_MS = 360;
const MIN_SWIPE_RELEASE_SCALAR = 0.1;
const MAX_SWIPE_RELEASE_SCALAR = 1;

/**
 * A positioning container for the drawer popup that can be made scrollable.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerViewport = React.forwardRef(function DrawerViewport(
  props: DrawerViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, children, ...elementProps } = props;

  const { store } = useDialogRootContext();
  const {
    swipeDirection,
    notifyParentSwipingChange,
    notifyParentSwipeProgressChange,
    frontmostHeight,
    snapToSequentialPoints,
  } = useDrawerRootContext();
  const providerContext = useDrawerProviderContext(true);

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const nested = store.useState('nested');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const viewportElement = store.useState('viewportElement');
  const popupElementState = store.useState('popupElement');

  const nestedDrawerOpen = nestedOpenDialogCount > 0;

  const { snapPoints, resolvedSnapPoints, activeSnapPointOffset, setActiveSnapPoint, popupHeight } =
    useDrawerSnapPoints();
  const [swipeRelease, setSwipeRelease] = React.useState<{
    durationScalar: number;
  } | null>(null);
  const [nestedSwipeActive, setNestedSwipeActive] = React.useState(false);
  const nestedSwipeActiveRef = React.useRef(false);
  const touchScrollStateRef = React.useRef<{
    lastY: number;
    scrollTarget: HTMLElement | null;
    startedAtTop: boolean;
    allowSwipe: boolean | null;
  } | null>(null);

  const snapPointRange = React.useMemo(() => {
    if (!snapPoints || snapPoints.length < 2) {
      return null;
    }

    if (swipeDirection !== 'down' && swipeDirection !== 'up') {
      return null;
    }

    if (resolvedSnapPoints.length < 2) {
      return null;
    }

    const offsets = resolvedSnapPoints
      .map((point) => point.offset)
      .filter((offset) => Number.isFinite(offset))
      .sort((a, b) => a - b);

    if (offsets.length < 2) {
      return null;
    }

    const minOffset = offsets[0];
    const nextOffset = offsets[1];
    const maxOffset = offsets[offsets.length - 1];
    let range = nextOffset - minOffset;
    if (!Number.isFinite(range) || range <= 0) {
      const fallbackRange = maxOffset - minOffset;
      if (!Number.isFinite(fallbackRange) || fallbackRange <= 0) {
        return null;
      }
      range = fallbackRange;
    }

    return { minOffset, range };
  }, [resolvedSnapPoints, snapPoints, swipeDirection]);

  const snapPointProgress = React.useMemo(() => {
    if (!snapPointRange || activeSnapPointOffset === null) {
      return null;
    }

    return clamp((activeSnapPointOffset - snapPointRange.minOffset) / snapPointRange.range, 0, 1);
  }, [activeSnapPointOffset, snapPointRange]);

  const swipeDirections = React.useMemo<SwipeDirection[]>(() => {
    if (
      snapPoints &&
      snapPoints.length > 0 &&
      (swipeDirection === 'down' || swipeDirection === 'up')
    ) {
      return swipeDirection === 'down' ? ['down', 'up'] : ['up', 'down'];
    }

    return [swipeDirection];
  }, [snapPoints, swipeDirection]);

  const clearSelectionOnSwipeStart = useStableCallback((event: PointerEvent | TouchEvent) => {
    if ('touches' in event || ('pointerType' in event && event.pointerType === 'touch')) {
      return;
    }

    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      return;
    }

    const doc = ownerDocument(popupElement);
    const selection = doc.getSelection?.();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const anchorElement = isElement(selection.anchorNode)
      ? selection.anchorNode
      : selection.anchorNode?.parentElement;
    const focusElement = isElement(selection.focusNode)
      ? selection.focusNode
      : selection.focusNode?.parentElement;

    if (!contains(popupElement, anchorElement) && !contains(popupElement, focusElement)) {
      return;
    }

    selection.removeAllRanges();
  });

  const setSwipeDismissed = useStableCallback((dismissed: boolean) => {
    const popupElement = store.context.popupRef.current;
    const backdropElement = store.context.backdropRef.current;

    if (dismissed) {
      popupElement?.setAttribute(DrawerPopupDataAttributes.swipeDismiss, '');
      backdropElement?.setAttribute(DrawerPopupDataAttributes.swipeDismiss, '');
      return;
    }

    popupElement?.removeAttribute(DrawerPopupDataAttributes.swipeDismiss);
    backdropElement?.removeAttribute(DrawerPopupDataAttributes.swipeDismiss);
  });

  const clearSwipeRelease = useStableCallback(() => {
    setSwipeDismissed(false);
    setSwipeRelease(null);
  });

  const applySwipeProgress = useStableCallback(
    ({
      resolvedProgress,
      shouldTrackProgress,
      notifyParent,
    }: {
      resolvedProgress: number;
      shouldTrackProgress: boolean;
      notifyParent: boolean;
    }) => {
      const isActive = open && !nested && shouldTrackProgress;
      const swipeProgress = isActive ? resolvedProgress : 0;

      if (notifyParent && notifyParentSwipeProgressChange) {
        const nestedSwipeProgress = open && shouldTrackProgress ? resolvedProgress : 0;
        notifyParentSwipeProgressChange(nestedSwipeProgress);
      }

      providerContext?.swipeProgressStore.set(swipeProgress);
      providerContext?.frontmostHeightStore.set(swipeProgress > 0 ? frontmostHeight : 0);

      const backdropElement = store.context.backdropRef.current;
      if (!backdropElement) {
        return;
      }

      if (!isActive || swipeProgress <= 0) {
        backdropElement.style.removeProperty(DrawerBackdropCssVars.swipeProgress);
        backdropElement.style.removeProperty(DrawerPopupCssVars.height);
        return;
      }

      backdropElement.style.setProperty(DrawerBackdropCssVars.swipeProgress, `${swipeProgress}`);
      if (frontmostHeight > 0) {
        backdropElement.style.setProperty(DrawerPopupCssVars.height, `${frontmostHeight}px`);
      } else {
        backdropElement.style.removeProperty(DrawerPopupCssVars.height);
      }
    },
  );

  const setBackdropSwiping = useStableCallback((swiping: boolean) => {
    const backdropElement = store.context.backdropRef.current;
    if (!backdropElement) {
      return;
    }

    if (swiping) {
      backdropElement.setAttribute(DrawerPopupDataAttributes.swiping, '');
      return;
    }

    backdropElement.removeAttribute(DrawerPopupDataAttributes.swiping);
  });

  const resolveSwipeRelease = useStableCallback(
    ({
      direction,
      deltaX,
      deltaY,
      velocityX,
      velocityY,
      releaseVelocityX,
      releaseVelocityY,
    }: {
      direction: SwipeDirection | undefined;
      deltaX: number;
      deltaY: number;
      velocityX: number;
      velocityY: number;
      releaseVelocityX: number;
      releaseVelocityY: number;
    }) => {
      if (!direction) {
        return null;
      }

      const popupElement = store.context.popupRef.current;
      if (!popupElement) {
        return null;
      }

      const size =
        direction === 'left' || direction === 'right'
          ? popupElement.offsetWidth
          : popupElement.offsetHeight;
      if (!Number.isFinite(size) || size <= 0) {
        return null;
      }

      const axisDelta = direction === 'left' || direction === 'right' ? deltaX : deltaY;
      const snapPointBaseOffset =
        snapPoints && snapPoints.length > 0 ? (activeSnapPointOffset ?? 0) : 0;
      let baseOffset = 0;
      if (direction === 'down') {
        baseOffset = snapPointBaseOffset;
      } else if (direction === 'up') {
        baseOffset = -snapPointBaseOffset;
      }

      const translation = baseOffset + axisDelta;
      const translationAlongDirection =
        direction === 'left' || direction === 'up' ? -translation : translation;
      const remainingDistance = Math.max(0, size - translationAlongDirection);
      if (!Number.isFinite(remainingDistance) || remainingDistance <= 0) {
        return null;
      }

      const axisVelocity =
        direction === 'left' || direction === 'right' ? releaseVelocityX : releaseVelocityY;
      const fallbackVelocity =
        direction === 'left' || direction === 'right' ? velocityX : velocityY;
      const resolvedVelocity =
        Math.abs(axisVelocity) > 0 && Number.isFinite(axisVelocity)
          ? axisVelocity
          : fallbackVelocity;
      const directionalVelocity =
        direction === 'left' || direction === 'up' ? -resolvedVelocity : resolvedVelocity;
      if (
        !Number.isFinite(directionalVelocity) ||
        directionalVelocity <= MIN_SWIPE_RELEASE_VELOCITY
      ) {
        return null;
      }

      const clampedVelocity = clamp(
        directionalVelocity,
        MIN_SWIPE_RELEASE_VELOCITY,
        MAX_SWIPE_RELEASE_VELOCITY,
      );
      const durationMs = clamp(
        remainingDistance / clampedVelocity,
        MIN_SWIPE_RELEASE_DURATION_MS,
        MAX_SWIPE_RELEASE_DURATION_MS,
      );
      if (!Number.isFinite(durationMs)) {
        return null;
      }

      const normalizedDuration =
        (durationMs - MIN_SWIPE_RELEASE_DURATION_MS) /
        (MAX_SWIPE_RELEASE_DURATION_MS - MIN_SWIPE_RELEASE_DURATION_MS);
      const durationScalar = clamp(
        MIN_SWIPE_RELEASE_SCALAR +
          normalizedDuration * (MAX_SWIPE_RELEASE_SCALAR - MIN_SWIPE_RELEASE_SCALAR),
        MIN_SWIPE_RELEASE_SCALAR,
        MAX_SWIPE_RELEASE_SCALAR,
      );
      if (!Number.isFinite(durationScalar) || durationScalar <= 0) {
        return null;
      }

      return {
        durationScalar,
      };
    },
  );

  const updateNestedSwipeActive = useStableCallback(
    (details?: useSwipeDismiss.SwipeProgressDetails) => {
      if (nestedSwipeActiveRef.current || !details) {
        return;
      }

      const direction = details.direction ?? swipeDirection;
      const delta = direction === 'left' || direction === 'right' ? details.deltaX : details.deltaY;
      if (!Number.isFinite(delta) || Math.abs(delta) < MIN_SWIPE_THRESHOLD) {
        return;
      }

      nestedSwipeActiveRef.current = true;
      setNestedSwipeActive(true);
    },
  );

  const swipe = useSwipeDismiss({
    enabled: mounted && !nestedDrawerOpen,
    directions: swipeDirections,
    elementRef: store.context.popupRef,
    ignoreSelectorWhenTouch: false,
    ignoreScrollableAncestors: true,
    onSwipeStart: clearSelectionOnSwipeStart,
    swipeThreshold({ element, direction }) {
      return getBaseSwipeThreshold(element, direction);
    },
    movementCssVars: {
      x: DrawerPopupCssVars.swipeMovementX,
      y: DrawerPopupCssVars.swipeMovementY,
    },
    canStart(position) {
      const popupElement = store.context.popupRef.current;
      if (!popupElement) {
        return false;
      }

      const doc = popupElement.ownerDocument;
      const elementAtPoint =
        typeof doc.elementFromPoint === 'function'
          ? doc.elementFromPoint(position.x, position.y)
          : null;
      return !!(elementAtPoint && contains(popupElement, elementAtPoint));
    },
    onProgress(progress, details) {
      updateNestedSwipeActive(details);

      const currentDirection = details?.direction ?? swipe.swipeDirection;
      const isDismissSwipe = currentDirection === undefined || currentDirection === swipeDirection;
      const hasSnapPoints = Boolean(snapPoints && snapPoints.length > 0);
      const isVerticalSwipe = swipeDirection === 'down' || swipeDirection === 'up';
      const shouldTrackProgress =
        (hasSnapPoints && isVerticalSwipe) ||
        !hasSnapPoints ||
        swipeDirection === 'left' ||
        swipeDirection === 'right' ||
        isDismissSwipe;

      let resolvedProgress = progress;
      if (snapPointRange && popupHeight > 0) {
        if (details && Number.isFinite(details.deltaY)) {
          const baseOffset = activeSnapPointOffset ?? snapPointRange.minOffset;
          const nextOffset = clamp(baseOffset + details.deltaY, 0, popupHeight);
          resolvedProgress = clamp(
            (nextOffset - snapPointRange.minOffset) / snapPointRange.range,
            0,
            1,
          );
        } else if (snapPointProgress !== null) {
          resolvedProgress = snapPointProgress;
        } else if (currentDirection === 'down' || currentDirection === 'up') {
          const displacement = progress * popupHeight;
          const baseOffset = activeSnapPointOffset ?? snapPointRange.minOffset;
          const nextOffset =
            currentDirection === 'down' ? baseOffset + displacement : baseOffset - displacement;
          resolvedProgress = clamp(
            (nextOffset - snapPointRange.minOffset) / snapPointRange.range,
            0,
            1,
          );
        }
      }

      applySwipeProgress({
        resolvedProgress,
        shouldTrackProgress,
        notifyParent: true,
      });
    },
    onRelease({
      event,
      deltaX,
      deltaY,
      direction,
      velocityX,
      velocityY,
      releaseVelocityX,
      releaseVelocityY,
    }: {
      event: PointerEvent | TouchEvent;
      deltaX: number;
      deltaY: number;
      direction: SwipeDirection | undefined;
      velocityX: number;
      velocityY: number;
      releaseVelocityX: number;
      releaseVelocityY: number;
    }) {
      const swipeReleasePayload = {
        deltaX,
        deltaY,
        velocityX,
        velocityY,
        releaseVelocityX,
        releaseVelocityY,
      };

      function startSwipeRelease(resolvedDirection: SwipeDirection) {
        // Start ending transition styles earlier and synchronously to prevent a period where
        // the popup appears stuck on release before the actual closing animation starts.
        const popupElement = store.context.popupRef.current;
        if (!popupElement) {
          return;
        }

        notifyParentSwipingChange?.(false);
        setSwipeDismissed(true);
        popupElement.style.removeProperty('transition');
        popupElement.setAttribute(TransitionStatusDataAttributes.endingStyle, '');
        ReactDOM.flushSync(() => {
          setSwipeRelease(
            resolveSwipeRelease({
              direction: resolvedDirection,
              ...swipeReleasePayload,
            }),
          );
        });
      }

      if (!snapPoints || snapPoints.length === 0) {
        if (!direction) {
          clearSwipeRelease();
          return undefined;
        }

        const element = store.context.popupRef.current;
        if (!element) {
          clearSwipeRelease();
          return undefined;
        }

        const baseThreshold = getBaseSwipeThreshold(element, direction);
        const delta = direction === 'left' || direction === 'right' ? deltaX : deltaY;
        if (!Number.isFinite(delta)) {
          clearSwipeRelease();
          return undefined;
        }

        const directionalDelta = direction === 'left' || direction === 'up' ? -delta : delta;
        if (directionalDelta <= 0) {
          clearSwipeRelease();
          return false;
        }

        const velocity = direction === 'left' || direction === 'right' ? velocityX : velocityY;
        const directionalVelocity =
          direction === 'left' || direction === 'up' ? -velocity : velocity;
        if (directionalVelocity >= FAST_SWIPE_VELOCITY && directionalDelta > 0) {
          startSwipeRelease(direction);
          return true;
        }

        const shouldClose = directionalDelta > baseThreshold;
        if (shouldClose) {
          startSwipeRelease(direction);
        } else {
          clearSwipeRelease();
        }
        return shouldClose;
      }

      if (swipeDirection !== 'down' && swipeDirection !== 'up') {
        clearSwipeRelease();
        return undefined;
      }

      if (!popupHeight || resolvedSnapPoints.length === 0) {
        clearSwipeRelease();
        return undefined;
      }

      const dragDelta = swipeDirection === 'down' ? deltaY : -deltaY;
      if (!Number.isFinite(dragDelta)) {
        clearSwipeRelease();
        return undefined;
      }

      const dragDirection = Math.sign(dragDelta);
      const releaseDirectionalVelocity =
        swipeDirection === 'down' ? releaseVelocityY : -releaseVelocityY;
      const fallbackDirectionalVelocity = swipeDirection === 'down' ? velocityY : -velocityY;
      let resolvedDirectionalVelocity = Number.isFinite(releaseDirectionalVelocity)
        ? releaseDirectionalVelocity
        : fallbackDirectionalVelocity;
      if (
        dragDirection !== 0 &&
        Math.abs(dragDelta) >= MIN_SWIPE_THRESHOLD &&
        Number.isFinite(resolvedDirectionalVelocity)
      ) {
        const velocityDirection = Math.sign(resolvedDirectionalVelocity);
        if (velocityDirection !== 0 && velocityDirection !== dragDirection) {
          // Ignore touch reversals that would otherwise flip the snap decision.
          resolvedDirectionalVelocity = fallbackDirectionalVelocity;
        }
      }

      const currentOffset = activeSnapPointOffset ?? 0;
      const dragTargetOffset = clamp(currentOffset + dragDelta, 0, popupHeight);
      const velocityOffset =
        Number.isFinite(resolvedDirectionalVelocity) &&
        Math.abs(resolvedDirectionalVelocity) >= SNAP_VELOCITY_THRESHOLD
          ? clamp(resolvedDirectionalVelocity, -MAX_SNAP_VELOCITY, MAX_SNAP_VELOCITY) *
            SNAP_VELOCITY_MULTIPLIER
          : 0;
      const targetOffset = snapToSequentialPoints
        ? dragTargetOffset
        : clamp(dragTargetOffset + velocityOffset, 0, popupHeight);
      const snapPointEventDetails = createChangeEventDetails(REASONS.swipe, event);

      if (snapToSequentialPoints) {
        const orderedSnapPoints = [...resolvedSnapPoints].sort(
          (first, second) => first.offset - second.offset,
        );
        if (orderedSnapPoints.length === 0) {
          clearSwipeRelease();
          return false;
        }

        let currentIndex = 0;
        let closestDistance = Math.abs(currentOffset - orderedSnapPoints[0].offset);
        for (let index = 1; index < orderedSnapPoints.length; index += 1) {
          const distance = Math.abs(currentOffset - orderedSnapPoints[index].offset);
          if (distance < closestDistance) {
            closestDistance = distance;
            currentIndex = index;
          }
        }

        let targetSnapPoint = orderedSnapPoints[0];
        closestDistance = Math.abs(targetOffset - targetSnapPoint.offset);
        for (const snapPoint of orderedSnapPoints) {
          const distance = Math.abs(targetOffset - snapPoint.offset);
          if (distance < closestDistance) {
            closestDistance = distance;
            targetSnapPoint = snapPoint;
          }
        }

        const velocityDirection = Math.sign(resolvedDirectionalVelocity);
        const shouldAdvance =
          dragDirection !== 0 &&
          velocityDirection !== 0 &&
          velocityDirection === dragDirection &&
          Math.abs(resolvedDirectionalVelocity) >= SNAP_VELOCITY_THRESHOLD;
        let effectiveTargetOffset = targetOffset;

        if (shouldAdvance) {
          const adjacentIndex = clamp(
            currentIndex + dragDirection,
            0,
            orderedSnapPoints.length - 1,
          );
          if (adjacentIndex !== currentIndex) {
            const adjacentPoint = orderedSnapPoints[adjacentIndex];
            const shouldForceAdjacent =
              dragDirection > 0
                ? targetOffset < adjacentPoint.offset
                : targetOffset > adjacentPoint.offset;
            if (shouldForceAdjacent) {
              targetSnapPoint = adjacentPoint;
              effectiveTargetOffset = adjacentPoint.offset;
            }
          } else if (dragDirection > 0) {
            setActiveSnapPoint?.(null, snapPointEventDetails);
            startSwipeRelease(swipeDirection);
            return true;
          }
        }

        const closeOffset = popupHeight;
        const closeDistance = Math.abs(effectiveTargetOffset - closeOffset);
        const snapDistance = Math.abs(effectiveTargetOffset - targetSnapPoint.offset);
        if (closeDistance < snapDistance) {
          setActiveSnapPoint?.(null, snapPointEventDetails);
          startSwipeRelease(swipeDirection);
          return true;
        }

        setActiveSnapPoint?.(targetSnapPoint.value, snapPointEventDetails);
        clearSwipeRelease();
        return false;
      }

      if (resolvedDirectionalVelocity >= FAST_SWIPE_VELOCITY && dragDelta > 0) {
        setActiveSnapPoint?.(null, snapPointEventDetails);
        startSwipeRelease(swipeDirection);
        return true;
      }

      let closestSnapPoint = resolvedSnapPoints[0];
      let closestDistance = Math.abs(targetOffset - closestSnapPoint.offset);

      for (const snapPoint of resolvedSnapPoints) {
        const distance = Math.abs(targetOffset - snapPoint.offset);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSnapPoint = snapPoint;
        }
      }

      const closeOffset = popupHeight;
      const closeDistance = Math.abs(targetOffset - closeOffset);
      if (closeDistance < closestDistance) {
        setActiveSnapPoint?.(null, snapPointEventDetails);
        startSwipeRelease(swipeDirection);
        return true;
      }

      setActiveSnapPoint?.(closestSnapPoint.value, snapPointEventDetails);
      clearSwipeRelease();
      return false;
    },
    onDismiss(event) {
      providerContext?.swipeProgressStore.set(0);
      providerContext?.frontmostHeightStore.set(0);

      const backdropElement = store.context.backdropRef.current;
      if (backdropElement) {
        backdropElement.style.removeProperty(DrawerBackdropCssVars.swipeProgress);
        backdropElement.style.removeProperty(DrawerPopupCssVars.height);
      }

      setSwipeDismissed(true);
      store.setOpen(false, createChangeEventDetails(REASONS.swipe, event));
    },
  });

  const swipePointerProps = swipe.getPointerProps();
  const swipeTouchProps = swipe.getTouchProps();
  const resetSwipe = swipe.reset;

  React.useEffect(() => {
    const rootElement = viewportElement ?? popupElementState;
    if (!rootElement) {
      return undefined;
    }

    const doc = ownerDocument(rootElement);
    const win = ownerWindow(doc);

    function handleNativeTouchMove(event: TouchEvent) {
      const touchState = touchScrollStateRef.current;
      const touch = event.touches[0];
      if (!touch || !touchState) {
        return;
      }

      const target = isElement(event.target) ? event.target : null;

      // Avoid blocking pinch zoom or text selection adjustments on iOS Safari.
      if (event.touches.length === 2) {
        touchState.lastY = touch.clientY;
        return;
      }

      const selection = win.getSelection?.();
      const selectionTarget = target ?? rootElement;
      if (
        selection &&
        selectionTarget &&
        !selection.isCollapsed &&
        selection.containsNode(selectionTarget, true)
      ) {
        touchState.lastY = touch.clientY;
        return;
      }

      if (target instanceof win.HTMLInputElement) {
        if (
          target.selectionStart != null &&
          target.selectionEnd != null &&
          target.selectionStart < target.selectionEnd &&
          target.ownerDocument.activeElement === target
        ) {
          touchState.lastY = touch.clientY;
          return;
        }
      }

      if (!open || !mounted || nestedDrawerOpen) {
        touchState.lastY = touch.clientY;
        return;
      }

      const scrollTarget = touchState.scrollTarget;
      if (!scrollTarget || scrollTarget === doc.documentElement || scrollTarget === doc.body) {
        if (event.cancelable) {
          event.preventDefault();
        }
        touchState.lastY = touch.clientY;
        return;
      }

      // If the scroll container doesn't overflow, prevent the window from scrolling.
      if (
        scrollTarget.scrollHeight === scrollTarget.clientHeight &&
        scrollTarget.scrollWidth === scrollTarget.clientWidth
      ) {
        if (event.cancelable) {
          event.preventDefault();
        }
        touchState.lastY = touch.clientY;
        return;
      }

      const deltaY = touch.clientY - touchState.lastY;
      if (deltaY !== 0) {
        const movingDown = deltaY > 0;
        const startedAtTop = touchState.startedAtTop;

        if (touchState.allowSwipe !== true) {
          if (!event.cancelable) {
            touchState.allowSwipe = false;
          } else if (movingDown && startedAtTop && swipeDirections.includes('down')) {
            touchState.allowSwipe = true;
            event.preventDefault();
          } else {
            touchState.allowSwipe = false;
          }
        } else if (event.cancelable) {
          event.preventDefault();
        }
      }

      touchState.lastY = touch.clientY;
    }

    doc.addEventListener('touchmove', handleNativeTouchMove, { passive: false, capture: true });

    return () => {
      doc.removeEventListener('touchmove', handleNativeTouchMove, { capture: true });
    };
  }, [mounted, nestedDrawerOpen, open, popupElementState, swipeDirections, viewportElement]);

  React.useEffect(() => {
    if (!snapPointRange || swipe.swiping) {
      return;
    }

    const resolvedProgress = !open || nested ? 0 : (snapPointProgress ?? 0);
    applySwipeProgress({
      resolvedProgress,
      shouldTrackProgress: true,
      notifyParent: false,
    });
  }, [
    applySwipeProgress,
    frontmostHeight,
    nested,
    open,
    snapPointProgress,
    snapPointRange,
    swipe.swiping,
  ]);

  React.useEffect(() => {
    if (!swipe.swiping && nestedSwipeActiveRef.current) {
      nestedSwipeActiveRef.current = false;
      setNestedSwipeActive(false);
    }
  }, [swipe.swiping]);

  React.useEffect(() => {
    if (!notifyParentSwipingChange) {
      return undefined;
    }

    notifyParentSwipingChange(swipe.swiping && nestedSwipeActive);

    return () => {
      notifyParentSwipingChange(false);
    };
  }, [nestedSwipeActive, notifyParentSwipingChange, swipe.swiping]);

  React.useEffect(() => {
    setBackdropSwiping(swipe.swiping);

    return () => {
      setBackdropSwiping(false);
    };
  }, [setBackdropSwiping, swipe.swiping]);

  React.useEffect(() => {
    if (!notifyParentSwipeProgressChange) {
      return undefined;
    }

    if (!open) {
      notifyParentSwipeProgressChange(0);
    }

    return () => {
      notifyParentSwipeProgressChange(0);
    };
  }, [notifyParentSwipeProgressChange, open]);

  React.useEffect(() => {
    if (open) {
      resetSwipe();
      clearSwipeRelease();
    }
  }, [clearSwipeRelease, open, resetSwipe]);

  React.useEffect(() => {
    return () => {
      providerContext?.swipeProgressStore.set(0);
      providerContext?.frontmostHeightStore.set(0);
    };
  }, [providerContext]);

  const swipeProviderValue = React.useMemo(
    () => ({
      swiping: swipe.swiping,
      getDragStyles: swipe.getDragStyles,
      swipeStrength: swipeRelease?.durationScalar ?? null,
      setSwipeDismissed,
    }),
    [setSwipeDismissed, swipe.getDragStyles, swipe.swiping, swipeRelease?.durationScalar],
  );

  return (
    <DialogViewport
      ref={forwardedRef}
      className={className}
      render={render}
      {...mergeProps<'div'>(elementProps, {
        onPointerDown(event) {
          if (!open || !mounted || nestedDrawerOpen || event.pointerType === 'touch') {
            return;
          }

          const doc = ownerDocument(event.currentTarget);
          const elementAtPoint =
            typeof doc.elementFromPoint === 'function'
              ? doc.elementFromPoint(event.clientX, event.clientY)
              : null;
          if (elementAtPoint?.closest('[data-swipe-ignore]')) {
            return;
          }

          swipePointerProps.onPointerDown?.(event);
        },
        onPointerMove(event) {
          if (event.pointerType === 'touch') {
            return;
          }

          swipePointerProps.onPointerMove?.(event);
        },
        onPointerUp(event) {
          if (event.pointerType === 'touch') {
            return;
          }

          swipePointerProps.onPointerUp?.(event);
        },
        onTouchStart(event) {
          if (!open || !mounted || nestedDrawerOpen) {
            touchScrollStateRef.current = null;
            return;
          }

          const touch = event.touches[0];
          if (!touch) {
            return;
          }

          const rootElement = viewportElement ?? popupElementState;
          const target = isElement(event.target) ? event.target : null;
          const scrollTarget =
            rootElement && target && contains(rootElement, target)
              ? findScrollableTouchTarget(target, rootElement)
              : null;
          const startedAtTop = scrollTarget ? scrollTarget.scrollTop <= 0 : false;

          let allowSwipe: boolean | null = null;
          if (scrollTarget) {
            allowSwipe = startedAtTop ? null : false;
          }

          touchScrollStateRef.current = {
            lastY: touch.clientY,
            scrollTarget,
            startedAtTop,
            allowSwipe,
          };

          const touchState = touchScrollStateRef.current;
          if (
            touchState?.scrollTarget &&
            (swipeDirections.includes('down') || swipeDirections.includes('up'))
          ) {
            if (touchState.allowSwipe === false) {
              return;
            }
          }

          swipeTouchProps.onTouchStart?.(event);
        },
        onTouchMove(event) {
          const touchState = touchScrollStateRef.current;
          if (
            touchState?.scrollTarget &&
            (swipeDirections.includes('down') || swipeDirections.includes('up')) &&
            touchState.allowSwipe !== true
          ) {
            return;
          }

          swipeTouchProps.onTouchMove?.(event);
        },
        onTouchEnd(event) {
          touchScrollStateRef.current = null;
          swipeTouchProps.onTouchEnd?.(event);
        },
        onTouchCancel(event) {
          touchScrollStateRef.current = null;
          swipeTouchProps.onTouchCancel?.(event);
        },
      })}
    >
      <DrawerViewportContext.Provider value={swipeProviderValue}>
        {children}
      </DrawerViewportContext.Provider>
    </DialogViewport>
  );
});

export interface DrawerViewportProps extends DialogViewport.Props {}
export interface DrawerViewportState extends DialogViewport.State {}

export namespace DrawerViewport {
  export type Props = DrawerViewportProps;
  export type State = DrawerViewportState;
}

function getBaseSwipeThreshold(element: HTMLElement, direction: SwipeDirection): number {
  const size =
    direction === 'left' || direction === 'right' ? element.offsetWidth : element.offsetHeight;
  return Math.max(size * 0.5, MIN_SWIPE_THRESHOLD);
}
