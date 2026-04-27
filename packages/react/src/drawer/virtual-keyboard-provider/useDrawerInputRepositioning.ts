'use client';
import * as React from 'react';
import { getParentNode, isHTMLElement } from '@floating-ui/utils/dom';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { activeElement, contains, getTarget } from '../../floating-ui-react/utils';
import { clamp } from '../../internals/clamp';
import { getElementAtPoint } from '../../utils/getElementAtPoint';
import { findScrollableTouchTarget, isScrollable } from '../../utils/scrollable';

const KEYBOARD_INSET_THRESHOLD = 60;
const INPUT_TAP_MOVE_THRESHOLD = 10;
const INPUT_TAP_HIT_SLOP = 16;
const INPUT_REPOSITIONING_TOP_GAP = 10;
const INPUT_REPOSITIONING_SCROLL_ALIGNMENT_FRAMES = 30;
const INPUT_REPOSITIONING_OPEN_TRANSITION_DURATION = 400;
const INPUT_REPOSITIONING_CLOSE_TRANSITION_DURATION = 700;
const INPUT_REPOSITIONING_TRANSITION_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const NON_TEXT_INPUT_TYPE = /^(button|checkbox|color|file|hidden|image|radio|range|reset|submit)$/;

interface PopupStyleSnapshot {
  element: HTMLElement;
  position: string;
  top: string;
  right: string;
  bottom: string;
  left: string;
  width: string;
  height: string;
  transform: string;
  resolvedTransform: string;
  resolvedBottom: number;
  translate: string;
  resolvedTranslate: string;
  maxHeight: string;
  resolvedMaxHeight: string;
  transition: string;
  rectTop: number;
  rectLeft: number;
  rectWidth: number;
  pinsTop: boolean;
}

export function useDrawerInputRepositioning({ enabled }: { enabled: boolean }) {
  const { store } = useDialogRootContext();

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const nested = store.useState('nested');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const viewportElement = store.useState('viewportElement');
  const popupElementState = store.useState('popupElement');

  const nestedDrawerOpen = nestedOpenDialogCount > 0;

  const pendingKeyboardFocusMovedRef = React.useRef(false);
  const keyboardTouchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const focusedKeyboardTargetRef = React.useRef<HTMLElement | null>(null);
  const keyboardFocusSettleFrameRef = React.useRef(0);
  const forceKeyboardCloseRef = React.useRef(false);
  const popupInputRepositioningActiveRef = React.useRef(false);
  const popupStyleSnapshotRef = React.useRef<PopupStyleSnapshot | null>(null);
  const popupViewportSpacingRef = React.useRef<{ topGap: number; bleed: number } | null>(null);
  const inputRepositioningFillerRef = React.useRef<HTMLElement | null>(null);
  const startPopupInputRepositioningFrame = useAnimationFrame();
  const startInputRepositioningFillerFrame = useAnimationFrame();
  const clearPopupInputRepositioningTimeout = useTimeout();
  const keyboardFocusAlignmentTimeout = useTimeout();
  const removeInputRepositioningFillerTimeout = useTimeout();

  const clearPopupInputRepositioning = useStableCallback((element?: HTMLElement | null) => {
    const snapshot = popupStyleSnapshotRef.current;
    clearPopupInputRepositioningTimeout.clear();
    if (!snapshot) {
      return;
    }

    if (element && snapshot.element !== element) {
      return;
    }

    snapshot.element.style.position = snapshot.position;
    snapshot.element.style.top = snapshot.top;
    snapshot.element.style.right = snapshot.right;
    snapshot.element.style.bottom = snapshot.bottom;
    snapshot.element.style.left = snapshot.left;
    snapshot.element.style.width = snapshot.width;
    snapshot.element.style.height = snapshot.height;
    snapshot.element.style.transform = snapshot.transform;
    snapshot.element.style.translate = snapshot.translate;
    snapshot.element.style.maxHeight = snapshot.maxHeight;
    snapshot.element.style.transition = snapshot.transition;
    popupInputRepositioningActiveRef.current = false;
    popupStyleSnapshotRef.current = null;
    popupViewportSpacingRef.current = null;
    startPopupInputRepositioningFrame.cancel();
    startInputRepositioningFillerFrame.cancel();
  });

  const removeInputRepositioningFiller = useStableCallback(() => {
    startInputRepositioningFillerFrame.cancel();
    removeInputRepositioningFillerTimeout.clear();
    inputRepositioningFillerRef.current?.remove();
    inputRepositioningFillerRef.current = null;
  });

  const capturePopupStyleSnapshot = useStableCallback((element: HTMLElement) => {
    const snapshot = popupStyleSnapshotRef.current;
    if (snapshot?.element === element) {
      return snapshot;
    }

    clearPopupInputRepositioning();
    const win = ownerWindow(element);
    const computedStyle = win.getComputedStyle(element);
    const spacing = getPopupViewportSpacing(win, element, nested);
    const resolvedBottom = getComputedPixelValue(computedStyle.bottom);
    const rect = element.getBoundingClientRect();
    const nextSnapshot = {
      element,
      position: element.style.position,
      top: element.style.top,
      right: element.style.right,
      bottom: element.style.bottom,
      left: element.style.left,
      width: element.style.width,
      height: element.style.height,
      transform: element.style.transform,
      resolvedTransform: normalizeTransformValue(computedStyle.transform),
      resolvedBottom,
      translate: element.style.translate,
      resolvedTranslate: normalizeTranslateValue(computedStyle.translate),
      maxHeight: element.style.maxHeight,
      resolvedMaxHeight: resolveInitialPopupMaxHeight(
        win,
        element,
        computedStyle,
        spacing,
        null,
        0,
        resolvedBottom,
      ),
      transition: element.style.transition,
      rectTop: rect.top,
      rectLeft: rect.left,
      rectWidth: rect.width,
      pinsTop: shouldPinPopupToTop(win, computedStyle, spacing, resolvedBottom),
    };

    popupViewportSpacingRef.current = spacing;
    popupStyleSnapshotRef.current = nextSnapshot;
    return nextSnapshot;
  });

  const clearAfterCloseAnimation = useStableCallback((popupElement: HTMLElement) => {
    if (!popupStyleSnapshotRef.current) {
      return;
    }

    clearPopupInputRepositioningTimeout.start(INPUT_REPOSITIONING_CLOSE_TRANSITION_DURATION, () => {
      clearPopupInputRepositioning(popupElement);
    });
  });

  const applyPopupStyles = useStableCallback(
    (
      element: HTMLElement,
      availableHeight: number | null,
      keyboardInset: number,
      animate: boolean,
    ) => {
      const snapshot = popupStyleSnapshotRef.current;
      if (availableHeight === null && keyboardInset <= 0 && !snapshot) {
        return;
      }

      if (
        availableHeight === null &&
        keyboardInset <= 0 &&
        snapshot?.element === element &&
        !popupInputRepositioningActiveRef.current
      ) {
        return;
      }

      const currentSnapshot = capturePopupStyleSnapshot(element);
      if (!currentSnapshot) {
        return;
      }

      const wasInputRepositioningActive = popupInputRepositioningActiveRef.current;
      if (keyboardInset > 0) {
        popupInputRepositioningActiveRef.current = true;
      }

      const spacing =
        popupViewportSpacingRef.current ??
        getPopupViewportSpacing(ownerWindow(element), element, nested);
      const computedStyle = ownerWindow(element).getComputedStyle(element);
      const nextLiftOffset = Math.max(
        0,
        Math.round(keyboardInset > 0 ? keyboardInset - currentSnapshot.resolvedBottom : 0),
      );
      const nextTop = `${Math.round(currentSnapshot.rectTop)}px`;
      const nextBottom = `${nextLiftOffset}px`;
      const nextTransform = nested ? 'none' : currentSnapshot.resolvedTransform;
      const closingInputRepositioning = availableHeight === null && keyboardInset <= 0;
      const restoreAuthoredHeightOnClose =
        closingInputRepositioning && /^(auto|scroll|overlay)$/.test(computedStyle.overflowY);
      const transitionDuration =
        keyboardInset > 0
          ? INPUT_REPOSITIONING_OPEN_TRANSITION_DURATION
          : INPUT_REPOSITIONING_CLOSE_TRANSITION_DURATION;

      if (currentSnapshot.pinsTop) {
        const establishingAnimatedOffset =
          animate && !wasInputRepositioningActive && nextLiftOffset > 0;
        const nextMaxHeight = restoreAuthoredHeightOnClose ? currentSnapshot.maxHeight : 'none';

        const setPopupRepositioningLayout = () => {
          element.style.position = 'fixed';
          element.style.top = nextTop;
          element.style.right = 'auto';
          element.style.bottom = nextBottom;
          element.style.left = `${Math.round(currentSnapshot.rectLeft)}px`;
          element.style.width = `${Math.round(currentSnapshot.rectWidth)}px`;
          element.style.height = 'auto';
          element.style.transform = nextTransform;
          element.style.translate = currentSnapshot.resolvedTranslate;
          element.style.maxHeight = nextMaxHeight;
        };

        if (establishingAnimatedOffset) {
          element.style.position = 'fixed';
          element.style.top = nextTop;
          element.style.right = 'auto';
          element.style.bottom = '0px';
          element.style.left = `${Math.round(currentSnapshot.rectLeft)}px`;
          element.style.width = `${Math.round(currentSnapshot.rectWidth)}px`;
          element.style.height = 'auto';
          element.style.transform = nextTransform;
          element.style.translate = currentSnapshot.resolvedTranslate;
          element.style.maxHeight = nextMaxHeight;
        }

        element.style.transition = animate
          ? composeInputRepositioningTransition(
              currentSnapshot.transition,
              transitionDuration,
              'bottom',
            )
          : currentSnapshot.transition;

        if (!establishingAnimatedOffset) {
          setPopupRepositioningLayout();
        }

        if (establishingAnimatedOffset) {
          startPopupInputRepositioningFrame.request(() => {
            if (popupStyleSnapshotRef.current?.element === element) {
              setPopupRepositioningLayout();
            }
          });
        } else {
          startPopupInputRepositioningFrame.cancel();
        }
      } else {
        const nextMaxHeight =
          availableHeight !== null
            ? `${Math.round(Math.max(0, availableHeight - spacing.topGap + spacing.bleed))}px`
            : currentSnapshot.resolvedMaxHeight;
        const nextLiftOffsetPx = `${nextLiftOffset}px`;
        const nextTranslate =
          nextLiftOffset > 0 ? `0px -${nextLiftOffsetPx}` : currentSnapshot.resolvedTranslate;
        const nextMaxHeightStyle =
          closingInputRepositioning && restoreAuthoredHeightOnClose
            ? currentSnapshot.maxHeight
            : nextMaxHeight;

        element.style.transition = currentSnapshot.transition;
        element.style.transform = nextTransform;
        element.style.translate = nextTranslate;
        element.style.maxHeight = nextMaxHeightStyle;
        startPopupInputRepositioningFrame.cancel();
      }
    },
  );

  const applyInputRepositioningFiller = useStableCallback(
    (popup: HTMLElement, keyboardInset: number, animate: boolean) => {
      const existingFiller = inputRepositioningFillerRef.current;
      if (keyboardInset <= 0 && !existingFiller) {
        return;
      }

      const hostElement = popup.parentElement;
      if (!hostElement) {
        removeInputRepositioningFiller();
        return;
      }

      let fillerElement = existingFiller;
      const isNewFiller = !fillerElement || fillerElement.parentElement !== hostElement;
      if (!fillerElement || fillerElement.parentElement !== hostElement) {
        removeInputRepositioningFiller();
        fillerElement = ownerDocument(popup).createElement('div');
        fillerElement.setAttribute('aria-hidden', 'true');
        hostElement.insertBefore(fillerElement, popup);
        inputRepositioningFillerRef.current = fillerElement;
      } else if (fillerElement.nextSibling !== popup) {
        hostElement.insertBefore(fillerElement, popup);
      }

      const computedStyle = ownerWindow(popup).getComputedStyle(popup);
      const popupRect = popup.getBoundingClientRect();
      const overlap = keyboardInset > 0 ? Math.min(1, keyboardInset) : 0;
      const fillerHeight = `${Math.round(keyboardInset + overlap)}px`;
      const initialFillerHeight = `${Math.round(overlap)}px`;
      const popupZIndex = Number.parseInt(computedStyle.zIndex, 10);

      Object.assign(fillerElement.style, {
        position: 'fixed',
        pointerEvents: 'none',
        left: `${Math.round(popupRect.left)}px`,
        bottom: '0px',
        width: `${Math.round(popupRect.width)}px`,
        height: fillerHeight,
        background: computedStyle.background,
        boxShadow: 'none',
        transition: animate
          ? composeInputRepositioningTransition(
              'none',
              keyboardInset > 0
                ? INPUT_REPOSITIONING_OPEN_TRANSITION_DURATION
                : INPUT_REPOSITIONING_CLOSE_TRANSITION_DURATION,
              'height',
            )
          : 'none',
        zIndex: Number.isFinite(popupZIndex) ? `${popupZIndex + 1}` : '1',
      });

      if (keyboardInset > 0 && animate && isNewFiller) {
        fillerElement.style.height = initialFillerHeight;
        fillerElement.getBoundingClientRect();
        startInputRepositioningFillerFrame.request(() => {
          if (inputRepositioningFillerRef.current === fillerElement) {
            fillerElement.style.height = fillerHeight;
          }
        });
      } else if (keyboardInset <= 0) {
        startInputRepositioningFillerFrame.cancel();
        if (animate) {
          fillerElement.style.height = '0px';
          removeInputRepositioningFillerTimeout.start(
            INPUT_REPOSITIONING_CLOSE_TRANSITION_DURATION,
            () => {
              if (inputRepositioningFillerRef.current === fillerElement) {
                removeInputRepositioningFiller();
              }
            },
          );
        } else {
          removeInputRepositioningFillerTimeout.clear();
          fillerElement.style.height = '0px';
          startInputRepositioningFillerFrame.request(() => {
            if (inputRepositioningFillerRef.current === fillerElement) {
              removeInputRepositioningFiller();
            }
          });
        }
      } else {
        startInputRepositioningFillerFrame.cancel();
        removeInputRepositioningFillerTimeout.clear();
      }
    },
  );

  const syncInputRepositioning = useStableCallback(() => {
    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      clearPopupInputRepositioning();
      removeInputRepositioningFiller();
      return;
    }

    const win = ownerWindow(popupElement);
    const prefersReducedMotion = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!enabled) {
      if (prefersReducedMotion) {
        clearPopupInputRepositioning(popupElement);
        removeInputRepositioningFiller();
      } else {
        applyPopupStyles(popupElement, null, 0, true);
        const popupStyleSnapshot = popupStyleSnapshotRef.current;
        const animateFiller =
          popupStyleSnapshot?.element === popupElement && popupStyleSnapshot.pinsTop;
        applyInputRepositioningFiller(popupElement, 0, animateFiller);
        clearAfterCloseAnimation(popupElement);
      }
      return;
    }

    const { availableHeight, keyboardInset } = getKeyboardMetrics(
      win,
      popupElement,
      nestedDrawerOpen,
      focusedKeyboardTargetRef.current,
      forceKeyboardCloseRef.current,
    );

    applyPopupStyles(popupElement, availableHeight, keyboardInset, !prefersReducedMotion);

    const popupStyleSnapshot = popupStyleSnapshotRef.current;
    const animateFiller =
      !prefersReducedMotion &&
      popupStyleSnapshot?.element === popupElement &&
      popupStyleSnapshot.pinsTop;
    applyInputRepositioningFiller(popupElement, keyboardInset, animateFiller);

    if (prefersReducedMotion && availableHeight === null && keyboardInset <= 0) {
      clearPopupInputRepositioning(popupElement);
      removeInputRepositioningFiller();
      return;
    }

    if (availableHeight === null && keyboardInset <= 0 && popupStyleSnapshotRef.current) {
      clearAfterCloseAnimation(popupElement);
    } else {
      clearPopupInputRepositioningTimeout.clear();
    }
  });

  const cancelKeyboardFocusAlignment = useStableCallback(() => {
    keyboardFocusAlignmentTimeout.clear();

    if (!keyboardFocusSettleFrameRef.current) {
      return;
    }

    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      return;
    }

    ownerWindow(popupElement).cancelAnimationFrame(keyboardFocusSettleFrameRef.current);
    keyboardFocusSettleFrameRef.current = 0;
  });

  const resetTouchTrackingState = useStableCallback(() => {
    pendingKeyboardFocusMovedRef.current = false;
    keyboardTouchStartRef.current = null;
  });

  const clearFocusedKeyboardTarget = useStableCallback(() => {
    focusedKeyboardTargetRef.current = null;
    forceKeyboardCloseRef.current = false;
    cancelKeyboardFocusAlignment();
  });

  React.useEffect(() => {
    if (!enabled || !mounted || !open) {
      clearPopupInputRepositioning();
      removeInputRepositioningFiller();
      clearFocusedKeyboardTarget();
      return undefined;
    }

    const rootElement = viewportElement ?? popupElementState;
    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      clearPopupInputRepositioning();
      removeInputRepositioningFiller();
      return undefined;
    }

    const doc = ownerDocument(popupElement);
    const win = ownerWindow(popupElement);
    const visualViewport = win.visualViewport;

    syncInputRepositioning();

    if (!visualViewport) {
      return () => {
        clearPopupInputRepositioning(popupElement);
        removeInputRepositioningFiller();
      };
    }

    const alignFocusedKeyboardTarget = () => {
      const target = focusedKeyboardTargetRef.current;
      if (!rootElement || !target || !contains(rootElement, target)) {
        return;
      }

      const scrollTarget = findKeyboardScrollTarget(target, rootElement);
      if (!scrollTarget) {
        return;
      }

      const maxScrollTop = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight);
      if (maxScrollTop <= 0) {
        return;
      }

      const scrollTargetRect = scrollTarget.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const targetOffsetTop = targetRect.top - scrollTargetRect.top + scrollTarget.scrollTop;
      const nextScrollTop = clamp(
        targetOffsetTop - (scrollTarget.clientHeight - targetRect.height) / 2,
        0,
        maxScrollTop,
      );

      scrollTarget.scrollTop = nextScrollTop;
    };

    const scheduleKeyboardFocusAlignment = () => {
      cancelKeyboardFocusAlignment();

      let remainingFrames = INPUT_REPOSITIONING_SCROLL_ALIGNMENT_FRAMES;
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
      keyboardFocusAlignmentTimeout.start(1000, alignFocusedKeyboardTarget);
    };

    const captureFocusedKeyboardTarget = (target: EventTarget | null) => {
      if (!rootElement || !isKeyboardInputTarget(target) || !contains(rootElement, target)) {
        return false;
      }

      const scrollTarget = findKeyboardScrollTarget(target, rootElement);
      if (!scrollTarget) {
        focusedKeyboardTargetRef.current = target;
        return true;
      }

      focusedKeyboardTargetRef.current = target;
      return true;
    };

    const handleFocusIn = (event: FocusEvent) => {
      forceKeyboardCloseRef.current = false;

      const capturedKeyboardTarget = captureFocusedKeyboardTarget(event.target);
      syncInputRepositioning();

      if (
        capturedKeyboardTarget &&
        getVisualViewportKeyboardInset(win, visualViewport) > KEYBOARD_INSET_THRESHOLD
      ) {
        scheduleKeyboardFocusAlignment();
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      if (captureFocusedKeyboardTarget(event.relatedTarget)) {
        forceKeyboardCloseRef.current = false;
        syncInputRepositioning();
        scheduleKeyboardFocusAlignment();
        return;
      }

      focusedKeyboardTargetRef.current = null;
      forceKeyboardCloseRef.current = true;
      cancelKeyboardFocusAlignment();
      syncInputRepositioning();
    };

    const handleViewportUpdate = () => {
      if (forceKeyboardCloseRef.current) {
        if (getVisualViewportKeyboardInset(win, visualViewport) <= KEYBOARD_INSET_THRESHOLD) {
          forceKeyboardCloseRef.current = false;
        }
      }

      syncInputRepositioning();

      if (focusedKeyboardTargetRef.current) {
        scheduleKeyboardFocusAlignment();
      }
    };

    visualViewport.addEventListener('resize', handleViewportUpdate);
    visualViewport.addEventListener('scroll', handleViewportUpdate);
    doc.addEventListener('focusin', handleFocusIn, true);
    doc.addEventListener('focusout', handleFocusOut, true);

    return () => {
      visualViewport.removeEventListener('resize', handleViewportUpdate);
      visualViewport.removeEventListener('scroll', handleViewportUpdate);
      doc.removeEventListener('focusin', handleFocusIn, true);
      doc.removeEventListener('focusout', handleFocusOut, true);
      clearFocusedKeyboardTarget();
      clearPopupInputRepositioning(popupElement);
      removeInputRepositioningFiller();
    };
  }, [
    applyInputRepositioningFiller,
    cancelKeyboardFocusAlignment,
    clearAfterCloseAnimation,
    clearFocusedKeyboardTarget,
    clearPopupInputRepositioning,
    enabled,
    keyboardFocusAlignmentTimeout,
    mounted,
    open,
    popupElementState,
    removeInputRepositioningFiller,
    store.context.popupRef,
    syncInputRepositioning,
    viewportElement,
  ]);

  const onTouchStart = useStableCallback((event: React.TouchEvent<Element>) => {
    if (!enabled || !open || !mounted) {
      resetTouchTrackingState();
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    pendingKeyboardFocusMovedRef.current = false;
    keyboardTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  });

  const onTouchMove = useStableCallback((event: React.TouchEvent<Element>) => {
    const touch = event.touches[0];
    const touchStart = keyboardTouchStartRef.current;

    if (!touch || !touchStart || pendingKeyboardFocusMovedRef.current) {
      return;
    }

    if (
      Math.abs(touch.clientX - touchStart.x) > INPUT_TAP_MOVE_THRESHOLD ||
      Math.abs(touch.clientY - touchStart.y) > INPUT_TAP_MOVE_THRESHOLD
    ) {
      pendingKeyboardFocusMovedRef.current = true;
    }
  });

  const onTouchEnd = useStableCallback((event: React.TouchEvent<Element>) => {
    if (!enabled) {
      resetTouchTrackingState();
      return false;
    }

    const rootElement = viewportElement ?? popupElementState;
    if (!rootElement || pendingKeyboardFocusMovedRef.current) {
      resetTouchTrackingState();
      return false;
    }

    const touch = event.changedTouches[0] ?? event.touches[0];
    const doc = ownerDocument(event.currentTarget);
    const elementAtPoint = touch ? getElementAtPoint(doc, touch.clientX, touch.clientY) : null;
    const nativeEventTarget = getTarget(event.nativeEvent);
    const fallbackTouchTarget = isHTMLElement(nativeEventTarget) ? nativeEventTarget : null;
    const touchTarget = isHTMLElement(elementAtPoint) ? elementAtPoint : fallbackTouchTarget;
    const keyboardFocusTarget =
      touch &&
      (resolveKeyboardInputTargetFromPoint(doc, touch.clientX, touch.clientY) ??
        (touchTarget ? resolveKeyboardInputTarget(touchTarget) : null));

    if (keyboardFocusTarget && !contains(rootElement, keyboardFocusTarget)) {
      resetTouchTrackingState();
      return false;
    }

    if (keyboardFocusTarget) {
      if (activeElement(ownerDocument(keyboardFocusTarget)) === keyboardFocusTarget) {
        resetTouchTrackingState();
        return false;
      }

      event.preventDefault();
      const popupElement = store.context.popupRef.current;
      if (popupElement) {
        capturePopupStyleSnapshot(popupElement);
      }
      const scrollTarget = findKeyboardScrollTarget(keyboardFocusTarget, rootElement);
      if (scrollTarget) {
        focusedKeyboardTargetRef.current = keyboardFocusTarget;
        forceKeyboardCloseRef.current = false;
      } else {
        focusedKeyboardTargetRef.current = keyboardFocusTarget;
        forceKeyboardCloseRef.current = false;
      }
      focusKeyboardInputWithoutPageScroll(keyboardFocusTarget);
      resetTouchTrackingState();
      return true;
    }

    resetTouchTrackingState();
    return false;
  });

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: resetTouchTrackingState,
  };
}

function isKeyboardInputElement(element: HTMLElement): boolean {
  const win = ownerWindow(element);

  if (element instanceof win.HTMLTextAreaElement || element.isContentEditable) {
    return true;
  }

  return element instanceof win.HTMLInputElement && !NON_TEXT_INPUT_TYPE.test(element.type);
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

function resolveKeyboardInputTargetFromPoint(
  doc: Document,
  clientX: number,
  clientY: number,
): HTMLElement | null {
  for (const [offsetX, offsetY] of [
    [0, 0],
    [0, INPUT_TAP_HIT_SLOP],
    [0, -INPUT_TAP_HIT_SLOP],
    [INPUT_TAP_HIT_SLOP, 0],
    [-INPUT_TAP_HIT_SLOP, 0],
  ]) {
    const keyboardTarget = resolveKeyboardInputTarget(
      getElementAtPoint(doc, clientX + offsetX, clientY + offsetY),
    );

    if (keyboardTarget) {
      return keyboardTarget;
    }
  }

  return null;
}

function findKeyboardScrollTarget(target: HTMLElement, root: HTMLElement): HTMLElement | null {
  let node: Node | null = getParentNode(target);

  while (node && !isHTMLElement(node)) {
    node = getParentNode(node);
  }

  return (
    findScrollableTouchTarget(node, root, 'vertical') ??
    (isScrollable(root, 'vertical') ? root : null)
  );
}

function focusKeyboardInputWithoutPageScroll(target: HTMLElement) {
  const previousTransform = target.style.transform;
  const previousTransition = target.style.transition;

  target.style.transform = 'translateY(-2000px)';
  target.style.transition = 'none';
  try {
    target.focus({ preventScroll: true });
  } finally {
    target.style.transform = previousTransform;
    target.style.transition = previousTransition;
  }
}

function getKeyboardMetrics(
  win: Window,
  popupElement: HTMLElement,
  nestedDrawerOpen: boolean,
  focusedKeyboardTarget: HTMLElement | null,
  forceKeyboardClose: boolean,
): { availableHeight: number | null; keyboardInset: number } {
  const visualViewport = win.visualViewport;
  const focusedElement =
    focusedKeyboardTarget && contains(popupElement, focusedKeyboardTarget)
      ? focusedKeyboardTarget
      : activeElement(ownerDocument(popupElement));

  if (
    forceKeyboardClose ||
    nestedDrawerOpen ||
    !isKeyboardInputTarget(focusedElement) ||
    !contains(popupElement, focusedElement) ||
    !visualViewport ||
    visualViewport.scale !== 1
  ) {
    return { availableHeight: null, keyboardInset: 0 };
  }

  const keyboardInset = getVisualViewportKeyboardInset(win, visualViewport);
  if (keyboardInset <= KEYBOARD_INSET_THRESHOLD) {
    return { availableHeight: null, keyboardInset: 0 };
  }

  return {
    availableHeight: Math.round(visualViewport.height),
    keyboardInset: Math.round(keyboardInset),
  };
}

function getVisualViewportKeyboardInset(win: Window, visualViewport: VisualViewport): number {
  return Math.max(0, win.innerHeight - visualViewport.height - visualViewport.offsetTop);
}

function getPopupViewportSpacing(
  win: Window,
  popupElement: HTMLElement,
  ignoreTopGap: boolean = false,
) {
  const visualViewport = win.visualViewport;
  const rect = popupElement.getBoundingClientRect();
  const computedStyle = win.getComputedStyle(popupElement);

  const viewportTop = visualViewport?.offsetTop ?? 0;
  const topGap = ignoreTopGap ? INPUT_REPOSITIONING_TOP_GAP : Math.max(0, rect.top - viewportTop);
  const bleed = Math.max(0, -getComputedPixelValue(computedStyle.marginBottom));

  return { topGap, bleed };
}

function resolveInitialPopupMaxHeight(
  win: Window,
  popupElement: HTMLElement,
  computedStyle: CSSStyleDeclaration,
  spacing: { topGap: number; bleed: number },
  availableHeight: number | null,
  keyboardInset: number,
  restoredBottom: number,
): string {
  const computedMaxHeight = getOptionalComputedPixelValue(computedStyle.maxHeight);
  const reducedMaxHeight =
    availableHeight !== null ? Math.max(0, availableHeight - spacing.topGap + spacing.bleed) : null;
  const restoredViewportMaxHeight =
    reducedMaxHeight !== null
      ? Math.max(0, reducedMaxHeight + keyboardInset - restoredBottom)
      : null;

  if (restoredViewportMaxHeight !== null) {
    const resolvedReducedMaxHeight = reducedMaxHeight ?? 0;

    if (computedMaxHeight !== null && Math.abs(computedMaxHeight - resolvedReducedMaxHeight) <= 1) {
      return `${Math.round(restoredViewportMaxHeight)}px`;
    }

    const popupHeight = popupElement.getBoundingClientRect().height;
    if (popupHeight > 0 && Math.abs(popupHeight - resolvedReducedMaxHeight) <= 1) {
      return `${Math.round(restoredViewportMaxHeight)}px`;
    }
  }

  if (computedMaxHeight !== null) {
    return `${Math.round(computedMaxHeight)}px`;
  }

  const popupHeight = popupElement.getBoundingClientRect().height;
  if (popupHeight > 0) {
    return `${Math.round(popupHeight)}px`;
  }

  return `${Math.round(
    Math.max(0, win.innerHeight - spacing.topGap + spacing.bleed - restoredBottom),
  )}px`;
}

function shouldPinPopupToTop(
  win: Window,
  computedStyle: CSSStyleDeclaration,
  spacing: { topGap: number; bleed: number },
  restoredBottom: number,
): boolean {
  const computedMaxHeight = getOptionalComputedPixelValue(computedStyle.maxHeight);
  if (computedMaxHeight === null) {
    return false;
  }

  const fullViewportMaxHeight = Math.max(
    0,
    win.innerHeight - spacing.topGap + spacing.bleed - restoredBottom,
  );
  return computedMaxHeight >= fullViewportMaxHeight - 1;
}

function composeInputRepositioningTransition(
  baseTransition: string,
  duration: number,
  ...properties: string[]
): string {
  const inputRepositioningTransitions = properties.map(
    (property) => `${property} ${duration}ms ${INPUT_REPOSITIONING_TRANSITION_EASING}`,
  );

  if (
    baseTransition === '' ||
    baseTransition === 'none' ||
    baseTransition === 'all' ||
    baseTransition === 'all 0s ease 0s'
  ) {
    return inputRepositioningTransitions.join(', ');
  }

  return `${baseTransition}, ${inputRepositioningTransitions.join(', ')}`;
}

function normalizeTranslateValue(value: string): string {
  if (value === '' || value === 'none') {
    return '0px 0px';
  }

  return value;
}

function normalizeTransformValue(value: string): string {
  if (value === '' || value === 'none') {
    return 'translateY(0px)';
  }

  return value;
}

function getOptionalComputedPixelValue(value: string): number | null {
  if (value === '' || value === 'none') {
    return null;
  }

  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function getComputedPixelValue(value: string): number {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}
