import { isIOS } from './detectBrowser';
import { useEnhancedEffect } from './useEnhancedEffect';

let originalRootStyles = {};
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
  const rootStyle = html.style;
  const bodyStyle = body.style;

  let resizeRaf: number;
  let scrollX: number;
  let scrollY: number;

  function lockScroll() {
    const htmlComputedStyles = getComputedStyle(html);
    const hasConstantOverflowY = htmlComputedStyles.overflowY === 'scroll';
    const hasConstantOverflowX = htmlComputedStyles.overflowX === 'scroll';

    scrollX = rootStyle.left ? parseFloat(rootStyle.left) : window.scrollX;
    scrollY = rootStyle.top ? parseFloat(rootStyle.top) : window.scrollY;

    originalRootStyles = {
      position: rootStyle.position,
      top: rootStyle.top,
      left: rootStyle.left,
      right: rootStyle.right,
      overflowX: rootStyle.overflowX,
      overflowY: rootStyle.overflowY,
    };
    originalBodyStyles = {
      overflow: bodyStyle.overflow,
    };

    // Handle `scrollbar-gutter` in Chrome when there is no scrollable content.
    const isScrollableY = html.scrollHeight > html.clientHeight;
    const isScrollableX = html.scrollWidth > html.clientWidth;

    if (isScrollableY) {
      Object.assign(rootStyle, {
        position: 'fixed',
        top: `${-scrollY}px`,
        left: `${-scrollX}px`,
        right: '0',
      });
    }

    Object.assign(rootStyle, {
      overflowY: isScrollableY || hasConstantOverflowY ? 'scroll' : 'hidden',
      overflowX: isScrollableX || hasConstantOverflowX ? 'scroll' : 'hidden',
    });

    // Ensure two scrollbars can't appear since `<html>` now has a forced scrollbar, but the
    // `<body>` may have one too.
    bodyStyle.overflow = 'hidden';
  }

  function cleanup() {
    Object.assign(rootStyle, originalRootStyles);
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
