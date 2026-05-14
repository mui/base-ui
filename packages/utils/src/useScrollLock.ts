'use client';
import { isOverflowElement } from '@floating-ui/utils/dom';
import { addEventListener } from './addEventListener';
import { isIOS, isWebKit } from './detectBrowser';
import { ownerDocument, ownerWindow } from './owner';
import { useIsoLayoutEffect } from './useIsoLayoutEffect';
import { Timeout } from './useTimeout';
import { AnimationFrame } from './useAnimationFrame';
import { NOOP } from './empty';

let originalHtmlStyles: Partial<CSSStyleDeclaration> = {};
let originalBodyStyles: Partial<CSSStyleDeclaration> = {};
let originalHtmlScrollBehavior = '';

function hasInsetScrollbars(referenceElement: Element | null) {
  const doc = ownerDocument(referenceElement);
  const win = ownerWindow(doc);
  return win.innerWidth - doc.documentElement.clientWidth > 0;
}

function supportsStableScrollbarGutter(referenceElement: Element | null) {
  const supported = typeof CSS !== 'undefined' && CSS.supports?.('scrollbar-gutter', 'stable');

  if (!supported) {
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
    return NOOP;
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
  const unsubscribeResize = addEventListener(win, 'resize', handleResize);

  return () => {
    resizeFrame.cancel();
    cleanup();
    // Sometimes this cleanup can run after test teardown because it is called
    // in a `setTimeout(fn, 0)`. Guard the returned cleanup to avoid calling
    // `removeEventListener` when it is no longer available in tests.
    if (typeof win.removeEventListener === 'function') {
      unsubscribeResize();
    }
  };
}

let lockCount = 0;
let restore: (() => void) | null = null;
const timeoutLock = Timeout.create();
const timeoutUnlock = Timeout.create();

function unlock() {
  if (lockCount === 0 && restore) {
    restore();
    restore = null;
  }
}

function release() {
  lockCount -= 1;
  if (lockCount === 0 && restore) {
    timeoutUnlock.start(0, unlock);
  }
}

function lock(referenceElement: Element | null) {
  if (lockCount === 0 || restore !== null) {
    return;
  }

  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const htmlOverflowY = ownerWindow(html).getComputedStyle(html).overflowY;

  // If the site author already hid overflow on <html>, respect it and bail out.
  if (htmlOverflowY === 'hidden' || htmlOverflowY === 'clip') {
    restore = NOOP;
    return;
  }

  const hasOverlayScrollbars = isIOS || !hasInsetScrollbars(referenceElement);

  // On iOS, scroll locking does not work if the navbar is collapsed. Due to numerous
  // side effects and bugs that arise on iOS, it must be researched extensively before
  // being enabled to ensure it doesn't cause the following issues:
  // - Textboxes must scroll into view when focused, nor cause a glitchy scroll animation.
  // - The navbar must not force itself into view and cause layout shift.
  // - Scroll containers must not flicker upon closing a popup when it has an exit animation.
  restore = hasOverlayScrollbars
    ? preventScrollOverlayScrollbars(referenceElement)
    : preventScrollInsetScrollbars(referenceElement);
}

function acquire(referenceElement: Element | null) {
  lockCount += 1;
  if (lockCount === 1 && restore === null) {
    timeoutLock.start(0, () => lock(referenceElement));
  }
  return release;
}

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
    return acquire(referenceElement);
  }, [enabled, referenceElement]);
}
