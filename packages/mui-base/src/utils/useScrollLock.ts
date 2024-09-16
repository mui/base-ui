import { isIOS } from './detectBrowser';
import { useEnhancedEffect } from './useEnhancedEffect';
import { useId } from './useId';

let originalStyles = {};
let originalBodyOverflow = '';

let preventScrollCount = 0;
let restore: () => void = () => {};

function preventScrollIOS() {
  // To implement
  return () => {};
}

function preventScrollStandard() {
  const html = document.documentElement;
  const rootStyle = html.style;
  const bodyStyle = document.body.style;

  let resizeRaf: number;
  let scrollX: number;
  let scrollY: number;

  function lockScroll() {
    const offsetLeft = window.visualViewport?.offsetLeft || 0;
    const offsetTop = window.visualViewport?.offsetTop || 0;

    scrollX = rootStyle.left ? parseFloat(rootStyle.left) : window.scrollX;
    scrollY = rootStyle.top ? parseFloat(rootStyle.top) : window.scrollY;

    originalStyles = {
      position: rootStyle.position,
      top: rootStyle.top,
      left: rootStyle.left,
      right: rootStyle.right,
      overflowX: rootStyle.overflowX,
      overflowY: rootStyle.overflowY,
    };
    originalBodyOverflow = bodyStyle.overflow;

    bodyStyle.overflow = 'hidden';

    Object.assign(rootStyle, {
      // Handle `scrollbar-gutter` in Chrome when there is no scrollable content.
      position: html.scrollHeight > html.clientHeight ? 'fixed' : '',
      top: `${-(scrollY - Math.floor(offsetTop))}px`,
      left: `${-(scrollX - Math.floor(offsetLeft))}px`,
      right: '0',
      overflowY: html.scrollHeight > html.clientHeight ? 'scroll' : 'hidden',
      overflowX: html.scrollWidth > html.clientWidth ? 'scroll' : 'hidden',
    });

    return undefined;
  }

  function cleanup() {
    Object.assign(rootStyle, originalStyles);
    bodyStyle.overflow = originalBodyOverflow;

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
  const id = useId();

  useEnhancedEffect(() => {
    if (!enabled || !id) {
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
  }, [enabled, id]);
}
