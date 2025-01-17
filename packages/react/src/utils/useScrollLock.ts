import * as React from 'react';
import { usePreventScroll } from '@react-aria/overlays';
import { isFirefox, isIOS, isWebKit } from './detectBrowser';
import { ownerDocument, ownerWindow } from './owner';
import { useEnhancedEffect } from './useEnhancedEffect';

let originalHtmlStyles: Partial<CSSStyleDeclaration> = {};
let originalBodyStyles: Partial<CSSStyleDeclaration> = {};
let originalHtmlScrollBehavior = '';
let preventScrollCount = 0;
let restore: () => void = () => {};

function supportsDvh() {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('height', '1dvh')
  );
}

function hasInsetScrollbars(referenceElement?: Element | null) {
  if (typeof document === 'undefined') {
    return false;
  }
  const doc = ownerDocument(referenceElement);
  const win = ownerWindow(doc);
  return win.innerWidth - doc.documentElement.clientWidth > 0;
}

function preventScrollStandard(referenceElement?: Element | null) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;
  const win = ownerWindow(html);

  let scrollTop = 0;
  let scrollLeft = 0;
  let resizeRaf = -1;

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
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(lockScroll);
  }

  lockScroll();
  win.addEventListener('resize', handleResize);

  return () => {
    cancelAnimationFrame(resizeRaf);
    cleanup();
    win.removeEventListener('resize', handleResize);
  };
}

/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 */
export function useScrollLock(enabled: boolean = true, referenceElement?: Element | null) {
  const isReactAriaHook = React.useMemo(
    () =>
      enabled &&
      (isIOS() ||
        !supportsDvh() ||
        // macOS Firefox "pops" scroll containers' scrollbars with our standard scroll lock
        (isFirefox() && !hasInsetScrollbars())),
    [enabled],
  );

  usePreventScroll({
    // react-aria will remove the scrollbar offset immediately upon close, since we use `open`,
    // not `mounted`, to disable/enable the scroll lock. However since there are no inset
    // scrollbars, no layouting issues occur.
    isDisabled: !isReactAriaHook,
  });

  useEnhancedEffect(() => {
    if (!enabled || isReactAriaHook) {
      return undefined;
    }

    preventScrollCount += 1;
    if (preventScrollCount === 1) {
      restore = preventScrollStandard(referenceElement);
    }

    return () => {
      preventScrollCount -= 1;
      if (preventScrollCount === 0) {
        restore();
      }
    };
  }, [enabled, isReactAriaHook, referenceElement]);
}
