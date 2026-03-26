'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isElement, isHTMLElement } from '@floating-ui/utils/dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { DialogViewport } from '../../dialog/viewport/DialogViewport';
import { mergeProps } from '../../merge-props';
import { useDrawerRootContext } from '../root/DrawerRootContext';
import { useDrawerSnapPoints } from '../root/useDrawerSnapPoints';
import { useDrawerProviderContext } from '../provider/DrawerProviderContext';
import { clamp } from '../../internals/clamp';
import {
  useSwipeDismiss,
  type SwipeDirection,
  type UseSwipeDismissProgressDetails,
} from '../../utils/useSwipeDismiss';
import { DrawerPopupCssVars } from '../popup/DrawerPopupCssVars';
import { DrawerPopupDataAttributes } from '../popup/DrawerPopupDataAttributes';
import { DrawerBackdropCssVars } from '../backdrop/DrawerBackdropCssVars';
import { DRAWER_CONTENT_ATTRIBUTE } from '../content/DrawerContentDataAttributes';
import { REASONS } from '../../internals/reasons';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { activeElement, contains, getTarget } from '../../floating-ui-react/utils';
import { isTypeableElement } from '../../floating-ui-react/utils/element';
import { DrawerViewportContext } from './DrawerViewportContext';
import { TransitionStatusDataAttributes } from '../../internals/stateAttributesMapping';
import { findScrollableTouchTarget, type ScrollAxis } from '../../utils/scrollable';
import { BASE_UI_SWIPE_IGNORE_SELECTOR } from '../../internals/constants';
import { getElementAtPoint } from '../../utils/getElementAtPoint';
import type { BaseUIComponentProps } from '../../internals/types';
import type { TransitionStatus } from '../../internals/useTransitionStatus';

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
const INPUT_TAP_MOVE_THRESHOLD = 10;
const INPUT_TAP_HIT_SLOP = 16;
const DRAWER_CONTENT_SELECTOR = `[${DRAWER_CONTENT_ATTRIBUTE}]`;

interface TouchScrollState {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  scrollTarget: HTMLElement | null;
  hasCrossAxisScrollableContent: boolean;
  allowSwipe: boolean | null;
  preserveNativeCrossAxisScroll: boolean;
}

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
  const { render, className, style, children, ...elementProps } = props;

  const { store } = useDialogRootContext();
  const popupRef = store.context.popupRef;
  const backdropRef = store.context.backdropRef;

  const {
    swipeDirection,
    virtualKeyboardAware,
    notifyParentSwipingChange,
    notifyParentSwipeProgressChange,
    frontmostHeight,
    snapToSequentialPoints,
  } = useDrawerRootContext();
  const providerContext = useDrawerProviderContext(true);
  const {
    snapPoints,
    resolvedSnapPoints,
    activeSnapPoint,
    activeSnapPointOffset,
    setActiveSnapPoint,
    popupHeight,
  } = useDrawerSnapPoints();

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const nested = store.useState('nested');
  const nestedOpenDrawerCount = store.useState('nestedOpenDrawerCount');
  const viewportElement = store.useState('viewportElement');
  const popupElementState = store.useState('popupElement');

  const visualStateStore = providerContext?.visualStateStore;
  const nestedDrawerOpen = nestedOpenDrawerCount > 0;
  const scrollAxis =
    swipeDirection === 'left' || swipeDirection === 'right' ? 'horizontal' : 'vertical';
  const isVerticalScrollAxis = scrollAxis === 'vertical';
  const crossScrollAxis: ScrollAxis = isVerticalScrollAxis ? 'horizontal' : 'vertical';

  const [swipeRelease, setSwipeRelease] = React.useState<number | null>(null);
  const [availableHeight, setAvailableHeight] = React.useState<number | null>(null);
  const [keyboardInset, setKeyboardInset] = React.useState(0);

  const pendingSwipeCloseSnapPointRef = React.useRef<typeof activeSnapPoint>(undefined);
  const resetSwipeRef = React.useRef<(() => void) | null>(null);
  const controlledDismissFrame = useAnimationFrame();

  const nestedSwipeActiveRef = React.useRef(false);
  const lastPointerTypeRef = React.useRef<React.PointerEvent['pointerType'] | ''>('');
  const ignoreNextTouchStartFromPenRef = React.useRef(false);
  const ignoreTouchSwipeRef = React.useRef(false);
  const touchScrollStateRef = React.useRef<TouchScrollState | null>(null);
  const pendingKeyboardFocusTargetRef = React.useRef<HTMLElement | null>(null);
  const pendingKeyboardFocusMovedRef = React.useRef(false);
  const focusedKeyboardTargetRef = React.useRef<HTMLElement | null>(null);
  const focusedKeyboardScrollTargetRef = React.useRef<HTMLElement | null>(null);
  const keepKeyboardScrollBottomAnchoredRef = React.useRef(false);
  const keyboardFocusSettleFrameRef = React.useRef(0);

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

  const setSwipeDismissed = useStableCallback((dismissed: boolean) => {
    setSwipeDismissedElements(popupRef.current, backdropRef.current, dismissed);
  });

  const clearSwipeRelease = useStableCallback(() => {
    setSwipeDismissed(false);
    popupRef.current?.removeAttribute(TransitionStatusDataAttributes.endingStyle);
    setSwipeRelease(null);
  });

  const finishNestedSwipe = useStableCallback(() => {
    if (!nestedSwipeActiveRef.current) {
      return;
    }

    nestedSwipeActiveRef.current = false;
    notifyParentSwipingChange?.(false);
  });

  const syncVirtualKeyboardMetrics = useStableCallback(() => {
    if (!virtualKeyboardAware) {
      setAvailableHeight(null);
      setKeyboardInset(0);
      return;
    }

    const popupElement = popupRef.current;
    if (!popupElement) {
      setAvailableHeight(null);
      setKeyboardInset(0);
      return;
    }

    const win = ownerWindow(popupElement);
    const nextAvailableHeight = getAvailableHeight(win, popupElement, nestedDrawerOpen);
    const nextKeyboardInset = getKeyboardInset(win, popupElement);

    setAvailableHeight((prevAvailableHeight) =>
      prevAvailableHeight === nextAvailableHeight ? prevAvailableHeight : nextAvailableHeight,
    );
    setKeyboardInset((prevKeyboardInset) =>
      prevKeyboardInset === nextKeyboardInset ? prevKeyboardInset : nextKeyboardInset,
    );
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
      const nestedSwipeProgress = open && shouldTrackProgress ? resolvedProgress : 0;

      if (notifyParent && notifyParentSwipeProgressChange) {
        notifyParentSwipeProgressChange(nestedSwipeProgress);

        if (nestedSwipeProgress <= 0) {
          finishNestedSwipe();
        }
      }

      visualStateStore?.set({
        swipeProgress,
        frontmostHeight: swipeProgress > 0 ? frontmostHeight : 0,
      });

      const backdropElement = backdropRef.current;
      if (!backdropElement) {
        return;
      }

      if (!isActive || swipeProgress <= 0) {
        backdropElement.style.setProperty(DrawerBackdropCssVars.swipeProgress, '0');
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

  function resolveSwipeRelease({
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
  }): number | null {
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
    const fallbackVelocity = direction === 'left' || direction === 'right' ? velocityX : velocityY;
    const resolvedVelocity =
      Math.abs(axisVelocity) > 0 && Number.isFinite(axisVelocity) ? axisVelocity : fallbackVelocity;
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

    return durationScalar;
  }

  function updateNestedSwipeActive(details?: UseSwipeDismissProgressDetails) {
    if (nestedSwipeActiveRef.current || !details) {
      return;
    }

    const direction = details.direction ?? swipeDirection;
    const delta = direction === 'left' || direction === 'right' ? details.deltaX : details.deltaY;
    if (!Number.isFinite(delta) || Math.abs(delta) < MIN_SWIPE_THRESHOLD) {
      return;
    }

    nestedSwipeActiveRef.current = true;
    notifyParentSwipingChange?.(true);
  }

  const swipe = useSwipeDismiss({
    enabled: mounted && !nestedDrawerOpen,
    directions: swipeDirections,
    elementRef: store.context.popupRef,
    ignoreSelectorWhenTouch: false,
    ignoreScrollableAncestors: true,
    movementCssVars: {
      x: DrawerPopupCssVars.swipeMovementX,
      y: DrawerPopupCssVars.swipeMovementY,
    },
    onSwipeStart(event) {
      if ('touches' in event || ('pointerType' in event && event.pointerType === 'touch')) {
        return;
      }

      const popupElement = popupRef.current;
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
    },
    onSwipingChange(swiping) {
      setBackdropSwipingAttribute(store.context.backdropRef.current, swiping);

      if (!swiping && !notifyParentSwipeProgressChange) {
        finishNestedSwipe();
      }
    },
    swipeThreshold({ element, direction }) {
      return getBaseSwipeThreshold(element, direction);
    },
    canStart(position, details) {
      const popupElement = store.context.popupRef.current;
      if (!popupElement) {
        return false;
      }

      const doc = popupElement.ownerDocument;
      const elementAtPoint = getElementAtPoint(doc, position.x, position.y);
      if (!elementAtPoint || !contains(popupElement, elementAtPoint)) {
        return false;
      }

      const nativeEvent = details.nativeEvent;
      const touchLike =
        'touches' in nativeEvent ||
        ('pointerType' in nativeEvent && nativeEvent.pointerType === 'touch');
      if (touchLike && shouldIgnoreSwipeForTextSelection(doc, popupElement)) {
        return false;
      }

      if (nativeEvent.type === 'touchstart' && isSwipeIgnoredTarget(elementAtPoint)) {
        return false;
      }

      return true;
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

        finishNestedSwipe();
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
      const closeFromSnapPoints = () => {
        pendingSwipeCloseSnapPointRef.current = activeSnapPoint;
        setActiveSnapPoint?.(null, snapPointEventDetails);
        startSwipeRelease(swipeDirection);
        return true;
      };

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
            return closeFromSnapPoints();
          }
        }

        const closeOffset = popupHeight;
        const closeDistance = Math.abs(effectiveTargetOffset - closeOffset);
        const snapDistance = Math.abs(effectiveTargetOffset - targetSnapPoint.offset);
        if (closeDistance < snapDistance) {
          return closeFromSnapPoints();
        }

        setActiveSnapPoint?.(targetSnapPoint.value, snapPointEventDetails);
        clearSwipeRelease();
        return false;
      }

      if (resolvedDirectionalVelocity >= FAST_SWIPE_VELOCITY && dragDelta > 0) {
        return closeFromSnapPoints();
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
        return closeFromSnapPoints();
      }

      setActiveSnapPoint?.(closestSnapPoint.value, snapPointEventDetails);
      clearSwipeRelease();
      return false;
    },
    onDismiss(event) {
      visualStateStore?.set({ swipeProgress: 0, frontmostHeight: 0 });

      const backdropElement = store.context.backdropRef.current;
      if (backdropElement) {
        backdropElement.style.setProperty(DrawerBackdropCssVars.swipeProgress, '0');
        backdropElement.style.removeProperty(DrawerPopupCssVars.height);
      }

      const dismissEventDetails: Parameters<typeof store.setOpen>[1] = createChangeEventDetails(
        REASONS.swipe,
        event,
      );
      store.setOpen(false, dismissEventDetails);

      if (dismissEventDetails.isCanceled) {
        const pendingSnapPoint = pendingSwipeCloseSnapPointRef.current;
        if (pendingSnapPoint !== undefined) {
          setActiveSnapPoint?.(pendingSnapPoint, createChangeEventDetails(REASONS.swipe, event));
        }

        pendingSwipeCloseSnapPointRef.current = undefined;
        resetSwipeRef.current?.();
        clearSwipeRelease();
        return;
      }

      // In controlled mode, the effective open state may not have changed yet
      // (openProp takes precedence over state.open). Proceed optimistically with the
      // dismiss animation — React's Scheduler flushes before the next rAF, so we can
      // reliably check whether the parent accepted or rejected the close.
      // Note: if onOpenChange is asynchronous (e.g., closes the drawer after a network
      // call), the rAF check will see open === true, revert the animation, and the
      // drawer will close without animation when the parent eventually sets open={false}.
      if (store.select('open')) {
        const savedEvent = event;
        controlledDismissFrame.request(() => {
          if (store.select('open')) {
            // Parent rejected: revert animation and restore snap point.
            const pendingSnapPoint = pendingSwipeCloseSnapPointRef.current;
            if (pendingSnapPoint !== undefined) {
              setActiveSnapPoint?.(
                pendingSnapPoint,
                createChangeEventDetails(REASONS.swipe, savedEvent),
              );
            }
            pendingSwipeCloseSnapPointRef.current = undefined;
            clearSwipeRelease();
            resetSwipeRef.current?.();
          } else {
            // Parent accepted: clean up the ref.
            pendingSwipeCloseSnapPointRef.current = undefined;
          }
        });
        return;
      }

      pendingSwipeCloseSnapPointRef.current = undefined;
      setSwipeDismissed(true);
    },
  });

  const swipePointerProps = swipe.getPointerProps();
  const swipeTouchProps = swipe.getTouchProps();
  const resetSwipe = swipe.reset;
  resetSwipeRef.current = resetSwipe;

  React.useEffect(() => {
    const rootElement = viewportElement ?? popupElementState;
    if (!rootElement) {
      return undefined;
    }
    const resolvedRootElement: HTMLElement = rootElement;

    const doc = ownerDocument(resolvedRootElement);
    const win = ownerWindow(doc);

    function handleNativeTouchMove(event: TouchEvent) {
      if (ignoreTouchSwipeRef.current) {
        return;
      }

      const touchState = touchScrollStateRef.current;
      const touch = event.touches[0];
      if (!touch || !touchState) {
        return;
      }

      if (
        !pendingKeyboardFocusMovedRef.current &&
        virtualKeyboardAware &&
        (Math.abs(touch.clientX - touchState.startX) > INPUT_TAP_MOVE_THRESHOLD ||
          Math.abs(touch.clientY - touchState.startY) > INPUT_TAP_MOVE_THRESHOLD)
      ) {
        pendingKeyboardFocusMovedRef.current = true;
      }

      const drawerAxisDelta = isVerticalScrollAxis
        ? touch.clientY - touchState.lastY
        : touch.clientX - touchState.lastX;

      // Preserve native range interaction by never locking touchmove for range inputs.
      if (isEventOnRangeInput(event, win)) {
        touchState.allowSwipe = false;
        updateTouchScrollPosition(touchState, touch);
        return;
      }

      // Avoid blocking pinch zoom or text selection adjustments on iOS Safari.
      if (event.touches.length === 2) {
        updateTouchScrollPosition(touchState, touch);
        return;
      }

      const allowTouchMove = shouldIgnoreSwipeForTextSelection(doc, resolvedRootElement);

      if (allowTouchMove || !open || !mounted || nestedDrawerOpen) {
        updateTouchScrollPosition(touchState, touch);
        return;
      }

      if (preserveNativeCrossAxisScrollOnMove(touchState, touch, isVerticalScrollAxis)) {
        updateTouchScrollPosition(touchState, touch);
        return;
      }

      const scrollTarget = touchState.scrollTarget;
      if (!scrollTarget || scrollTarget === doc.documentElement || scrollTarget === doc.body) {
        if (event.cancelable) {
          event.preventDefault();
        }
        updateTouchScrollPosition(touchState, touch);
        return;
      }

      const hasScrollableContent = hasScrollableContentOnAxis(scrollTarget, scrollAxis);
      if (!hasScrollableContent) {
        // If the scroll container doesn't overflow on the drawer axis, prevent the window from
        // scrolling instead.
        if (event.cancelable) {
          event.preventDefault();
        }
        updateTouchScrollPosition(touchState, touch);
        return;
      }

      const delta = drawerAxisDelta;
      if (delta !== 0) {
        const canSwipeFromScrollEdge = canSwipeFromScrollEdgeOnMove(
          scrollTarget,
          scrollAxis,
          swipeDirection,
          delta,
        );

        if (!touchState.allowSwipe) {
          if (!event.cancelable) {
            touchState.allowSwipe = false;
          } else if (canSwipeFromScrollEdge) {
            touchState.allowSwipe = true;
            event.preventDefault();
          } else {
            touchState.allowSwipe = false;
          }
        } else if (event.cancelable) {
          event.preventDefault();
        }
      }

      updateTouchScrollPosition(touchState, touch);
    }

    return addEventListener(doc, 'touchmove', handleNativeTouchMove, {
      passive: false,
      capture: true,
    });
  }, [
    mounted,
    nestedDrawerOpen,
    open,
    popupElementState,
    isVerticalScrollAxis,
    scrollAxis,
    swipeDirection,
    virtualKeyboardAware,
    viewportElement,
  ]);

  useIsoLayoutEffect(() => {
    if (!virtualKeyboardAware || !mounted || !open) {
      setAvailableHeight(null);
      setKeyboardInset(0);
      return undefined;
    }

    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      setAvailableHeight(null);
      setKeyboardInset(0);
      return undefined;
    }

    const doc = ownerDocument(popupElement);
    const win = ownerWindow(popupElement);
    const visualViewport = win.visualViewport;

    syncVirtualKeyboardMetrics();

    if (!visualViewport) {
      return () => {
        setAvailableHeight(null);
        setKeyboardInset(0);
      };
    }

    const handleFocusChange = () => {
      syncVirtualKeyboardMetrics();
    };

    visualViewport.addEventListener('resize', syncVirtualKeyboardMetrics);
    visualViewport.addEventListener('scroll', syncVirtualKeyboardMetrics);
    doc.addEventListener('focusin', handleFocusChange, true);
    doc.addEventListener('focusout', handleFocusChange, true);

    return () => {
      visualViewport.removeEventListener('resize', syncVirtualKeyboardMetrics);
      visualViewport.removeEventListener('scroll', syncVirtualKeyboardMetrics);
      doc.removeEventListener('focusin', handleFocusChange, true);
      doc.removeEventListener('focusout', handleFocusChange, true);
      setAvailableHeight(null);
      setKeyboardInset(0);
    };
  }, [
    mounted,
    nestedDrawerOpen,
    open,
    store.context.popupRef,
    syncVirtualKeyboardMetrics,
    virtualKeyboardAware,
  ]);

  const cancelKeyboardFocusAlignment = useStableCallback(() => {
    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      return;
    }

    const win = ownerWindow(popupElement);
    if (keyboardFocusSettleFrameRef.current) {
      win.cancelAnimationFrame(keyboardFocusSettleFrameRef.current);
      keyboardFocusSettleFrameRef.current = 0;
    }
  });

  const alignFocusedKeyboardTarget = useStableCallback(() => {
    const target = focusedKeyboardTargetRef.current;
    const scrollTarget = focusedKeyboardScrollTargetRef.current;
    if (!target || !scrollTarget) {
      return;
    }

    const rootElement = viewportElement ?? popupElementState;
    if (!rootElement || !contains(rootElement, target) || !contains(rootElement, scrollTarget)) {
      return;
    }

    const maxScrollTop = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight);
    if (maxScrollTop <= 0) {
      return;
    }

    if (keepKeyboardScrollBottomAnchoredRef.current) {
      scrollTarget.scrollTop = maxScrollTop;
      return;
    }

    const scrollTargetRect = scrollTarget.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetOffsetTop = targetRect.top - scrollTargetRect.top + scrollTarget.scrollTop;
    const targetCenterOffset =
      targetOffsetTop - (scrollTarget.clientHeight - targetRect.height) / 2;

    scrollTarget.scrollTop = clamp(targetCenterOffset, 0, maxScrollTop);
  });

  const scheduleKeyboardFocusAlignment = useStableCallback(() => {
    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      return;
    }

    const win = ownerWindow(popupElement);
    cancelKeyboardFocusAlignment();

    let remainingFrames = 2;
    const tick = () => {
      alignFocusedKeyboardTarget();
      remainingFrames -= 1;

      if (remainingFrames > 0) {
        keyboardFocusSettleFrameRef.current = win.requestAnimationFrame(tick);
      } else {
        keyboardFocusSettleFrameRef.current = 0;
      }
    };

    keyboardFocusSettleFrameRef.current = win.requestAnimationFrame(tick);
  });

  React.useEffect(() => {
    if (!virtualKeyboardAware || !open || !mounted) {
      focusedKeyboardTargetRef.current = null;
      focusedKeyboardScrollTargetRef.current = null;
      keepKeyboardScrollBottomAnchoredRef.current = false;
      cancelKeyboardFocusAlignment();
      return undefined;
    }

    const rootElement = viewportElement ?? popupElementState;
    if (!rootElement) {
      return undefined;
    }

    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      return undefined;
    }

    const doc = ownerDocument(popupElement);
    const win = ownerWindow(popupElement);
    const visualViewport = win.visualViewport;

    if (!visualViewport) {
      return undefined;
    }

    const clearFocusedKeyboardTarget = () => {
      focusedKeyboardTargetRef.current = null;
      focusedKeyboardScrollTargetRef.current = null;
      keepKeyboardScrollBottomAnchoredRef.current = false;
      cancelKeyboardFocusAlignment();
    };

    const captureFocusedKeyboardTarget = (target: EventTarget | null) => {
      if (!isKeyboardInputTarget(target) || !contains(rootElement, target)) {
        return false;
      }

      const scrollTarget = findScrollableTouchTarget(target, rootElement, 'vertical');
      if (!scrollTarget) {
        return false;
      }

      focusedKeyboardTargetRef.current = target;
      focusedKeyboardScrollTargetRef.current = scrollTarget;
      keepKeyboardScrollBottomAnchoredRef.current = isElementScrolledToBottom(scrollTarget);
      return true;
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (captureFocusedKeyboardTarget(event.target)) {
        scheduleKeyboardFocusAlignment();
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      if (captureFocusedKeyboardTarget(event.relatedTarget)) {
        scheduleKeyboardFocusAlignment();
        return;
      }

      clearFocusedKeyboardTarget();
    };

    const handleViewportUpdate = () => {
      if (focusedKeyboardTargetRef.current) {
        scheduleKeyboardFocusAlignment();
      }
    };

    doc.addEventListener('focusin', handleFocusIn, true);
    doc.addEventListener('focusout', handleFocusOut, true);
    visualViewport.addEventListener('resize', handleViewportUpdate);
    visualViewport.addEventListener('scroll', handleViewportUpdate);

    return () => {
      doc.removeEventListener('focusin', handleFocusIn, true);
      doc.removeEventListener('focusout', handleFocusOut, true);
      visualViewport.removeEventListener('resize', handleViewportUpdate);
      visualViewport.removeEventListener('scroll', handleViewportUpdate);
      clearFocusedKeyboardTarget();
    };
  }, [
    cancelKeyboardFocusAlignment,
    mounted,
    open,
    popupElementState,
    scheduleKeyboardFocusAlignment,
    store.context.popupRef,
    virtualKeyboardAware,
    viewportElement,
  ]);

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
    notifyParentSwipeProgressChange,
    open,
    snapPointProgress,
    snapPointRange,
    swipe.swiping,
    store,
    visualStateStore,
  ]);

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
    const backdropElement = backdropRef.current;

    return () => {
      visualStateStore?.set({ swipeProgress: 0, frontmostHeight: 0 });
      setBackdropSwipingAttribute(backdropElement, false);
      finishNestedSwipe();
    };
  }, [backdropRef, finishNestedSwipe, visualStateStore]);

  const swipeProviderValue = React.useMemo(
    () => ({
      swiping: swipe.swiping,
      getDragStyles: swipe.getDragStyles,
      swipeStrength: swipeRelease ?? null,
      setSwipeDismissed,
    }),
    [setSwipeDismissed, swipe.getDragStyles, swipe.swiping, swipeRelease],
  );

  function resetTouchTrackingState() {
    ignoreTouchSwipeRef.current = false;
    touchScrollStateRef.current = null;
    pendingKeyboardFocusTargetRef.current = null;
    pendingKeyboardFocusMovedRef.current = false;
    lastPointerTypeRef.current = '';
    ignoreNextTouchStartFromPenRef.current = false;
  }

  return (
    <DialogViewport
      ref={forwardedRef}
      className={className}
      render={render}
      {...mergeProps<'div'>(elementProps, {
        onPointerDown(event) {
          lastPointerTypeRef.current = event.pointerType;
          ignoreNextTouchStartFromPenRef.current = event.pointerType === 'pen';

          if (!open || !mounted || nestedDrawerOpen) {
            return;
          }

          const doc = ownerDocument(event.currentTarget);
          const elementAtPoint = getElementAtPoint(doc, event.clientX, event.clientY);
          if (isSwipeIgnoredTarget(elementAtPoint) || isDrawerContentTarget(elementAtPoint)) {
            return;
          }

          if (event.pointerType === 'touch') {
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
          if (lastPointerTypeRef.current === event.pointerType) {
            lastPointerTypeRef.current = '';
          }

          if (event.pointerType === 'touch') {
            return;
          }

          swipePointerProps.onPointerUp?.(event);
        },
        onPointerCancel(event) {
          if (lastPointerTypeRef.current === event.pointerType) {
            lastPointerTypeRef.current = '';
          }

          if (event.pointerType === 'touch') {
            return;
          }

          swipePointerProps.onPointerCancel?.(event);
        },
        onTouchStart(event) {
          const startedFromPenPointerDown =
            lastPointerTypeRef.current === 'pen' && ignoreNextTouchStartFromPenRef.current;
          if (startedFromPenPointerDown) {
            ignoreNextTouchStartFromPenRef.current = false;
            ignoreTouchSwipeRef.current = false;
            touchScrollStateRef.current = null;
            return;
          }

          if (!open || !mounted || nestedDrawerOpen) {
            ignoreTouchSwipeRef.current = false;
            touchScrollStateRef.current = null;
            return;
          }

          const touch = event.touches[0];
          if (!touch) {
            return;
          }

          if (isReactTouchEventOnRangeInput(event)) {
            ignoreTouchSwipeRef.current = false;
            touchScrollStateRef.current = null;
            return;
          }

          const doc = ownerDocument(event.currentTarget);
          const elementAtPoint = getElementAtPoint(doc, touch.clientX, touch.clientY);
          ignoreTouchSwipeRef.current = isSwipeIgnoredTarget(elementAtPoint);
          if (ignoreTouchSwipeRef.current) {
            touchScrollStateRef.current = null;
            return;
          }

          const rootElement = viewportElement ?? popupElementState;
          const eventTarget = getTarget(event.nativeEvent);
          const fallbackTarget = isElement(eventTarget) ? eventTarget : null;
          const target = isElement(elementAtPoint) ? elementAtPoint : fallbackTarget;
          if (rootElement && target && !contains(rootElement, target)) {
            ignoreTouchSwipeRef.current = true;
            touchScrollStateRef.current = null;
            return;
          }

          const pendingKeyboardFocusTarget =
            virtualKeyboardAware && rootElement
              ? (resolveKeyboardInputTargetFromPoint(
                  rootElement,
                  doc,
                  touch.clientX,
                  touch.clientY,
                ) ?? resolveKeyboardInputTarget(target))
              : null;
          pendingKeyboardFocusTargetRef.current =
            rootElement &&
            pendingKeyboardFocusTarget &&
            contains(rootElement, pendingKeyboardFocusTarget)
              ? pendingKeyboardFocusTarget
              : null;
          pendingKeyboardFocusMovedRef.current = false;

          let scrollTarget: HTMLElement | null = null;
          let hasCrossAxisScrollableContent = false;
          if (rootElement && target) {
            scrollTarget = findScrollableTouchTarget(target, rootElement, scrollAxis);
            hasCrossAxisScrollableContent =
              findScrollableTouchTarget(target, rootElement, crossScrollAxis) != null;
          }

          let allowSwipe: boolean | null = null;
          if (scrollTarget) {
            const canSwipeFromEdge = isAtSwipeStartEdge(scrollTarget, scrollAxis, swipeDirection);
            allowSwipe = canSwipeFromEdge ? null : false;
          }

          touchScrollStateRef.current = {
            startX: touch.clientX,
            startY: touch.clientY,
            lastX: touch.clientX,
            lastY: touch.clientY,
            scrollTarget,
            hasCrossAxisScrollableContent,
            allowSwipe,
            preserveNativeCrossAxisScroll: false,
          };

          swipeTouchProps.onTouchStart?.(event);
        },
        onTouchMove(event) {
          if (ignoreTouchSwipeRef.current) {
            return;
          }

          if (isReactTouchEventOnRangeInput(event)) {
            return;
          }

          const touchState = touchScrollStateRef.current;
          if (touchState?.preserveNativeCrossAxisScroll) {
            return;
          }

          if (
            touchState?.allowSwipe === false ||
            (touchState?.scrollTarget != null && !touchState.allowSwipe)
          ) {
            return;
          }

          swipeTouchProps.onTouchMove?.(event);
        },
        onTouchEnd(event) {
          const rootElement = viewportElement ?? popupElementState;

          if (virtualKeyboardAware && rootElement && !pendingKeyboardFocusMovedRef.current) {
            const touch = event.changedTouches[0] ?? event.touches[0];
            const doc = ownerDocument(event.currentTarget);
            const elementAtPoint = touch
              ? getElementAtPoint(doc, touch.clientX, touch.clientY)
              : null;
            const nativeEventTarget = getTarget(event.nativeEvent);
            const fallbackTouchTarget = isHTMLElement(nativeEventTarget) ? nativeEventTarget : null;
            const touchTarget = isHTMLElement(elementAtPoint)
              ? elementAtPoint
              : fallbackTouchTarget;
            const resolvedTouchKeyboardTarget = touch
              ? (resolveKeyboardInputTargetFromPoint(
                  rootElement,
                  doc,
                  touch.clientX,
                  touch.clientY,
                ) ?? (touchTarget ? resolveKeyboardInputTarget(touchTarget) : null))
              : null;
            const pendingKeyboardFocusTarget = pendingKeyboardFocusTargetRef.current;
            let keyboardFocusTarget: HTMLElement | null = null;
            if (pendingKeyboardFocusTarget && contains(rootElement, pendingKeyboardFocusTarget)) {
              keyboardFocusTarget = pendingKeyboardFocusTarget;
            } else if (
              resolvedTouchKeyboardTarget &&
              contains(rootElement, resolvedTouchKeyboardTarget)
            ) {
              keyboardFocusTarget = resolvedTouchKeyboardTarget;
            }

            if (
              keyboardFocusTarget &&
              ((touchTarget &&
                (touchTarget === keyboardFocusTarget ||
                  contains(keyboardFocusTarget, touchTarget))) ||
                resolvedTouchKeyboardTarget === keyboardFocusTarget)
            ) {
              if (activeElement(ownerDocument(keyboardFocusTarget)) === keyboardFocusTarget) {
                resetTouchTrackingState();
                return;
              }

              event.preventDefault();
              focusKeyboardInputWithoutPageScroll(keyboardFocusTarget);
              resetTouchTrackingState();
              return;
            }
          }

          resetTouchTrackingState();
          swipeTouchProps.onTouchEnd?.(event);
        },
        onTouchCancel(event) {
          resetTouchTrackingState();
          swipeTouchProps.onTouchCancel?.(event);
        },
        // Drawer popups use drawer-specific nested state attributes.
        // Suppress DialogViewport's generic nested dialog attribute.
        ['data-nested-dialog-open' as string]: undefined,
        style:
          virtualKeyboardAware && (availableHeight !== null || keyboardInset > 0)
            ? ({
                [DrawerPopupCssVars.availableHeight]:
                  availableHeight !== null ? `${availableHeight}px` : undefined,
                '--drawer-keyboard-inset': keyboardInset > 0 ? `${keyboardInset}px` : undefined,
              } as React.CSSProperties)
            : undefined,
      })}
    >
      <DrawerViewportContext.Provider value={swipeProviderValue}>
        {children}
      </DrawerViewportContext.Provider>
    </DialogViewport>
  );
});

export interface DrawerViewportState {
  /**
   * Whether the drawer is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * Whether the drawer is nested within another drawer.
   */
  nested: boolean;
  /**
   * Whether the drawer has nested drawers open.
   */
  nestedDialogOpen: boolean;
}

export interface DrawerViewportProps extends BaseUIComponentProps<'div', DrawerViewportState> {}

export namespace DrawerViewport {
  export type Props = DrawerViewportProps;
  export type State = DrawerViewportState;
}

function setSwipeDismissedElements(
  popupElement: HTMLElement | null,
  backdropElement: HTMLElement | null,
  dismissed: boolean,
) {
  if (dismissed) {
    popupElement?.setAttribute(DrawerPopupDataAttributes.swipeDismiss, '');
    backdropElement?.setAttribute(DrawerPopupDataAttributes.swipeDismiss, '');
    return;
  }

  popupElement?.removeAttribute(DrawerPopupDataAttributes.swipeDismiss);
  backdropElement?.removeAttribute(DrawerPopupDataAttributes.swipeDismiss);
}

function setBackdropSwipingAttribute(backdropElement: HTMLElement | null, swiping: boolean) {
  if (!backdropElement) {
    return;
  }

  if (swiping) {
    backdropElement.setAttribute(DrawerPopupDataAttributes.swiping, '');
    return;
  }

  backdropElement.removeAttribute(DrawerPopupDataAttributes.swiping);
}

function isSwipeIgnoredTarget(target: Element | null): boolean {
  return Boolean(target?.closest(BASE_UI_SWIPE_IGNORE_SELECTOR));
}

function isDrawerContentTarget(target: Element | null): boolean {
  return Boolean(target?.closest(DRAWER_CONTENT_SELECTOR));
}

function getBaseSwipeThreshold(element: HTMLElement, direction: SwipeDirection): number {
  const size =
    direction === 'left' || direction === 'right' ? element.offsetWidth : element.offsetHeight;
  return Math.max(size * 0.5, MIN_SWIPE_THRESHOLD);
}

function isRangeInput(
  target: EventTarget | null,
  win: ReturnType<typeof ownerWindow>,
): target is HTMLInputElement {
  return target instanceof win.HTMLInputElement && target.type === 'range';
}

function isTextSelectionControl(
  target: EventTarget | null,
): target is HTMLInputElement | HTMLTextAreaElement {
  if (!isElement(target)) {
    return false;
  }

  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
}

function hasExpandedSelectionWithinTarget(selection: Selection, target: Element): boolean {
  const anchorElement = isElement(selection.anchorNode)
    ? selection.anchorNode
    : selection.anchorNode?.parentElement;
  const focusElement = isElement(selection.focusNode)
    ? selection.focusNode
    : selection.focusNode?.parentElement;

  return (
    selection.containsNode(target, true) ||
    contains(target, anchorElement) ||
    contains(target, focusElement)
  );
}

function shouldIgnoreSwipeForTextSelection(doc: Document, rootElement: HTMLElement): boolean {
  const activeEl = activeElement(doc);
  const activeElementWithinRoot = Boolean(activeEl && contains(rootElement, activeEl));

  if (activeElementWithinRoot && isTextSelectionControl(activeEl)) {
    const { selectionStart, selectionEnd } = activeEl;
    if (selectionStart != null && selectionEnd != null && selectionStart < selectionEnd) {
      return true;
    }
  }

  const selection = doc.getSelection?.();
  if (!selection || selection.isCollapsed) {
    return false;
  }

  return hasExpandedSelectionWithinTarget(selection, rootElement);
}

function isEventOnRangeInput(event: TouchEvent, win: ReturnType<typeof ownerWindow>): boolean {
  const composedPath = event.composedPath();
  if (composedPath) {
    return composedPath.some((pathTarget) => isRangeInput(pathTarget, win));
  }

  return isRangeInput(getTarget(event), win);
}

function isReactTouchEventOnRangeInput(event: React.TouchEvent<Element>): boolean {
  return isEventOnRangeInput(event.nativeEvent, ownerWindow(event.currentTarget));
}

function updateTouchScrollPosition(touchState: TouchScrollState, touch: Touch): void {
  touchState.lastX = touch.clientX;
  touchState.lastY = touch.clientY;
}

function isElementScrolledToBottom(element: HTMLElement): boolean {
  return element.scrollTop + element.clientHeight >= element.scrollHeight - 2;
}

function preserveNativeCrossAxisScrollOnMove(
  touchState: TouchScrollState,
  touch: Touch,
  isVerticalScrollAxis: boolean,
): boolean {
  if (touchState.preserveNativeCrossAxisScroll) {
    return true;
  }

  if (touchState.allowSwipe === true || !touchState.hasCrossAxisScrollableContent) {
    return false;
  }

  const drawerAxisGestureDelta = isVerticalScrollAxis
    ? touch.clientY - touchState.startY
    : touch.clientX - touchState.startX;
  const crossAxisGestureDelta = isVerticalScrollAxis
    ? touch.clientX - touchState.startX
    : touch.clientY - touchState.startY;
  const absDrawerAxisGestureDelta = Math.abs(drawerAxisGestureDelta);
  const absCrossAxisGestureDelta = Math.abs(crossAxisGestureDelta);

  if (absCrossAxisGestureDelta < 6 || absCrossAxisGestureDelta <= absDrawerAxisGestureDelta + 2) {
    return false;
  }

  touchState.preserveNativeCrossAxisScroll = true;
  return true;
}

function hasScrollableContentOnAxis(scrollTarget: HTMLElement, axis: ScrollAxis): boolean {
  return axis === 'vertical'
    ? scrollTarget.scrollHeight > scrollTarget.clientHeight
    : scrollTarget.scrollWidth > scrollTarget.clientWidth;
}

function getScrollMetrics(scrollTarget: HTMLElement, axis: ScrollAxis) {
  if (axis === 'vertical') {
    const max = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight);
    return { offset: scrollTarget.scrollTop, max };
  }

  const max = Math.max(0, scrollTarget.scrollWidth - scrollTarget.clientWidth);
  return { offset: scrollTarget.scrollLeft, max };
}

function isAtSwipeStartEdge(
  scrollTarget: HTMLElement,
  axis: ScrollAxis,
  direction: SwipeDirection,
): boolean {
  const { offset, max } = getScrollMetrics(scrollTarget, axis);
  const dismissFromStartEdge = shouldDismissFromStartEdge(direction, axis);
  if (dismissFromStartEdge === null) {
    return false;
  }

  return dismissFromStartEdge ? offset <= 0 : offset >= max;
}

function canSwipeFromScrollEdgeOnMove(
  scrollTarget: HTMLElement,
  axis: ScrollAxis,
  direction: SwipeDirection,
  delta: number,
): boolean {
  const { offset, max } = getScrollMetrics(scrollTarget, axis);
  const dismissFromStartEdge = shouldDismissFromStartEdge(direction, axis);
  if (dismissFromStartEdge === null) {
    return false;
  }

  const movingTowardDismiss = dismissFromStartEdge ? delta > 0 : delta < 0;
  if (!movingTowardDismiss) {
    return false;
  }

  return dismissFromStartEdge ? offset <= 0 : offset >= max;
}

function shouldDismissFromStartEdge(direction: SwipeDirection, axis: ScrollAxis): boolean | null {
  if (axis === 'vertical') {
    if (direction === 'down') {
      return true;
    }
    if (direction === 'up') {
      return false;
    }
    return null;
  }

  if (direction === 'right') {
    return true;
  }
  if (direction === 'left') {
    return false;
  }

  return null;
}

const KEYBOARD_INSET_THRESHOLD = 60;
const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

function isKeyboardInputElement(element: HTMLElement): boolean {
  const win = ownerWindow(element);

  if (element instanceof win.HTMLTextAreaElement || element.isContentEditable) {
    return true;
  }

  return element instanceof win.HTMLInputElement && !NON_TEXT_INPUT_TYPES.has(element.type);
}

function isKeyboardInputTarget(target: EventTarget | null): target is HTMLElement {
  return isHTMLElement(target) && isKeyboardInputElement(target);
}

function resolveKeyboardInputTarget(target: EventTarget | null): HTMLElement | null {
  if (!isHTMLElement(target)) {
    return null;
  }

  if (isKeyboardInputElement(target)) {
    return target;
  }

  const label = target.closest('label') as HTMLLabelElement | null;
  const control = label?.control ?? null;

  return isHTMLElement(control) && isKeyboardInputElement(control) ? control : null;
}

function getDistanceFromPointToRect(rect: DOMRect, clientX: number, clientY: number): number {
  const horizontalDistance = Math.max(rect.left - clientX, 0, clientX - rect.right);
  const verticalDistance = Math.max(rect.top - clientY, 0, clientY - rect.bottom);

  return horizontalDistance ** 2 + verticalDistance ** 2;
}

function resolveKeyboardInputTargetFromPoint(
  rootElement: HTMLElement,
  doc: Document,
  clientX: number,
  clientY: number,
): HTMLElement | null {
  const elementAtPoint = getElementAtPoint(doc, clientX, clientY);
  const directKeyboardTarget = resolveKeyboardInputTarget(elementAtPoint);

  if (directKeyboardTarget && contains(rootElement, directKeyboardTarget)) {
    return directKeyboardTarget;
  }

  const keyboardInputs = rootElement.querySelectorAll<HTMLElement>(
    'input, textarea, [contenteditable]',
  );
  let bestMatch: HTMLElement | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  keyboardInputs.forEach((keyboardInput) => {
    if (!isKeyboardInputElement(keyboardInput)) {
      return;
    }

    const rect = keyboardInput.getBoundingClientRect();
    if (
      clientX < rect.left - INPUT_TAP_HIT_SLOP ||
      clientX > rect.right + INPUT_TAP_HIT_SLOP ||
      clientY < rect.top - INPUT_TAP_HIT_SLOP ||
      clientY > rect.bottom + INPUT_TAP_HIT_SLOP
    ) {
      return;
    }

    const distance = getDistanceFromPointToRect(rect, clientX, clientY);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = keyboardInput;
    }
  });

  return bestMatch;
}

function focusKeyboardInputWithoutPageScroll(target: HTMLElement) {
  const previousTransform = target.style.transform;
  const previousTransition = target.style.transition;

  target.style.transform = 'translateY(-2000px)';
  target.style.transition = 'none';
  target.focus({ preventScroll: true });
  target.style.transform = previousTransform;
  target.style.transition = previousTransition;
}

function getAvailableHeight(
  win: Window,
  popupElement: HTMLElement,
  nestedDrawerOpen: boolean,
): number | null {
  const focusedElement = ownerDocument(popupElement).activeElement;
  if (
    nestedDrawerOpen ||
    !isTypeableElement(focusedElement) ||
    !contains(popupElement, focusedElement)
  ) {
    return null;
  }

  const visualViewport = win.visualViewport;
  if (!visualViewport || win.innerHeight - visualViewport.height <= KEYBOARD_INSET_THRESHOLD) {
    return null;
  }

  return Math.round(visualViewport.height);
}

function getKeyboardInset(win: Window, popupElement: HTMLElement): number {
  const visualViewport = win.visualViewport;
  if (!visualViewport) {
    return 0;
  }

  const focusedElement = ownerDocument(popupElement).activeElement;
  if (!contains(popupElement, focusedElement) || !isKeyboardInputTarget(focusedElement)) {
    return 0;
  }

  const keyboardInset = Math.max(0, Math.round(win.innerHeight - visualViewport.height));

  return keyboardInset > KEYBOARD_INSET_THRESHOLD ? keyboardInset : 0;
}
