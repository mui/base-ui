'use client';
import * as React from 'react';
import { isElement, isHTMLElement } from '@floating-ui/utils/dom';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { clamp } from '../../utils/clamp';
import { activeElement, contains, getTarget } from '../../floating-ui-react/utils';
import { isTypeableElement } from '../../floating-ui-react/utils/element';
import { findScrollableTouchTarget } from '../../utils/scrollable';
import { getElementAtPoint } from '../../utils/getElementAtPoint';
import {
  DrawerVirtualKeyboardContext,
  type DrawerVirtualKeyboardContext as DrawerVirtualKeyboardContextValue,
} from './DrawerVirtualKeyboardContext';

const KEYBOARD_INSET_THRESHOLD = 60;
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

/**
 * Enables visible viewport sizing and keyboard-aware focus behavior for software keyboards.
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

  const [availableHeight, setAvailableHeight] = React.useState<number | null>(null);
  const [keyboardInset, setKeyboardInset] = React.useState(0);

  const pendingKeyboardFocusTargetRef = React.useRef<HTMLElement | null>(null);
  const pendingKeyboardFocusMovedRef = React.useRef(false);
  const keyboardTouchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const focusedKeyboardTargetRef = React.useRef<HTMLElement | null>(null);
  const focusedKeyboardScrollTargetRef = React.useRef<HTMLElement | null>(null);
  const keepKeyboardScrollBottomAnchoredRef = React.useRef(false);
  const keyboardFocusSettleFrameRef = React.useRef(0);

  const syncVirtualKeyboardMetrics = useStableCallback(() => {
    const popupElement = store.context.popupRef.current;
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

  const resetTouchTrackingState = useStableCallback(() => {
    pendingKeyboardFocusTargetRef.current = null;
    pendingKeyboardFocusMovedRef.current = false;
    keyboardTouchStartRef.current = null;
  });

  React.useEffect(() => {
    if (!mounted || !open) {
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
    popupElementState,
    store.context.popupRef,
    syncVirtualKeyboardMetrics,
  ]);

  React.useEffect(() => {
    if (!open || !mounted) {
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

    const rootElement = viewportElement ?? popupElementState;
    if (!rootElement) {
      resetTouchTrackingState();
      return;
    }

    const doc = ownerDocument(event.currentTarget);
    const elementAtPoint = getElementAtPoint(doc, touch.clientX, touch.clientY);
    const eventTarget = getTarget(event.nativeEvent);
    const fallbackTarget = isElement(eventTarget) ? eventTarget : null;
    const target = isElement(elementAtPoint) ? elementAtPoint : fallbackTarget;
    if (target && !contains(rootElement, target)) {
      resetTouchTrackingState();
      return;
    }

    const pendingKeyboardFocusTarget =
      resolveKeyboardInputTargetFromPoint(rootElement, doc, touch.clientX, touch.clientY) ??
      resolveKeyboardInputTarget(target);

    pendingKeyboardFocusTargetRef.current =
      pendingKeyboardFocusTarget && contains(rootElement, pendingKeyboardFocusTarget)
        ? pendingKeyboardFocusTarget
        : null;
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
    const resolvedTouchKeyboardTarget = touch
      ? (resolveKeyboardInputTargetFromPoint(rootElement, doc, touch.clientX, touch.clientY) ??
        (touchTarget ? resolveKeyboardInputTarget(touchTarget) : null))
      : null;

    const pendingKeyboardFocusTarget = pendingKeyboardFocusTargetRef.current;
    let keyboardFocusTarget: HTMLElement | null = null;

    if (pendingKeyboardFocusTarget && contains(rootElement, pendingKeyboardFocusTarget)) {
      keyboardFocusTarget = pendingKeyboardFocusTarget;
    } else if (resolvedTouchKeyboardTarget && contains(rootElement, resolvedTouchKeyboardTarget)) {
      keyboardFocusTarget = resolvedTouchKeyboardTarget;
    }

    if (
      keyboardFocusTarget &&
      ((touchTarget &&
        (touchTarget === keyboardFocusTarget || contains(keyboardFocusTarget, touchTarget))) ||
        resolvedTouchKeyboardTarget === keyboardFocusTarget)
    ) {
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
      availableHeight,
      keyboardInset,
      onTouchStart,
      onTouchEnd,
      onTouchCancel,
    }),
    [availableHeight, keyboardInset, onTouchCancel, onTouchEnd, onTouchStart],
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

function isElementScrolledToBottom(element: HTMLElement): boolean {
  return element.scrollTop + element.clientHeight >= element.scrollHeight - 2;
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

  const nextKeyboardInset = Math.max(0, Math.round(win.innerHeight - visualViewport.height));

  return nextKeyboardInset > KEYBOARD_INSET_THRESHOLD ? nextKeyboardInset : 0;
}
