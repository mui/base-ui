'use client';
import { isOverflowElement } from '@floating-ui/utils/dom';
import { isIOS, isWebKit } from './detectBrowser';
import { ownerDocument, ownerWindow } from './owner';
import { useIsoLayoutEffect } from './useIsoLayoutEffect';
import { Timeout } from './useTimeout';
import { AnimationFrame } from './useAnimationFrame';
import { NOOP } from './empty';

export function preventScrollIOS(referenceElement: Element | null = null) {
  const doc = ownerDocument(referenceElement);
  const win = ownerWindow(doc);

  function isStylusTouch(event: TouchEvent) {
    const touch = event.touches[0] ?? event.changedTouches[0];
    const touchType = (touch as { touchType?: string | undefined } | undefined)?.touchType;
    const pointerType = (event as { pointerType?: string | undefined } | undefined)?.pointerType;
    return touchType === 'stylus' || touchType === 'pen' || pointerType === 'pen';
  }

  function isScrollable(element: Element | null) {
    if (!element) {
      return false;
    }

    const style = win.getComputedStyle(element);

    let result = /(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY);

    if (result) {
      result =
        element.scrollHeight !== element.clientHeight ||
        element.scrollWidth !== element.clientWidth;
    }

    return result;
  }

  function getScrollParent(element: Element | null) {
    let currentParent: Element | null = element;

    if (currentParent && isScrollable(currentParent)) {
      currentParent = currentParent.parentElement;
    }

    while (currentParent && !isScrollable(currentParent)) {
      currentParent = currentParent.parentElement;
    }

    return currentParent || doc.scrollingElement || doc.documentElement;
  }

  let scrollable: Element | undefined;
  let allowTouchMove = false;
  let stylusActive = false;

  function onTouchStart(event: TouchEvent) {
    const target = event.target as Element | null;
    stylusActive = isStylusTouch(event);
    scrollable = getScrollParent(target);
    allowTouchMove = false;
    if (stylusActive) {
      allowTouchMove = true;
    }

    // Allow the ability to adjust text selection.
    if (target) {
      const selection = target.ownerDocument.defaultView?.getSelection();
      if (selection && !selection.isCollapsed && selection.containsNode(target, true)) {
        allowTouchMove = true;
      }
    }

    // Allow user to drag the selection handles in an input element.
    if (target instanceof win.HTMLInputElement) {
      const input = target;
      if (
        input.selectionStart != null &&
        input.selectionEnd != null &&
        input.selectionStart < input.selectionEnd &&
        doc.activeElement === input
      ) {
        allowTouchMove = true;
      }
    }
  }

  function onTouchMove(event: TouchEvent) {
    // Allow pinch-zooming.
    if (event.touches.length === 2 || allowTouchMove || stylusActive) {
      return;
    }

    if (!scrollable || scrollable === doc.documentElement || scrollable === doc.body) {
      event.preventDefault();
      return;
    }

    if (
      scrollable.scrollHeight === scrollable.clientHeight &&
      scrollable.scrollWidth === scrollable.clientWidth
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

  const originalStyles = {
    scrollbarGutter: html.style.scrollbarGutter,
    overflowY: html.style.overflowY,
  };

  html.style.scrollbarGutter = 'stable';
  html.style.overflowY = 'scroll';
  const before = html.offsetWidth;

  html.style.overflowY = 'hidden';
  const after = html.offsetWidth;

  Object.assign(html.style, originalStyles);
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
  const originalOverflow = elementToLock.style.overflow;
  elementToLock.style.overflow = 'hidden';
  return () => {
    elementToLock.style.overflow = originalOverflow;
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
      this.restore?.();
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
      this.restore = preventScrollIOS(referenceElement);
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
 * @param referenceElement - Element that defines the lock scope. Used for document lookup and iOS gesture handling.
 */
export function useScrollLock(enabled: boolean = true, referenceElement: Element | null = null) {
  useIsoLayoutEffect(() => {
    if (!enabled) {
      return undefined;
    }
    return SCROLL_LOCKER.acquire(referenceElement);
  }, [enabled, referenceElement]);
}
