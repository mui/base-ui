import { isIOS } from './detectBrowser';
import { useEnhancedEffect } from './useEnhancedEffect';

let originalHtmlStyles = {};
let originalBodyStyles = {};
let preventScrollCount = 0;
let restore: () => void = () => {};

function preventScrollIOS() {
  // To implement
  return () => {};
}

function preventScrollStandard() {
  const html = document.documentElement;
  const body = document.body;
  const htmlStyle = html.style;
  const bodyStyle = body.style;

  let resizeRaf: number;
  let scrollX: number;
  let scrollY: number;

  function lockScroll() {
    const htmlComputedStyles = getComputedStyle(html);
    const bodyComputedStyles = getComputedStyle(body);
    const hasConstantOverflowY =
      htmlComputedStyles.overflowY === 'scroll' || bodyComputedStyles.overflowY === 'scroll';
    const hasConstantOverflowX =
      htmlComputedStyles.overflowX === 'scroll' || bodyComputedStyles.overflowX === 'scroll';

    scrollX = htmlStyle.left ? parseFloat(htmlStyle.left) : window.scrollX;
    scrollY = htmlStyle.top ? parseFloat(htmlStyle.top) : window.scrollY;

    originalHtmlStyles = {
      position: htmlStyle.position,
      top: htmlStyle.top,
      left: htmlStyle.left,
      right: htmlStyle.right,
      overflowX: htmlStyle.overflowX,
      overflowY: htmlStyle.overflowY,
    };
    originalBodyStyles = {
      overflowX: bodyStyle.overflowX,
      overflowY: bodyStyle.overflowY,
    };

    // Handle `scrollbar-gutter` in Chrome when there is no scrollable content.
    const isScrollableY = html.scrollHeight > html.clientHeight;
    const isScrollableX = html.scrollWidth > html.clientWidth;

    if (isScrollableY || isScrollableX) {
      Object.assign(htmlStyle, {
        position: 'fixed',
        top: `${-scrollY}px`,
        left: `${-scrollX}px`,
        right: '0',
      });
    }

    Object.assign(htmlStyle, {
      overflowY: isScrollableY || hasConstantOverflowY ? 'scroll' : 'hidden',
      overflowX: isScrollableX || hasConstantOverflowX ? 'scroll' : 'hidden',
    });

    // Ensure two scrollbars can't appear since `<html>` now has a forced scrollbar, but the
    // `<body>` may have one too.
    if (isScrollableY || hasConstantOverflowY) {
      bodyStyle.overflowY = 'hidden';
    }
    if (isScrollableX || hasConstantOverflowX) {
      bodyStyle.overflowX = 'hidden';
    }
  }

  function cleanup() {
    Object.assign(htmlStyle, originalHtmlStyles);
    Object.assign(bodyStyle, originalBodyStyles);

    if (window.scrollTo.toString().includes('[native code]')) {
      window.scrollTo(scrollX, scrollY);
    }
  }

  function handleResize() {
    cleanup();
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(lockScroll);
  }

  lockScroll();
  window.addEventListener('resize', handleResize);

  return () => {
    cleanup();
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 */
export function useScrollLock(enabled: boolean = true) {
  useEnhancedEffect(() => {
    if (!enabled) {
      return undefined;
    }

    preventScrollCount += 1;
    if (preventScrollCount === 1) {
      restore = isIOS() ? preventScrollIOS() : preventScrollStandard();
    }

    return () => {
      preventScrollCount -= 1;
      if (preventScrollCount === 0) {
        restore();
      }
    };
  }, [enabled]);
}
