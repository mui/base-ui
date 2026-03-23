'use client';
import { isOverflowElement } from '@floating-ui/utils/dom';
import { isIOS, isWebKit } from './detectBrowser';
import { ownerDocument, ownerWindow } from './owner';
import { useIsoLayoutEffect } from './useIsoLayoutEffect';
import { Timeout } from './useTimeout';
import { AnimationFrame } from './useAnimationFrame';
import { NOOP } from './empty';

interface TouchScrollState {
  startX: number;
  startY: number;
  verticalScrollTarget: HTMLElement | null;
  horizontalScrollTarget: HTMLElement | null;
}

type TouchWithTouchType = Touch & { touchType: string | undefined };
type EventWithPointerType = { pointerType: PointerEvent['pointerType'] };
type ScrollAxis = 'horizontal' | 'vertical';
type WindowWithGlobals = Window & typeof globalThis;

function isStylusTouch(event: TouchEvent) {
  const touch = event.touches[0] ?? event.changedTouches[0];
  const touchType = (touch as TouchWithTouchType | undefined)?.touchType;
  const pointerType = (event as unknown as EventWithPointerType).pointerType;
  return touchType === 'stylus' || touchType === 'pen' || pointerType === 'pen';
}

function getDominantScrollAxis(touchState: TouchScrollState, touch: Touch): ScrollAxis {
  const deltaX = Math.abs(touch.clientX - touchState.startX);
  const deltaY = Math.abs(touch.clientY - touchState.startY);
  return deltaX > deltaY ? 'horizontal' : 'vertical';
}

function isScrollable(element: HTMLElement, axis: ScrollAxis): boolean {
  const style = getComputedStyle(element);

  if (axis === 'vertical') {
    const overflowY = style.overflowY;
    return (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      element.scrollHeight > element.clientHeight
    );
  }

  const overflowX = style.overflowX;
  return (
    (overflowX === 'auto' || overflowX === 'scroll') && element.scrollWidth > element.clientWidth
  );
}

function findScrollableTouchTarget(
  target: EventTarget | null,
  root: HTMLElement,
  axis: ScrollAxis = 'vertical',
): HTMLElement | null {
  const defaultView = root.ownerDocument.defaultView;
  let node = defaultView && target instanceof defaultView.HTMLElement ? target : null;
  while (node && node !== root) {
    if (isScrollable(node, axis)) {
      return node;
    }
    node = node.parentElement;
  }

  return isScrollable(root, axis) ? root : null;
}

function getScrollMetrics(scrollTarget: HTMLElement, axis: ScrollAxis) {
  if (axis === 'vertical') {
    const max = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight);
    return { offset: scrollTarget.scrollTop, max };
  }

  const max = Math.max(0, scrollTarget.scrollWidth - scrollTarget.clientWidth);
  return { offset: scrollTarget.scrollLeft, max };
}

function isTextSelectionControl(
  target: EventTarget | null,
  win: WindowWithGlobals,
): target is HTMLInputElement | HTMLTextAreaElement {
  return target instanceof win.HTMLInputElement || target instanceof win.HTMLTextAreaElement;
}

function hasExpandedSelectionWithinTarget(selection: Selection, target: Element): boolean {
  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;
  const anchorElement = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
  const focusElement = focusNode instanceof Element ? focusNode : focusNode?.parentElement;

  return (
    selection.containsNode(target, true) ||
    target.contains(anchorElement ?? null) ||
    target.contains(focusElement ?? null)
  );
}

function shouldIgnoreTouchMoveForSelection(
  doc: Document,
  target: Element,
  win: WindowWithGlobals,
): boolean {
  const activeElement = doc.activeElement;
  const activeElementWithinTarget = Boolean(activeElement && target.contains(activeElement));

  if (activeElementWithinTarget && isTextSelectionControl(activeElement, win)) {
    const { selectionStart, selectionEnd } = activeElement;
    if (selectionStart != null && selectionEnd != null && selectionStart < selectionEnd) {
      return true;
    }
  }

  const selection = doc.getSelection?.();
  if (!selection || selection.isCollapsed) {
    return false;
  }

  return hasExpandedSelectionWithinTarget(selection, target);
}

function isRangeInput(
  target: EventTarget | null,
  win: WindowWithGlobals,
): target is HTMLInputElement {
  return target instanceof win.HTMLInputElement && target.type === 'range';
}

function isEventOnRangeInput(event: TouchEvent, win: WindowWithGlobals): boolean {
  const composedPath = event.composedPath();
  if (composedPath) {
    return composedPath.some((pathTarget) => isRangeInput(pathTarget, win));
  }

  return isRangeInput(event.target, win);
}

function shouldPreventScrollChaining(
  scrollTarget: HTMLElement,
  axis: ScrollAxis,
  touchState: TouchScrollState,
  touch: Touch,
): boolean {
  const { offset, max } = getScrollMetrics(scrollTarget, axis);
  const delta =
    axis === 'vertical' ? touch.clientY - touchState.startY : touch.clientX - touchState.startX;

  if (delta > 0) {
    return offset <= 0;
  }

  if (delta < 0) {
    return offset >= max;
  }

  return false;
}

export function preventScrollIOS(referenceElement: Element | null = null) {
  const doc = ownerDocument(referenceElement);
  const win = ownerWindow(doc) as WindowWithGlobals;

  let touchState: TouchScrollState | null = null;
  let allowTouchMove = false;
  let stylusActive = false;

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    const target = event.target;

    stylusActive = isStylusTouch(event);
    allowTouchMove =
      stylusActive ||
      isEventOnRangeInput(event, win) ||
      (target instanceof win.Element && shouldIgnoreTouchMoveForSelection(doc, target, win));

    if (!touch) {
      touchState = null;
      return;
    }

    touchState = {
      startX: touch.clientX,
      startY: touch.clientY,
      verticalScrollTarget: findScrollableTouchTarget(target, doc.documentElement, 'vertical'),
      horizontalScrollTarget: findScrollableTouchTarget(target, doc.documentElement, 'horizontal'),
    };
  }

  function onTouchMove(event: TouchEvent) {
    const touch = event.touches[0];

    if (!touch || event.touches.length === 2 || allowTouchMove || stylusActive) {
      return;
    }

    const activeTouchState = touchState;
    if (!activeTouchState) {
      return;
    }

    const axis = getDominantScrollAxis(activeTouchState, touch);
    const scrollTarget =
      axis === 'vertical'
        ? activeTouchState.verticalScrollTarget
        : activeTouchState.horizontalScrollTarget;

    const isScrollRoot =
      !scrollTarget || scrollTarget === doc.documentElement || scrollTarget === doc.body;

    if (isScrollRoot && event.cancelable) {
      event.preventDefault();
    } else if (
      scrollTarget &&
      shouldPreventScrollChaining(scrollTarget, axis, activeTouchState, touch) &&
      event.cancelable
    ) {
      event.preventDefault();
    }
  }

  const touchOptions = { passive: false, capture: true };
  doc.addEventListener('touchstart', onTouchStart, touchOptions);
  doc.addEventListener('touchmove', onTouchMove, touchOptions);

  return () => {
    doc.removeEventListener('touchstart', onTouchStart, touchOptions);
    doc.removeEventListener('touchmove', onTouchMove, touchOptions);
  };
}

let originalHtmlStyles: Partial<CSSStyleDeclaration> = {};
let originalBodyStyles: Partial<CSSStyleDeclaration> = {};
let originalHtmlScrollBehavior = '';

function hasInsetScrollbars(referenceElement: Element | null) {
  if (typeof document === 'undefined') {
    return false;
  }
  const doc = ownerDocument(referenceElement);
  const win = ownerWindow(doc);
  return win.innerWidth - doc.documentElement.clientWidth > 0;
}

function supportsStableScrollbarGutter(referenceElement: Element | null) {
  const supported =
    typeof CSS !== 'undefined' && CSS.supports && CSS.supports('scrollbar-gutter', 'stable');

  if (!supported || typeof document === 'undefined') {
    return false;
  }

  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;

  const scrollContainer = isOverflowElement(html) ? html : body;

  const originalScrollContainerOverflowY = scrollContainer.style.overflowY;
  const originalHtmlStyleGutter = html.style.scrollbarGutter;

  html.style.scrollbarGutter = 'stable';

  scrollContainer.style.overflowY = 'scroll';
  const before = scrollContainer.offsetWidth;

  scrollContainer.style.overflowY = 'hidden';
  const after = scrollContainer.offsetWidth;

  scrollContainer.style.overflowY = originalScrollContainerOverflowY;
  html.style.scrollbarGutter = originalHtmlStyleGutter;

  return before === after;
}

function preventScrollOverlayScrollbars(referenceElement: Element | null) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;

  // If an `overflow` style is present on <html>, we need to lock it, because a lock on <body>
  // won't have any effect.
  // But if <body> has an `overflow` style (like `overflow-x: hidden`), we need to lock it
  // instead, as sticky elements shift otherwise.
  const elementToLock = isOverflowElement(html) ? html : body;
  const originalElementToLockStyles = {
    overflowY: elementToLock.style.overflowY,
    overflowX: elementToLock.style.overflowX,
  };

  Object.assign(elementToLock.style, {
    overflowY: 'hidden',
    overflowX: 'hidden',
  });

  return () => {
    Object.assign(elementToLock.style, originalElementToLockStyles);
  };
}

function preventScrollInsetScrollbars(referenceElement: Element | null) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;
  const win = ownerWindow(html);

  let scrollTop = 0;
  let scrollLeft = 0;
  let updateGutterOnly = false;
  const resizeFrame = AnimationFrame.create();

  // Pinch-zoom in Safari causes a shift. Just don't lock scroll if there's any pinch-zoom.
  if (isWebKit && (win.visualViewport?.scale ?? 1) !== 1) {
    return () => {};
  }

  function lockScroll() {
    /* DOM reads: */

    const htmlStyles = win.getComputedStyle(html);
    const bodyStyles = win.getComputedStyle(body);
    const htmlScrollbarGutterValue = htmlStyles.scrollbarGutter || '';
    const hasBothEdges = htmlScrollbarGutterValue.includes('both-edges');
    const scrollbarGutterValue = hasBothEdges ? 'stable both-edges' : 'stable';

    scrollTop = html.scrollTop;
    scrollLeft = html.scrollLeft;

    originalHtmlStyles = {
      scrollbarGutter: html.style.scrollbarGutter,
      overflowY: html.style.overflowY,
      overflowX: html.style.overflowX,
    };
    originalHtmlScrollBehavior = html.style.scrollBehavior;

    originalBodyStyles = {
      position: body.style.position,
      height: body.style.height,
      width: body.style.width,
      boxSizing: body.style.boxSizing,
      overflowY: body.style.overflowY,
      overflowX: body.style.overflowX,
      scrollBehavior: body.style.scrollBehavior,
    };

    const isScrollableY = html.scrollHeight > html.clientHeight;
    const isScrollableX = html.scrollWidth > html.clientWidth;
    const hasConstantOverflowY =
      htmlStyles.overflowY === 'scroll' || bodyStyles.overflowY === 'scroll';
    const hasConstantOverflowX =
      htmlStyles.overflowX === 'scroll' || bodyStyles.overflowX === 'scroll';

    // Values can be negative in Firefox
    const scrollbarWidth = Math.max(0, win.innerWidth - body.clientWidth);
    const scrollbarHeight = Math.max(0, win.innerHeight - body.clientHeight);

    // Avoid shift due to the default <body> margin. This does cause elements to be clipped
    // with whitespace. Warn if <body> has margins?
    const marginY = parseFloat(bodyStyles.marginTop) + parseFloat(bodyStyles.marginBottom);
    const marginX = parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight);
    const elementToLock = isOverflowElement(html) ? html : body;

    updateGutterOnly = supportsStableScrollbarGutter(referenceElement);

    /*
     * DOM writes:
     * Do not read the DOM past this point!
     */

    if (updateGutterOnly) {
      html.style.scrollbarGutter = scrollbarGutterValue;
      elementToLock.style.overflowY = 'hidden';
      elementToLock.style.overflowX = 'hidden';
      return;
    }

    Object.assign(html.style, {
      scrollbarGutter: scrollbarGutterValue,
      overflowY: 'hidden',
      overflowX: 'hidden',
    });

    if (isScrollableY || hasConstantOverflowY) {
      html.style.overflowY = 'scroll';
    }
    if (isScrollableX || hasConstantOverflowX) {
      html.style.overflowX = 'scroll';
    }

    Object.assign(body.style, {
      position: 'relative',
      height:
        marginY || scrollbarHeight ? `calc(100dvh - ${marginY + scrollbarHeight}px)` : '100dvh',
      width: marginX || scrollbarWidth ? `calc(100vw - ${marginX + scrollbarWidth}px)` : '100vw',
      boxSizing: 'border-box',
      overflow: 'hidden',
      scrollBehavior: 'unset',
    });

    body.scrollTop = scrollTop;
    body.scrollLeft = scrollLeft;
    html.setAttribute('data-base-ui-scroll-locked', '');
    html.style.scrollBehavior = 'unset';
  }

  function cleanup() {
    Object.assign(html.style, originalHtmlStyles);
    Object.assign(body.style, originalBodyStyles);

    if (!updateGutterOnly) {
      html.scrollTop = scrollTop;
      html.scrollLeft = scrollLeft;
      html.removeAttribute('data-base-ui-scroll-locked');
      html.style.scrollBehavior = originalHtmlScrollBehavior;
    }
  }

  function handleResize() {
    cleanup();
    resizeFrame.request(lockScroll);
  }

  lockScroll();
  win.addEventListener('resize', handleResize);

  return () => {
    resizeFrame.cancel();
    cleanup();
    // Sometimes this cleanup can be run after test teardown
    // because it is called in a `setTimeout(fn, 0)`,
    // in which case `removeEventListener` wouldn't be available,
    // so we check for it to avoid test failures.
    if (typeof win.removeEventListener === 'function') {
      win.removeEventListener('resize', handleResize);
    }
  };
}

class ScrollLocker {
  lockCount = 0;
  restore = null as (() => void) | null;
  timeoutLock = Timeout.create();
  timeoutUnlock = Timeout.create();

  acquire(referenceElement: Element | null) {
    this.lockCount += 1;
    if (this.lockCount === 1 && this.restore === null) {
      this.timeoutLock.start(0, () => this.lock(referenceElement));
    }
    return this.release;
  }

  release = () => {
    this.lockCount -= 1;
    if (this.lockCount === 0 && this.restore) {
      this.timeoutUnlock.start(0, this.unlock);
    }
  };

  private unlock = () => {
    if (this.lockCount === 0 && this.restore) {
      this.restore();
      this.restore = null;
    }
  };

  private lock(referenceElement: Element | null) {
    if (this.lockCount === 0 || this.restore !== null) {
      return;
    }

    const doc = ownerDocument(referenceElement);
    const html = doc.documentElement;
    const htmlOverflowY = ownerWindow(html).getComputedStyle(html).overflowY;

    // If the site author already hid overflow on <html>, respect it and bail out.
    if (htmlOverflowY === 'hidden' || htmlOverflowY === 'clip') {
      this.restore = NOOP;
      return;
    }

    if (isIOS) {
      const restoreOverlayScrollbars = preventScrollOverlayScrollbars(referenceElement);
      const restoreIOS = preventScrollIOS(referenceElement);
      this.restore = () => {
        restoreIOS();
        restoreOverlayScrollbars();
      };
      return;
    }

    this.restore = !hasInsetScrollbars(referenceElement)
      ? preventScrollOverlayScrollbars(referenceElement)
      : preventScrollInsetScrollbars(referenceElement);
  }
}

const SCROLL_LOCKER = new ScrollLocker();

/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 * @param referenceElement - Element to use as a reference for lock calculations.
 */
export function useScrollLock(enabled: boolean = true, referenceElement: Element | null = null) {
  useIsoLayoutEffect(() => {
    if (!enabled) {
      return undefined;
    }
    return SCROLL_LOCKER.acquire(referenceElement);
  }, [enabled, referenceElement]);
}
