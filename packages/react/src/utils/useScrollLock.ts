import * as React from 'react';
import { isFirefox, isIOS, isWebKit } from './detectBrowser';
import { ownerDocument, ownerWindow } from './owner';
import { useLayoutEffect } from './useLayoutEffect';
import { AnimationFrame } from './useAnimationFrame';

let originalHtmlStyles: Partial<CSSStyleDeclaration> = {};
let originalBodyStyles: Partial<CSSStyleDeclaration> = {};
let originalHtmlScrollBehavior = '';
let preventScrollCount = 0;
let restore: () => void = () => {};

export function getPreventScrollCount() {
  return preventScrollCount;
}

function hasInsetScrollbars(referenceElement: Element | null) {
  if (typeof document === 'undefined') {
    return false;
  }
  const doc = ownerDocument(referenceElement);
  const win = ownerWindow(doc);
  return win.innerWidth - doc.documentElement.clientWidth > 0;
}

function preventScrollBasic(referenceElement: Element | null) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const originalOverflow = html.style.overflow;
  html.style.overflow = 'hidden';
  return () => {
    html.style.overflow = originalOverflow;
  };
}

function preventScrollStandard(referenceElement: Element | null) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;
  const win = ownerWindow(html);

  let scrollTop = 0;
  let scrollLeft = 0;
  const resizeFrame = AnimationFrame.create();

  // Pinch-zoom in Safari causes a shift. Just don't lock scroll if there's any pinch-zoom.
  if (isWebKit() && (win.visualViewport?.scale ?? 1) !== 1) {
    return () => {};
  }

  function lockScroll() {
    const htmlStyles = win.getComputedStyle(html);
    const bodyStyles = win.getComputedStyle(body);

    scrollTop = html.scrollTop;
    scrollLeft = html.scrollLeft;

    originalHtmlStyles = {
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

    // Handle `scrollbar-gutter` in Chrome when there is no scrollable content.
    const hasScrollbarGutterStable = htmlStyles.scrollbarGutter?.includes('stable');

    const isScrollableY = html.scrollHeight > html.clientHeight;
    const isScrollableX = html.scrollWidth > html.clientWidth;
    const hasConstantOverflowY =
      htmlStyles.overflowY === 'scroll' || bodyStyles.overflowY === 'scroll';
    const hasConstantOverflowX =
      htmlStyles.overflowX === 'scroll' || bodyStyles.overflowX === 'scroll';

    // Values can be negative in Firefox
    const scrollbarWidth = Math.max(0, win.innerWidth - html.clientWidth);
    const scrollbarHeight = Math.max(0, win.innerHeight - html.clientHeight);

    Object.assign(html.style, {
      overflowY:
        !hasScrollbarGutterStable && (isScrollableY || hasConstantOverflowY) ? 'scroll' : 'hidden',
      overflowX:
        !hasScrollbarGutterStable && (isScrollableX || hasConstantOverflowX) ? 'scroll' : 'hidden',
    });

    // Avoid shift due to the default <body> margin. This does cause elements to be clipped
    // with whitespace. Warn if <body> has margins?
    const marginY = parseFloat(bodyStyles.marginTop) + parseFloat(bodyStyles.marginBottom);
    const marginX = parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight);

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
    html.scrollTop = scrollTop;
    html.scrollLeft = scrollLeft;
    html.removeAttribute('data-base-ui-scroll-locked');
    html.style.scrollBehavior = originalHtmlScrollBehavior;
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
    win.removeEventListener('resize', handleResize);
  };
}

/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 */
export function useScrollLock(params: {
  enabled?: boolean;
  mounted: boolean;
  open: boolean;
  referenceElement?: Element | null;
}) {
  const { enabled = true, mounted, open, referenceElement = null } = params;

  const isOverflowHiddenLock = React.useMemo(
    () => enabled && (isIOS() || (isFirefox() && !hasInsetScrollbars(referenceElement))),
    [enabled, referenceElement],
  );

  useLayoutEffect(() => {
    // https://github.com/mui/base-ui/issues/1135
    if (mounted && !open && isWebKit()) {
      const doc = ownerDocument(referenceElement);
      const originalUserSelect = doc.body.style.userSelect;
      const originalWebkitUserSelect = doc.body.style.webkitUserSelect;
      doc.body.style.userSelect = 'none';
      doc.body.style.webkitUserSelect = 'none';
      return () => {
        doc.body.style.userSelect = originalUserSelect;
        doc.body.style.webkitUserSelect = originalWebkitUserSelect;
      };
    }
    return undefined;
  }, [mounted, open, referenceElement]);

  useLayoutEffect(() => {
    if (!enabled) {
      return undefined;
    }

    preventScrollCount += 1;
    if (preventScrollCount === 1) {
      // Firefox on macOS with overlay scrollbars uses a basic scroll lock that doesn't
      // need the inset scrollbars handling to prevent overlay scrollbars from appearing
      // on scroll containers briefly whenever the lock is enabled.
      // On iOS, scroll locking does not work if the navbar is collapsed. Due to numerous
      // side effects and bugs that arise on iOS, it must be researched extensively before
      // being enabled to ensure it doesn't cause the following issues:
      // - Textboxes must scroll into view when focused, nor cause a glitchy scroll animation.
      // - The navbar must not force itself into view and cause layout shift.
      // - Scroll containers must not flicker upon closing a popup when it has an exit animation.
      restore = isOverflowHiddenLock
        ? preventScrollBasic(referenceElement)
        : preventScrollStandard(referenceElement);
    }

    return () => {
      preventScrollCount -= 1;
      if (preventScrollCount === 0) {
        restore();
      }
    };
  }, [enabled, isOverflowHiddenLock, referenceElement]);
}
