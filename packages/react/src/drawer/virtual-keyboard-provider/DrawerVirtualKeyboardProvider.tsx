'use client';
import * as React from 'react';
import { getComputedStyle, isHTMLElement } from '@floating-ui/utils/dom';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { clamp } from '../../internals/clamp';
import { activeElement, contains, getTarget } from '../../floating-ui-react/utils';
import { findScrollableTouchTarget } from '../../utils/scrollable';
import { getElementAtPoint } from '../../utils/getElementAtPoint';
import {
  DrawerVirtualKeyboardContext,
  type DrawerVirtualKeyboardContext as DrawerVirtualKeyboardContextValue,
} from './DrawerVirtualKeyboardContext';

const KEYBOARD_RESIZE_THRESHOLD = 60;
const KEYBOARD_VISIBILITY_MARGIN = 16;
const KEYBOARD_SCROLL_SLACK = 48;
const KEYBOARD_SCROLL_DURATION = 180;
const INPUT_TAP_MOVE_THRESHOLD = 10;
const INPUT_TAP_HIT_SLOP = 16;
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

interface ScrollAdjustment {
  element: HTMLElement;
  overflowAnchor: string;
  paddingBottom: string;
  scrollPaddingBottom: string;
  computedPaddingBottom: number;
  computedScrollPaddingBottom: number;
}

/**
 * Enables keyboard-aware focus and scroll handling for software keyboards.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export function DrawerVirtualKeyboardProvider(props: DrawerVirtualKeyboardProvider.Props) {
  const { children } = props;

  const { store } = useDialogRootContext();

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const viewportElement = store.useState('viewportElement');
  const popupElementState = store.useState('popupElement');

  const nestedDrawerOpen = nestedOpenDialogCount > 0;

  const pendingKeyboardFocusMovedRef = React.useRef(false);
  const keyboardTouchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const focusedKeyboardTargetRef = React.useRef<HTMLElement | null>(null);
  const keyboardScrollAdjustmentRef = React.useRef<ScrollAdjustment | null>(null);
  const keyboardFocusFrame = useAnimationFrame();
  const keyboardScrollFrame = useAnimationFrame();

  const restoreKeyboardScrollAdjustment = useStableCallback(() => {
    const adjustment = keyboardScrollAdjustmentRef.current;
    if (!adjustment) {
      return;
    }
    adjustment.element.style.overflowAnchor = adjustment.overflowAnchor;
    adjustment.element.style.paddingBottom = adjustment.paddingBottom;
    adjustment.element.style.scrollPaddingBottom = adjustment.scrollPaddingBottom;
    keyboardScrollAdjustmentRef.current = null;
  });

  const setKeyboardScrollSlack = useStableCallback((element: HTMLElement, slack: number) => {
    const roundedSlack = Math.max(0, Math.ceil(slack));
    let adjustment = keyboardScrollAdjustmentRef.current;

    if (roundedSlack === 0) {
      restoreKeyboardScrollAdjustment();
      return;
    }

    if (adjustment && adjustment.element !== element) {
      restoreKeyboardScrollAdjustment();
      adjustment = null;
    }

    if (!adjustment) {
      const styles = getComputedStyle(element);
      adjustment = {
        element,
        overflowAnchor: element.style.overflowAnchor,
        paddingBottom: element.style.paddingBottom,
        scrollPaddingBottom: element.style.scrollPaddingBottom,
        computedPaddingBottom: Number.parseFloat(styles.paddingBottom) || 0,
        computedScrollPaddingBottom: Number.parseFloat(styles.scrollPaddingBottom) || 0,
      };
      keyboardScrollAdjustmentRef.current = adjustment;
    }

    element.style.overflowAnchor = 'none';
    element.style.paddingBottom = `${adjustment.computedPaddingBottom + roundedSlack}px`;
    element.style.scrollPaddingBottom = `${
      adjustment.computedScrollPaddingBottom + KEYBOARD_VISIBILITY_MARGIN
    }px`;
  });

  const cancelKeyboardFocusAlignment = useStableCallback(() => {
    keyboardFocusFrame.cancel();
  });

  const cancelKeyboardScrollAnimation = useStableCallback(() => {
    keyboardScrollFrame.cancel();
  });

  const animateKeyboardScroll = useStableCallback((element: HTMLElement, scrollTop: number) => {
    const startScrollTop = element.scrollTop;
    const distance = scrollTop - startScrollTop;
    const win = ownerWindow(element);

    cancelKeyboardScrollAnimation();

    if (Math.abs(distance) <= 1 || win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      element.scrollTop = scrollTop;
      return;
    }

    const startTime = win.performance.now();

    const step = () => {
      const elapsed = win.performance.now() - startTime;
      const progress = clamp(elapsed / KEYBOARD_SCROLL_DURATION, 0, 1);
      const easedProgress = 1 - (1 - progress) ** 3;

      element.scrollTop = startScrollTop + distance * easedProgress;

      if (progress < 1) {
        keyboardScrollFrame.request(step);
      } else {
        element.scrollTop = scrollTop;
      }
    };

    keyboardScrollFrame.request(step);
  });

  const resetTouchTrackingState = useStableCallback(() => {
    pendingKeyboardFocusMovedRef.current = false;
    keyboardTouchStartRef.current = null;
  });

  React.useEffect(() => {
    if (!mounted || !open) {
      focusedKeyboardTargetRef.current = null;
      restoreKeyboardScrollAdjustment();
      cancelKeyboardFocusAlignment();
      cancelKeyboardScrollAnimation();
      return undefined;
    }

    const rootElement = viewportElement ?? popupElementState;
    const popupElement = store.context.popupRef.current;
    if (!rootElement || !popupElement) {
      restoreKeyboardScrollAdjustment();
      return undefined;
    }

    const doc = ownerDocument(popupElement);
    const win = ownerWindow(popupElement);
    const visualViewport = win.visualViewport;

    const clearFocusedKeyboardTarget = () => {
      focusedKeyboardTargetRef.current = null;
      restoreKeyboardScrollAdjustment();
      cancelKeyboardFocusAlignment();
      cancelKeyboardScrollAnimation();
    };

    const alignFocusedKeyboardTarget = () => {
      const target = focusedKeyboardTargetRef.current;
      if (nestedDrawerOpen || !target || !contains(rootElement, target)) {
        restoreKeyboardScrollAdjustment();
        return;
      }

      const keyboardViewport = getKeyboardVisualViewport(win);
      if (!keyboardViewport) {
        restoreKeyboardScrollAdjustment();
        return;
      }

      const scrollTarget = findKeyboardScrollTarget(target, rootElement);
      if (!scrollTarget) {
        restoreKeyboardScrollAdjustment();
        return;
      }

      const scrollTargetRect = scrollTarget.getBoundingClientRect();
      const clippedBottom = Math.min(scrollTargetRect.bottom, keyboardViewport.bottom);
      const overlap = Math.max(0, scrollTargetRect.bottom - keyboardViewport.bottom);
      setKeyboardScrollSlack(scrollTarget, overlap > 0 ? overlap + KEYBOARD_SCROLL_SLACK : 0);

      const maxScrollTop = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight);
      if (maxScrollTop <= 0) {
        return;
      }

      const clippedTop = Math.max(scrollTargetRect.top, keyboardViewport.top);
      const visibleTop = clippedTop + KEYBOARD_VISIBILITY_MARGIN;
      const visibleBottom = clippedBottom - KEYBOARD_VISIBILITY_MARGIN;
      if (visibleBottom <= visibleTop) {
        return;
      }

      const targetRect = target.getBoundingClientRect();
      let nextScrollTop = scrollTarget.scrollTop;

      if (targetRect.bottom > visibleBottom) {
        nextScrollTop += targetRect.bottom - visibleBottom;
      } else if (targetRect.top < visibleTop) {
        nextScrollTop -= visibleTop - targetRect.top;
      }

      animateKeyboardScroll(scrollTarget, clamp(nextScrollTop, 0, maxScrollTop));
    };

    const scheduleKeyboardFocusAlignment = () => {
      keyboardFocusFrame.request(alignFocusedKeyboardTarget);
    };

    const captureFocusedKeyboardTarget = (target: EventTarget | null) => {
      if (nestedDrawerOpen || !isKeyboardInputTarget(target) || !contains(rootElement, target)) {
        return false;
      }

      const scrollTarget = findKeyboardScrollTarget(target, rootElement);
      if (!scrollTarget) {
        restoreKeyboardScrollAdjustment();
        return false;
      }

      focusedKeyboardTargetRef.current = target;
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
      if (focusedKeyboardTargetRef.current || captureFocusedKeyboardTarget(activeElement(doc))) {
        scheduleKeyboardFocusAlignment();
      }
    };

    visualViewport?.addEventListener('resize', handleViewportUpdate);
    visualViewport?.addEventListener('scroll', handleViewportUpdate);
    doc.addEventListener('focusin', handleFocusIn, true);
    doc.addEventListener('focusout', handleFocusOut, true);

    if (captureFocusedKeyboardTarget(activeElement(doc))) {
      scheduleKeyboardFocusAlignment();
    }

    return () => {
      visualViewport?.removeEventListener('resize', handleViewportUpdate);
      visualViewport?.removeEventListener('scroll', handleViewportUpdate);
      doc.removeEventListener('focusin', handleFocusIn, true);
      doc.removeEventListener('focusout', handleFocusOut, true);
      clearFocusedKeyboardTarget();
    };
  }, [
    cancelKeyboardFocusAlignment,
    cancelKeyboardScrollAnimation,
    animateKeyboardScroll,
    keyboardFocusFrame,
    keyboardScrollFrame,
    mounted,
    nestedDrawerOpen,
    open,
    popupElementState,
    restoreKeyboardScrollAdjustment,
    setKeyboardScrollSlack,
    store.context.popupRef,
    viewportElement,
  ]);

  React.useEffect(() => {
    const rootElement = viewportElement ?? popupElementState;
    if (!rootElement || !open || !mounted) {
      return undefined;
    }

    const doc = ownerDocument(rootElement);

    const handleNativeTouchMove = (event: TouchEvent) => {
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
    };

    doc.addEventListener('touchmove', handleNativeTouchMove, { passive: true, capture: true });

    return () => {
      doc.removeEventListener('touchmove', handleNativeTouchMove, { capture: true });
    };
  }, [mounted, open, popupElementState, viewportElement]);

  const onTouchStart = useStableCallback((event: React.TouchEvent<Element>) => {
    if (!open || !mounted) {
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

  const onTouchEnd = useStableCallback((event: React.TouchEvent<Element>) => {
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
      focusKeyboardInputWithoutPageScroll(keyboardFocusTarget);
      resetTouchTrackingState();
      return true;
    }

    resetTouchTrackingState();
    return false;
  });

  const onTouchCancel = useStableCallback(() => {
    resetTouchTrackingState();
  });

  const contextValue = React.useMemo<DrawerVirtualKeyboardContextValue>(
    () => ({
      onTouchStart,
      onTouchEnd,
      onTouchCancel,
    }),
    [onTouchCancel, onTouchEnd, onTouchStart],
  );

  return (
    <DrawerVirtualKeyboardContext.Provider value={contextValue}>
      {children}
    </DrawerVirtualKeyboardContext.Provider>
  );
}

export interface DrawerVirtualKeyboardProviderState {}

export interface DrawerVirtualKeyboardProviderProps {
  children?: React.ReactNode;
}

export namespace DrawerVirtualKeyboardProvider {
  export type State = DrawerVirtualKeyboardProviderState;
  export type Props = DrawerVirtualKeyboardProviderProps;
}

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

function focusKeyboardInputWithoutPageScroll(target: HTMLElement) {
  const previousOpacity = target.style.opacity;
  const previousTransform = target.style.transform;
  const previousTransition = target.style.transition;

  target.style.transition = 'none';
  target.style.opacity = '0';
  target.style.transform = 'translateY(-2000px)';
  try {
    target.focus({ preventScroll: true });
  } finally {
    target.style.opacity = previousOpacity;
    target.style.transform = previousTransform;
    target.style.transition = previousTransition;
  }
}

function findKeyboardScrollTarget(target: HTMLElement, root: HTMLElement): HTMLElement | null {
  return (
    findScrollableTouchTarget(target, root, 'vertical') ?? findPotentialScrollAncestor(target, root)
  );
}

function findPotentialScrollAncestor(target: HTMLElement, root: HTMLElement): HTMLElement | null {
  let element: HTMLElement | null = target.parentElement;
  while (element) {
    if (isPotentialKeyboardScrollContainer(element)) {
      return element;
    }

    if (element === root) {
      break;
    }

    element = element.parentElement;
  }

  return null;
}

function isPotentialKeyboardScrollContainer(element: HTMLElement): boolean {
  const styles = getComputedStyle(element);
  return (styles.overflowY === 'auto' || styles.overflowY === 'scroll') && element.clientHeight > 0;
}

function getKeyboardVisualViewport(win: Window): { top: number; bottom: number } | null {
  const visualViewport = win.visualViewport;

  if (!visualViewport || visualViewport.scale !== 1) {
    return null;
  }

  const reducedHeight = win.innerHeight - visualViewport.height;
  if (reducedHeight <= KEYBOARD_RESIZE_THRESHOLD) {
    return null;
  }

  const top = Math.max(0, visualViewport.offsetTop);
  return {
    top,
    bottom: Math.min(win.innerHeight, top + visualViewport.height),
  };
}
