'use client';
import * as React from 'react';
import { getComputedStyle, isHTMLElement } from '@floating-ui/utils/dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { clamp } from '../../internals/clamp';
import {
  activeElement,
  contains,
  getTarget,
  isInteractiveElement,
} from '../../floating-ui-react/utils';
import { findScrollableTouchTarget } from '../../utils/scrollable';
import { getElementAtPoint } from '../../utils/getElementAtPoint';
import { DrawerViewportCssVars } from '../viewport/DrawerViewportCssVars';
import {
  DrawerVirtualKeyboardContext,
  type DrawerVirtualKeyboardContext as DrawerVirtualKeyboardContextValue,
} from './DrawerVirtualKeyboardContext';

const KEYBOARD_RESIZE_THRESHOLD = 60;
const KEYBOARD_VISIBILITY_MARGIN = 16;
// Extra breathing room (px) added below the focused field, on top of its measured
// keyboard overlap, so the field can be scrolled clear of the keyboard instead of
// ending up flush against it. Only applied when there is actual overlap.
const KEYBOARD_SCROLL_SLACK = 48;
const INPUT_TAP_MOVE_THRESHOLD = 10;
const INPUT_TAP_HIT_SLOP = 16;
const KEYBOARD_INPUT_TYPES = new Set([
  'email',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'url',
]);

// Snapshot of a scroll container's relevant styles taken before keyboard slack is
// applied. The string fields are the exact inline values to restore on cleanup;
// the parsed numbers are the computed baselines that slack is added on top of.
interface ScrollAdjustment {
  readonly element: HTMLElement;
  readonly overflowAnchor: string;
  readonly paddingBottom: string;
  readonly scrollPaddingBottom: string;
  readonly computedPaddingBottom: number;
  readonly computedScrollPaddingBottom: number;
}

interface KeyboardVisualViewport {
  readonly top: number;
  readonly bottom: number;
}

/**
 * Provides keyboard-aware focus and scroll handling for bottom-sheet drawers with form fields.
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

  const rootElement = viewportElement ?? popupElementState;
  const nestedDrawerOpen = nestedOpenDialogCount > 0;

  const pendingKeyboardFocusMovedRef = React.useRef(false);
  const keyboardTouchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const focusedKeyboardTargetRef = React.useRef<HTMLElement | null>(null);
  const keyboardScrollAdjustmentRef = React.useRef<ScrollAdjustment | null>(null);
  const keyboardFocusFrame = useAnimationFrame();

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

    if (adjustment && !adjustment.element.isConnected) {
      restoreKeyboardScrollAdjustment();
      adjustment = null;
    }

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

  const animateKeyboardScroll = useStableCallback((element: HTMLElement, scrollTop: number) => {
    const win = ownerWindow(element);
    const behavior: ScrollBehavior = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';

    element.scrollTo({ top: scrollTop, behavior });
  });

  const resetTouchTrackingState = useStableCallback(() => {
    pendingKeyboardFocusMovedRef.current = false;
    keyboardTouchStartRef.current = null;
  });

  React.useEffect(() => {
    if (!mounted || !open) {
      focusedKeyboardTargetRef.current = null;
      restoreKeyboardScrollAdjustment();
      keyboardFocusFrame.cancel();
      return undefined;
    }

    if (!rootElement) {
      restoreKeyboardScrollAdjustment();
      return undefined;
    }

    const doc = ownerDocument(rootElement);
    const win = ownerWindow(rootElement);
    const visualViewport = win.visualViewport;

    const setDrawerKeyboardInset = (inset: number) => {
      rootElement.style.setProperty(
        DrawerViewportCssVars.keyboardInset,
        `${Math.max(0, Math.ceil(inset))}px`,
      );
    };

    const resetDrawerKeyboardInset = () => {
      setDrawerKeyboardInset(0);
    };

    const clearFocusedKeyboardTarget = () => {
      focusedKeyboardTargetRef.current = null;
      resetDrawerKeyboardInset();
      restoreKeyboardScrollAdjustment();
      keyboardFocusFrame.cancel();
    };

    const alignFocusedKeyboardTarget = () => {
      const target = focusedKeyboardTargetRef.current;
      if (nestedDrawerOpen || !target || !contains(rootElement, target)) {
        resetDrawerKeyboardInset();
        restoreKeyboardScrollAdjustment();
        return;
      }

      const keyboardViewport = getKeyboardVisualViewport(win);
      if (!keyboardViewport) {
        resetDrawerKeyboardInset();
        restoreKeyboardScrollAdjustment();
        return;
      }

      setDrawerKeyboardInset(getDrawerKeyboardInset(win, keyboardViewport));

      const scrollTarget = findKeyboardScrollTarget(target, rootElement);
      if (!scrollTarget) {
        restoreKeyboardScrollAdjustment();
        return;
      }

      if (!scrollTarget.isConnected || !contains(rootElement, scrollTarget)) {
        resetDrawerKeyboardInset();
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
      const targetCenter = (targetRect.top + targetRect.bottom) / 2;
      const visibleCenter = (visibleTop + visibleBottom) / 2;
      const nextScrollTop = scrollTarget.scrollTop + targetCenter - visibleCenter;

      animateKeyboardScroll(scrollTarget, clamp(nextScrollTop, 0, maxScrollTop));
    };

    const scheduleKeyboardFocusAlignment = () => {
      keyboardFocusFrame.request(alignFocusedKeyboardTarget);
    };

    const captureFocusedKeyboardTarget = (target: EventTarget | null) => {
      if (nestedDrawerOpen || !isKeyboardInputTarget(target) || !contains(rootElement, target)) {
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

    const cleanupListeners: Array<() => void> = [];

    if (visualViewport) {
      cleanupListeners.push(
        addEventListener(visualViewport, 'resize', handleViewportUpdate),
        addEventListener(visualViewport, 'scroll', handleViewportUpdate),
      );
    }

    cleanupListeners.push(
      addEventListener(doc, 'focusin', handleFocusIn, true),
      addEventListener(doc, 'focusout', handleFocusOut, true),
    );

    if (captureFocusedKeyboardTarget(activeElement(doc))) {
      scheduleKeyboardFocusAlignment();
    }

    return () => {
      cleanupListeners.forEach((cleanup) => cleanup());
      clearFocusedKeyboardTarget();
      rootElement.style.removeProperty(DrawerViewportCssVars.keyboardInset);
    };
  }, [
    animateKeyboardScroll,
    keyboardFocusFrame,
    mounted,
    nestedDrawerOpen,
    open,
    restoreKeyboardScrollAdjustment,
    rootElement,
    setKeyboardScrollSlack,
  ]);

  const onTouchStart = useStableCallback((event: React.TouchEvent<Element>) => {
    if (!open || !mounted || nestedDrawerOpen) {
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

  const onTouchMove = useStableCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    const touchStart = keyboardTouchStartRef.current;

    if (!touch || !touchStart || pendingKeyboardFocusMovedRef.current) {
      return;
    }

    // Treat the gesture as a scroll/swipe (not a tap-to-focus) once the finger
    // moves past the threshold, so we don't open the keyboard on a drag.
    if (
      Math.abs(touch.clientX - touchStart.x) > INPUT_TAP_MOVE_THRESHOLD ||
      Math.abs(touch.clientY - touchStart.y) > INPUT_TAP_MOVE_THRESHOLD
    ) {
      pendingKeyboardFocusMovedRef.current = true;
    }
  });

  const onTouchEnd = useStableCallback((event: React.TouchEvent<Element>) => {
    if (
      !open ||
      !mounted ||
      nestedDrawerOpen ||
      !rootElement ||
      !keyboardTouchStartRef.current ||
      pendingKeyboardFocusMovedRef.current
    ) {
      resetTouchTrackingState();
      return;
    }

    const touch = event.changedTouches[0] ?? event.touches[0];
    const doc = ownerDocument(event.currentTarget);
    const nativeEventTarget = getTarget(event.nativeEvent);
    const keyboardFocusTarget =
      touch &&
      (resolveKeyboardInputTargetFromPoint(doc, touch.clientX, touch.clientY) ??
        resolveKeyboardInputTarget(nativeEventTarget));

    if (keyboardFocusTarget && !contains(rootElement, keyboardFocusTarget)) {
      resetTouchTrackingState();
      return;
    }

    if (keyboardFocusTarget) {
      const win = ownerWindow(keyboardFocusTarget);

      // While pinch-zoomed, keyboard alignment is suspended; let native behavior
      // handle focus and caret placement instead of blurring and re-focusing.
      if (win.visualViewport && win.visualViewport.scale !== 1) {
        resetTouchTrackingState();
        return;
      }

      // Already focused with the keyboard up: let the native tap through so it can
      // reposition the caret, rather than blurring and re-focusing the same input.
      if (
        activeElement(ownerDocument(keyboardFocusTarget)) === keyboardFocusTarget &&
        isKeyboardVisualViewportOpen(win)
      ) {
        resetTouchTrackingState();
        return;
      }

      // iOS only opens the software keyboard when focus happens synchronously
      // inside the touch gesture.
      event.preventDefault();
      focusKeyboardInputWithoutPageScroll(keyboardFocusTarget);
      // Preventing the touchend default also suppresses the compatibility mouse
      // events, including `click`; redispatch it so click handlers still run.
      // Caveat: unlike a native tap, this click is untrusted with zeroed
      // coordinates (`isTrusted: false`, `clientX/Y: 0`, `detail: 0`).
      keyboardFocusTarget.click();
      resetTouchTrackingState();
      return;
    }

    resetTouchTrackingState();
  });

  const contextValue = React.useMemo<DrawerVirtualKeyboardContextValue>(
    () => ({
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: resetTouchTrackingState,
    }),
    [onTouchEnd, onTouchMove, onTouchStart, resetTouchTrackingState],
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

  return element instanceof win.HTMLInputElement && KEYBOARD_INPUT_TYPES.has(element.type);
}

function isKeyboardInputTarget(target: EventTarget | null): target is HTMLElement {
  return isHTMLElement(target) && isKeyboardInputElement(target);
}

function resolveKeyboardInputTarget(target: EventTarget | null): HTMLElement | null {
  if (!isHTMLElement(target)) {
    return null;
  }

  if (isKeyboardInputElement(target)) {
    return target.isContentEditable ? getContentEditableHost(target) : target;
  }

  const label = target.closest('label') as HTMLLabelElement | null;
  const control = label?.control ?? null;

  return isHTMLElement(control) && isKeyboardInputElement(control) ? control : null;
}

// Inherited-editable descendants (no `contenteditable` attribute of their own) are not
// focusable, so focusing them is a no-op; resolve taps on them to the editing host.
function getContentEditableHost(element: HTMLElement): HTMLElement {
  let host = element;
  while (host.parentElement?.isContentEditable) {
    host = host.parentElement;
  }
  return host;
}

function resolveKeyboardInputTargetFromPoint(
  doc: Document,
  clientX: number,
  clientY: number,
): HTMLElement | null {
  const exactTarget = getElementAtPoint(doc, clientX, clientY);
  const exactKeyboardTarget = resolveKeyboardInputTarget(exactTarget);
  if (exactKeyboardTarget) {
    return exactKeyboardTarget;
  }

  // Probing nearby points compensates for iOS retargeting taps while the page reacts
  // to the keyboard, but it must not steal a tap that lands on another interactive
  // element — that would suppress its click and focus a neighboring field instead.
  // `closest('label')` covers labels of non-keyboard controls (e.g. checkboxes).
  if (isInteractiveElement(exactTarget) || exactTarget?.closest('label') != null) {
    return null;
  }

  for (const [offsetX, offsetY] of [
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
  const wasFocused = activeElement(ownerDocument(target)) === target;
  const previousOpacity = target.style.opacity;
  const previousTransform = target.style.transform;
  const previousTransition = target.style.transition;

  // iOS Safari can still scroll the page for transformed sheets even with preventScroll.
  // Move the input off-screen only for the synchronous focus call.
  target.style.transition = 'none';
  target.style.opacity = '0';
  target.style.transform = 'translateY(-2000px)';
  try {
    if (wasFocused) {
      target.blur();
    }
    target.focus({ preventScroll: true });
  } finally {
    target.style.opacity = previousOpacity;
    target.style.transform = previousTransform;
    target.style.transition = previousTransition;
  }
}

function findKeyboardScrollTarget(target: HTMLElement, root: HTMLElement): HTMLElement | null {
  // Start at the parent: scrolling the focused field's own content (an overflowing
  // textarea is scrollable itself) can never move its box out from under the keyboard.
  return (
    findScrollableTouchTarget(target.parentElement, root, 'vertical') ??
    findPotentialScrollAncestor(target, root)
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
  // Keyboard slack can make a same-height container scrollable, so overflow intent is enough here.
  const styles = getComputedStyle(element);
  return (styles.overflowY === 'auto' || styles.overflowY === 'scroll') && element.clientHeight > 0;
}

function getKeyboardVisualViewport(win: Window): KeyboardVisualViewport | null {
  const visualViewport = win.visualViewport;

  if (!visualViewport || visualViewport.scale !== 1) {
    return null;
  }

  const reducedHeight = win.innerHeight - visualViewport.height;
  // Treat small viewport changes as browser chrome movement, not the software keyboard.
  if (reducedHeight <= KEYBOARD_RESIZE_THRESHOLD) {
    return null;
  }

  const top = Math.max(0, visualViewport.offsetTop);
  return {
    top,
    bottom: Math.min(win.innerHeight, top + visualViewport.height),
  };
}

function getDrawerKeyboardInset(win: Window, keyboardViewport: KeyboardVisualViewport): number {
  return Math.max(0, win.innerHeight - keyboardViewport.bottom);
}

function isKeyboardVisualViewportOpen(win: Window): boolean {
  return !win.visualViewport || getKeyboardVisualViewport(win) != null;
}
