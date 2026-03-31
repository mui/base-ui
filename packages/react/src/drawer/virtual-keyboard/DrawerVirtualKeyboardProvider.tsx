'use client';
import * as React from 'react';
import { isElement, isHTMLElement } from '@floating-ui/utils/dom';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { clamp } from '../../utils/clamp';
import { activeElement, contains, getTarget } from '../../floating-ui-react/utils';
import { isTypeableElement } from '../../floating-ui-react/utils/element';
import { findScrollableTouchTarget } from '../../utils/scrollable';
import { getElementAtPoint } from '../../utils/getElementAtPoint';

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

interface DrawerVirtualKeyboardContextValue {
  availableHeight: number | null;
  keyboardInset: number;
  onTouchStart: (event: React.TouchEvent<Element>) => void;
  onTouchEnd: (event: React.TouchEvent<Element>) => boolean;
  onTouchCancel: () => void;
}

const DrawerVirtualKeyboardContext = React.createContext<
  DrawerVirtualKeyboardContextValue | undefined
>(undefined);

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

  const [{ availableHeight, keyboardInset }, setMetrics] = React.useState({
    availableHeight: null as number | null,
    keyboardInset: 0,
  });

  const pendingKeyboardFocusTargetRef = React.useRef<HTMLElement | null>(null);
  const pendingKeyboardFocusMovedRef = React.useRef(false);
  const keyboardTouchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const focusedKeyboardTargetRef = React.useRef<HTMLElement | null>(null);
  const focusedKeyboardScrollTargetRef = React.useRef<HTMLElement | null>(null);
  const keepKeyboardScrollBottomAnchoredRef = React.useRef(false);
  const keyboardFocusSettleFrameRef = React.useRef(0);

  const syncVirtualKeyboardMetrics = React.useCallback(() => {
    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      setMetrics((prevMetrics) =>
        prevMetrics.availableHeight === null && prevMetrics.keyboardInset === 0
          ? prevMetrics
          : { availableHeight: null, keyboardInset: 0 },
      );
      return;
    }

    const { availableHeight: nextAvailableHeight, keyboardInset: nextKeyboardInset } =
      getKeyboardMetrics(ownerWindow(popupElement), popupElement, nestedDrawerOpen);

    setMetrics((prevMetrics) =>
      prevMetrics.availableHeight === nextAvailableHeight &&
      prevMetrics.keyboardInset === nextKeyboardInset
        ? prevMetrics
        : { availableHeight: nextAvailableHeight, keyboardInset: nextKeyboardInset },
    );
  }, [nestedDrawerOpen, store.context.popupRef]);

  const cancelKeyboardFocusAlignment = React.useCallback(() => {
    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      return;
    }

    const win = ownerWindow(popupElement);
    if (keyboardFocusSettleFrameRef.current) {
      win.cancelAnimationFrame(keyboardFocusSettleFrameRef.current);
      keyboardFocusSettleFrameRef.current = 0;
    }
  }, [store.context.popupRef]);

  const resetTouchTrackingState = React.useCallback(() => {
    pendingKeyboardFocusTargetRef.current = null;
    pendingKeyboardFocusMovedRef.current = false;
    keyboardTouchStartRef.current = null;
  }, []);

  React.useEffect(() => {
    if (!mounted || !open) {
      setMetrics({ availableHeight: null, keyboardInset: 0 });
      focusedKeyboardTargetRef.current = null;
      focusedKeyboardScrollTargetRef.current = null;
      keepKeyboardScrollBottomAnchoredRef.current = false;
      cancelKeyboardFocusAlignment();
      return undefined;
    }

    const rootElement = viewportElement ?? popupElementState;
    const popupElement = store.context.popupRef.current;
    if (!popupElement) {
      setMetrics({ availableHeight: null, keyboardInset: 0 });
      return undefined;
    }

    const doc = ownerDocument(popupElement);
    const win = ownerWindow(popupElement);
    const visualViewport = win.visualViewport;

    syncVirtualKeyboardMetrics();

    if (!visualViewport) {
      return () => {
        setMetrics({ availableHeight: null, keyboardInset: 0 });
      };
    }

    const clearFocusedKeyboardTarget = () => {
      focusedKeyboardTargetRef.current = null;
      focusedKeyboardScrollTargetRef.current = null;
      keepKeyboardScrollBottomAnchoredRef.current = false;
      cancelKeyboardFocusAlignment();
    };

    const alignFocusedKeyboardTarget = () => {
      const target = focusedKeyboardTargetRef.current;
      const scrollTarget = focusedKeyboardScrollTargetRef.current;
      if (!rootElement || !target || !scrollTarget) {
        return;
      }

      if (!contains(rootElement, target) || !contains(rootElement, scrollTarget)) {
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

      scrollTarget.scrollTop = clamp(
        targetOffsetTop - (scrollTarget.clientHeight - targetRect.height) / 2,
        0,
        maxScrollTop,
      );
    };

    const scheduleKeyboardFocusAlignment = () => {
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
    };

    const captureFocusedKeyboardTarget = (target: EventTarget | null) => {
      if (!rootElement || !isKeyboardInputTarget(target) || !contains(rootElement, target)) {
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

    const handleFocusChange = () => {
      syncVirtualKeyboardMetrics();
    };

    const handleFocusIn = (event: FocusEvent) => {
      handleFocusChange();

      if (captureFocusedKeyboardTarget(event.target)) {
        scheduleKeyboardFocusAlignment();
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      handleFocusChange();

      if (captureFocusedKeyboardTarget(event.relatedTarget)) {
        scheduleKeyboardFocusAlignment();
        return;
      }

      clearFocusedKeyboardTarget();
    };

    const handleViewportUpdate = () => {
      syncVirtualKeyboardMetrics();

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
      setMetrics({ availableHeight: null, keyboardInset: 0 });
      clearFocusedKeyboardTarget();
    };
  }, [
    cancelKeyboardFocusAlignment,
    mounted,
    nestedDrawerOpen,
    open,
    popupElementState,
    store.context.popupRef,
    syncVirtualKeyboardMetrics,
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

  const onTouchStart = React.useCallback((event: React.TouchEvent<Element>) => {
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
  }, [mounted, open, popupElementState, resetTouchTrackingState, viewportElement]);

  const onTouchEnd = React.useCallback((event: React.TouchEvent<Element>) => {
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
  }, [popupElementState, resetTouchTrackingState, viewportElement]);

  const onTouchCancel = React.useCallback(() => {
    resetTouchTrackingState();
  }, [resetTouchTrackingState]);

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

export function useDrawerVirtualKeyboardContext(optional = false) {
  const drawerVirtualKeyboardContext = React.useContext(DrawerVirtualKeyboardContext);

  if (!optional && drawerVirtualKeyboardContext === undefined) {
    throw new Error(
      'Base UI: DrawerVirtualKeyboardContext is missing. The virtual keyboard provider must wrap the drawer parts that use it.',
    );
  }

  return drawerVirtualKeyboardContext;
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

    const distance =
      Math.max(rect.left - clientX, 0, clientX - rect.right) ** 2 +
      Math.max(rect.top - clientY, 0, clientY - rect.bottom) ** 2;

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

function getKeyboardMetrics(
  win: Window,
  popupElement: HTMLElement,
  nestedDrawerOpen: boolean,
): { availableHeight: number | null; keyboardInset: number } {
  const visualViewport = win.visualViewport;
  const focusedElement = ownerDocument(popupElement).activeElement;

  if (
    nestedDrawerOpen ||
    !isTypeableElement(focusedElement) ||
    !contains(popupElement, focusedElement) ||
    !visualViewport
  ) {
    return { availableHeight: null, keyboardInset: 0 };
  }

  const reducedHeight = win.innerHeight - visualViewport.height;
  if (reducedHeight <= KEYBOARD_INSET_THRESHOLD) {
    return { availableHeight: null, keyboardInset: 0 };
  }

  return {
    availableHeight: Math.round(visualViewport.height),
    keyboardInset: isKeyboardInputTarget(focusedElement) ? Math.round(reducedHeight) : 0,
  };
}
